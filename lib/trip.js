// FURTHER TESTS: Ping receival on geofence trigger
/* Expo packages */
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

/* MobX store */
import store from '../store';

/* Community packages */
import _ from 'lodash';
import { v4 as uuid_v4 } from 'uuid';

/* App library */
import AWS from './aws';
import Realm from './realm';
import { getDistanceBetweenPoints, getTimeBetweenPoints } from './location';
import logger from './log';
import TptyTasks from './tasks';

/* Lib constants */
const FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80; // in KM
const FLIGHT_ALTITUDE_TRIGGER_THRESHOLD = 6000; // in m
const TRIP_DISTANCE_TRIGGER_THRESHOLD = 40; // in KM
const INTERVAL = 900; // in seconds
const TIME_REQUIRED_VISIT = (INTERVAL + INTERVAL/2); // in seconds

function asyncTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Class definition for trips
 */
class TptyTrip {
  isHome(homeCoords, targetCoords) {
    const distance = getDistanceBetweenPoints(homeCoords, targetCoords);
    return (distance < TRIP_DISTANCE_TRIGGER_THRESHOLD);
  }

  isDifferentCountry(previousPing, currentPing) {
    return (previousPing) ? previousPing.country !== currentPing.country : null;
  }

  isInFlight(ping) {
    return (ping.altitude > FLIGHT_ALTITUDE_TRIGGER_THRESHOLD || (ping.distance && ping.distance > FLIGHT_DISTANCE_TRIGGER_THRESHOLD) || ping.city === null);
  }

  mergePings(current, withPrevious, options={}) {
    if (options.withCoords) {
      current.latitude = withPrevious.latitude;
      current.longitude = withPrevious.longitude;
    }
    current.timestamp = withPrevious.timestamp;
    current.country = withPrevious.country;
    current.city = withPrevious.city;
    current.photos = current.photos.concat(withPrevious.photos);
    current.venue = withPrevious.venue;
    current.transport = withPrevious.transport;
    withPrevious.merged = true;
  }

  getLastTrip(user=store.User.user) {
    try {
      const len = user.trips.length;
      return (len) ? user.trips[len-1] : null;
    } catch(e) {
      logger.error('trip.getLastTrip() ->', e);
    }
  }

  getLastPingOfTrip(trip) {
    try {
      const len = trip.pings.length;
      return (len) ? trip.pings[len-1] : null;
    } catch(e) {
      logger.error('trip.getLastPingOfTrip() ->', e);
    }
  }

  /**
   * Triggered when the device receives a new location ping
   * 
   * @param {Object} ping 
   *      @param {Object} coords
   *          @param {number} coords.latitude          The latitude in degrees
   *          @param {number} coords.longitude         The longitude in degrees
   *          @param {number} coords.altitude          The altitude in meters above the WGS 84 reference ellipsoid
   *          @param {number} coords.accuracy          The radius of uncertainty for the location, measured in meters
   *          @param {number} coords.altitudeAccuracy  The accuracy of the altitude value, in meters (iOS only)
   *          @param {number} coords.heading           Horizontal direction of travel of this device (bearing starting from north going clockwise)
   *          @param {number} coords.heading           Horizontal direction of travel of this device (bearing starting from north going clockwise)
   *      @param {number} timestamp                    The time at which this position information was obtained, in milliseconds since epoch.
   * @param {number} simTimestamp                      Simulator purpose: Ping timestamp
   */
  async OnLocationPing(ping, simTimestamp) {
    try {
      logger.debug(`Ping received: ${new Date(ping.timestamp)}`);

      const user = await store.User.getLastLogged();
      const trip = this.getLastTrip(user);
      if (trip.finished) {
        return logger.warn('Blocked ping after trip was finished!');
      }

      const lastPing = this.getLastPingOfTrip(trip);
      if (lastPing && ping.timestamp < lastPing.time + (INTERVAL * 1000)) {
        return logger.warn('Ping received too early!');
      }

      const currentPing = {
        pingId: uuid_v4(),
        latitude: ping.coords.latitude,
        longitude: ping.coords.longitude,
        altitude: ping.coords.altitude,
        timestamp: simTimestamp || Date.now(),
        photos: [],
      }
      await Realm.write(() => {
        trip.pings.push(currentPing);
      });

      logger.debug(currentPing);
    } catch(e) {
      logger.error('trip.OnLocationPing() ->', e);
    }
  }
  
  async OnRegionEnter(region, simTimestamp) {
    try {
      logger.debug('Entered region');
      const user = await store.User.getLastLogged();
      const trip = this.getLastTrip(user);
      if (trip && !trip.finished) {
        // If the user has trips and the last one is not finished
        const lastPing = {
          pingId: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          altitude: 0,
          timestamp: simTimestamp || Date.now(),
          photos: [],
          parsed: true,
        }
        // End the trip
        logger.debug('Ending trip');
        await Realm.write(() => {
          trip.pings.push(lastPing);
          trip.finished = true;
        });
      }
      // await TptyTasks.stopLocationUpdates();
    } catch(e) {
      logger.error('trip.OnRegionEnter() ->', e);
    }
  }

  async OnRegionLeave(region, simTimestamp) {
    try {
      logger.debug('Left region');
      const user = await store.User.getLastLogged();
      const trip = this.getLastTrip(user);
      if (!trip || trip.finished) {
        // If the user does not have any trips or the last trip has been finished 
        const firstPing = {
          pingId: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          altitude: 0,
          timestamp: simTimestamp || Date.now(),
          photos: [],
          parsed: true,
        }
        // Create a new trip
        await Realm.write(() => {
          user.trips.push({
            tripId: uuid_v4(),
            pings: [ firstPing ],
          });
          logger.debug('Starting trip');
        });
      }
      // await TptyTasks.startLocationUpdates(); 
    } catch(e) {
      logger.error('trip.OnRegionLeave() ->', e);
    }
  }

  async parseTrips() {
    // Retrieve the last logged user (in background) or current user (in foreground)
    // And pull all the trips that have unparsed pings
    const user = await store.User.getLastLogged();
    const trips = Realm.toJSON(user.trips.filtered('ANY pings.parsed = null'));

    logger.debug('User:', user.email);
    logger.info('Parsing pings...');
    // Go through each of the unparsed ping of each trip that has unparsed pings
    for (let t = 0; t < trips.length; t++) {
      await this.parsePings(trips[t]);
    }
  }

  async parsePings(trip) {
    logger.info(`Current trip: id=${trip.tripId} | pings=${trip.pings.length}`);
    try {
      const pings = trip.pings;
      // Skip the first ping (departure ping) and the last ping (return ping)
      // As they are both the home location set by the user
      for (let p = 1; p < pings.length - 1; p++) {
        const previousPing = pings[p-1];
        const currentPing = pings[p];
        if (!currentPing.parsed) {
          try {
            const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
            currentPing.country = location[0].country;
            currentPing.city = location[0].city;
            currentPing.distance = getDistanceBetweenPoints(previousPing, currentPing);
            currentPing.transport = this.isInFlight(currentPing);
            currentPing.parsed = true;
            
            logger.info('Current ping:', currentPing);
            if (currentPing.transport && previousPing.transport) {
              logger.debug('Merging transport pings!');

              this.mergePings(currentPing, previousPing);
              pings.splice(--p, 1);
              continue;
            }

            if (getTimeBetweenPoints(previousPing, currentPing) >= TIME_REQUIRED_VISIT && !(currentPing.transport || previousPing.transport)) {
              logger.debug('Location visited! Invoking API to find the venue');
              const venueResponse = await AWS.invokeAPI('/venues', {
                params: {
                  latitude: currentPing.latitude,
                  longitude: currentPing.longitude,
                  altitude: currentPing.altitude,
                }
              });

              logger.debug(`Venue ${venueResponse ? `found with name ${venueResponse.name}` : 'not found'}`);
              if (venueResponse) {
                if (previousPing.venue && previousPing.venue.venueId === venueResponse.venueId) {
                  // If the venue data is still the same as the previous one even if the user moved more than 200m
                  // or there is no venue at the current location (the user is most likely flying)
                  // Still merge the previous ping with the current one but keep the coords of the current one
                  logger.debug(`This ping is not within 200m of the previous one but at the same venue`);
                  this.mergePings(currentPing, previousPing, { withCoords: false });
                  pings.splice(--p, 1);
                } else {
                  // Use the venue data
                  currentPing.venue = venueResponse;
                }
              }
              await asyncTimeout(1500);
            }
          } catch(err) {
            currentPing.parsed = false;
            throw err;
          }
        }
      }
     
      trip.synced = Date.now();
      await AWS.invokeAPI('/trips/synchronize', { method: 'patch',
        data: {
          trip,
        }
      });
      await Realm.write((realm) => {
        realm.create('Trip', trip, 'all');
      });
    } catch(err) {
      logger.error('parsePings failed with err ->', err.message);
      logger.debug('Automatic retry in 5 seconds');
      await asyncTimeout(5000);
      await this.parsePings(trip);
    }
  }

  async _sim_parseMedia(assets=[]) {
    try {
      logger.info('parseMedia() called');

      const user = await store.User.getLastLogged();
      const { homeCountry, homeCoords } = await store.User.getHomeLocation();
      logger.debug('User:', user.email);

      logger.info('Parsing images...');
      let trips = [];
      let currentTrip = null;
      let previousPing = null;
      let currentPing = null;

      for (let i = 0; i < assets.length; i++) {
        const meta = assets[i];
        // If the photo does not have GPS location recorded, skip it
        if (!meta.coords) {
          logger.warn(`Image with id ${assets[i].id} does not have location set! Skipping...`);
          continue;
        }

        currentPing = {
          pingId: uuid_v4(),
          latitude: meta.coords.latitude,
          longitude: meta.coords.longitude,
          altitude: (meta.exif['{GPS}'].AltitudeRef === 0) ? meta.exif['{GPS}'].Altitude : 0,
          timestamp: assets[i].timestamp,
          distance: getDistanceBetweenPoints(previousPing, meta.coords),
          photos: [],
        }

        // Skip the photo if it has been taken above 4000m
        if (currentPing.altitude > 4000) {
          logger.warn(`Image with id ${assets[i].id} has not been taken on ground! Skipping...`);
          continue;
        }

        // Finish the trip if started only if
        // The current photo was taken at home or in a different country than the previous one
        if (currentTrip && (this.isHome(homeCoords, meta.coords) || (previousPing && previousPing.country !== currentPing.country))) {
          // Finish the trip if it's longer than two hours, else just drop it
          const minimumHours = (currentPing.timestamp - currentTrip.pings[0].timestamp > (2 * 3600 * 1000));
          if (minimumHours) {
            logger.debug(`Trip started at ${homeCountry} and ended at ${currentTrip.pings[0].country}`);
            const lastPing = {
              pingId: uuid_v4(),
              latitude: homeCoords.latitude,
              longitude: homeCoords.longitude,
              timestamp: currentPing.timestamp + 1,
              photos: [],
              parsed: true,
            }
            currentTrip.pings.push(lastPing);
            currentTrip.finished = true;
          } else {
            trips.pop();
          }
          currentTrip = null;
        }

        // Start the trip if not started only if
        // The user is not home anymore
        if (!currentTrip && !this.isHome(homeCoords, meta.coords)) {
          logger.debug('New trip detected');
          const firstPing = {
            pingId: uuid_v4(),
            latitude: homeCoords.latitude,
            longitude: homeCoords.longitude,
            timestamp: currentPing.timestamp - 1,
            photos: [],
            parsed: true,
          }
          trips.push({
            tripId: uuid_v4(),
            pings: [ firstPing ],
          });
          currentTrip = trips[trips.length - 1];
        }

        // If a trip has started already
        if (currentTrip) {
          // If the distance of this current photo was taken within 200m of the first photo in the ping
          // Merge the previous ping with the current one
          if (currentPing.distance !== null && currentPing.distance < 0.2) {
            logger.debug(`Photo with id ${assets[i].id} is within 200m of the first in batch`);

            this.mergePings(currentPing, previousPing);
            currentTrip.pings.pop();
          }

          // Add the photo to the list of photos taken at this ping
          currentPing.photos.push({
            photoId: assets[i].id,
            uri: `simulator/${assets[i].id}`,
          })

          // Push the ping in the trip list
          currentTrip.pings.push(currentPing);
        } else {
          logger.debug(`Photo with id ${assets[i].id} taken at home with no trips started, nothing to do with it`);
        }
        previousPing = { ...currentPing };
      }
    
      await Realm.write(() => {
        trips.forEach(trip => {
          user.trips.push(trip);
        });
      });
    } catch(err) {
      logger.error(err);
    }
  }

  async parseMedia() {
    logger.info('parseMedia() called');

    const user = await store.User.getLastLogged();
    const { homeCountry, homeCoords } = await store.User.getHomeLocation();

    logger.debug('User:', user.email);

    logger.info('Parsing images...');
    let trips = [];
    let currentTrip = null;
    let previousPing = null;
    let currentPing = null;
    let page = 0;
    do {
      var { assets, hasNextPage } = await MediaLibrary.getAssetsAsync({ sortBy: MediaLibrary.SortBy.creationTime, first: 100 });
      logger.info(`Fetching page ${++page}, hasNextPage=${hasNextPage}`);
      for (let i = 0; i < assets.length; i++) {
        const meta = await MediaLibrary.getAssetInfoAsync(assets[i]);
        // If the photo does not have GPS location recorded, skip it
        if (!meta.location) {
          logger.warn(`Image with id ${assets[i].id} does not have location set! Skipping...`);
          continue;
        }

        // logger.debug(meta.exif['{GPS}']);
        logger.debug(meta.exif['{GPS}'].AltitudeRef, meta.exif['{GPS}'].Altitude);

        currentPing = {
          pingId: uuid_v4(),
          latitude: meta.location.latitude,
          longitude: meta.location.longitude,
          altitude: (meta.exif['{GPS}'].AltitudeRef === 0) ? meta.exif['{GPS}'].Altitude : 0,
          timestamp: assets[i].creationTime,
          distance: getDistanceBetweenPoints(previousPing, meta.location),
          photos: [],
        }

        // If the current photo was taken in a flight, skip it
        if (this.isInFlight(currentPing)) {
          logger.warn(`Image with id ${assets[i].id} has not been taken on ground! Skipping...`);
          continue;
        }

        // Finish the trip if started only if
        // The current photo was taken at home or in a different country that the previous one
        if (currentTrip && (this.isHome(homeCoords, meta.location) || (previousPing && previousPing.country !== currentPing.country))) {
          logger.debug(`Trip started at ${homeCountry} and ended at ${currentTrip.pings[0].country}`);
          const lastPing = {
            pingId: uuid_v4(),
            latitude: homeCoords.latitude,
            longitude: homeCoords.longitude,
            timestamp: currentPing.timestamp + 1,
            photos: [],
            parsed: true,
          }
          currentTrip.pings.push(lastPing);
          currentTrip.finished = true;
          currentTrip = null;
        }

        // Start the trip if not started only if
        // The user is not home anymore
        if (!currentTrip && !this.isHome(homeCoords, meta.location)) {
          logger.debug('New trip detected');
          const firstPing = {
            pingId: uuid_v4(),
            latitude: homeCoords.latitude,
            longitude: homeCoords.longitude,
            timestamp: currentPing.timestamp - 1,
            photos: [],
            parsed: true,
          }
          trips.push({
            tripId: uuid_v4(),
            pings: [ firstPing ],
          });
          currentTrip = trips[trips.length - 1];
        }

        // If a trip has started already
        if (currentTrip) {
          // If the distance of this current photo was taken within 200m of the first photo in the ping
          // Merge the previous ping with the current one
          if (currentPing.distance !== null && currentPing.distance < 0.2) {
            logger.debug(`Photo with id ${assets[i].id} is within 200m of the first in batch`);

            this.mergePings(currentPing, previousPing);
            currentTrip.pings.pop();
          }

          // Add the photo to the list of photos taken at this ping
          currentPing.photos.push({
            photoId: assets[i].id,
            uri: assets[i].uri,
          })

          // Push the ping in the trip list
          currentTrip.pings.push(currentPing);
        } else {
          logger.debug(`Photo with id ${assets[i].id} taken at home with no trips started, nothing to do with it`);
        }

        previousPing = { ...currentPing };
      }
    } while (hasNextPage);
  
    await Realm.write((realm) => {
      trips.forEach(trip => {
        user.trips.push(realm.create('Trip', trip, 'all'));
      });
    });
  }
}

export default new TptyTrip();
