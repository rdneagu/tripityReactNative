// FURTHER TESTS: Ping receival on geofence trigger
/* Expo packages */
import * as MediaLibrary from 'expo-media-library';

/* Community packages */
import _ from 'lodash';
import { v4 as uuid_v4 } from 'uuid';

/* App classes */
import Trip from '../classes/Trip';
import Ping from '../classes/Ping';
import Photo from '../classes/Photo';

/* App library */
import { getDistanceBetweenPoints } from '../lib/location';
import logger from '../lib/log';
import TptyTasks from '../lib/tasks';

/**
 * Class definition for Trip Store
 */
class TripStore {
  static TRIP_DISTANCE_TRIGGER_THRESHOLD = 40; // in KM

  constructor(rootStore) {
    this.store = rootStore;
  }

  /**
   * Returns whether the current coordinates are lower than the trigger threshold
   * 
   * @param {Object} homeCoords         - Home coordinates
   *      @param {Number} lat                 - Latitude
   *      @param {Number} lon                 - Longitude
   * @param {Object} targetCoords       - Target coordinates
   *      @param {Number} lat                 - Latitude
   *      @param {Number} lon                 - Longitude
   */
  isHome(homeCoords, targetCoords) {
    const distance = getDistanceBetweenPoints(homeCoords, targetCoords);
    return (distance < TripStore.TRIP_DISTANCE_TRIGGER_THRESHOLD);
  }

  getAllTrips() {
    return this.store.UserStore.user?.trips;
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
   * @param {number} timestamp                        Simulator purpose: Ping timestamp
   */
  async OnLocationPing(ping, sim) {
    try {
      logger.debug(`Ping received: ${new Date(ping.timestamp)}`);

      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system pinged with no user authenticated');
      }

      const trip = user.lastTrip;
      if (!trip || trip.finishedAt) {
        throw new Error('Ping received when no trips have been found or all trips are finished!');
      }      

      if (trip.lastPing && ping.timestamp < trip.lastPing.time + (INTERVAL * 1000)) {
        throw new Error('Ping received too early!');
      }

      trip.addPing({
        pingId: uuid_v4(),
        latitude: ping.coords.latitude,
        longitude: ping.coords.longitude,
        altitude: ping.coords.altitude,
        timestamp: sim,
      });
      trip.save();

      logger.debug(trip.lastPing);
    } catch(err) {
      logger.error('TripStore.OnLocationPing >', err.message);
    }
  }
  
  async OnRegionEnter(region, sim) {
    try {
      logger.debug('Entered region');

      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system pinged with no user authenticated');
      }

      const lastTrip = user.lastTrip;
      // If the user has trips and the last one is not finished
      if (lastTrip && !lastTrip.finishedAt) {
        logger.debug('Ending trip');
        // End the trip
        const ping = lastTrip.addPing({
          pingId: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          transport: true,
          timestamp: sim,
        });
        lastTrip.setFinished(ping.timestamp);
        lastTrip.save();
      }
      if (!sim) {
        await TptyTasks.stopLocationUpdates();
      }
    } catch(err) {
      logger.error('TripStore.OnRegionEnter >', err.message);
    }
  }

  async OnRegionLeave(region, sim) {
    try {
      logger.debug('Left region');
  
      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system pinged with no user authenticated');
      }

      const lastTrip = user.lastTrip;
      // If the user does not have any trips or the last trip has been finished 
      if (!lastTrip || lastTrip.finishedAt) {
        logger.debug('Starting trip');
        // Create a new trip
        const trip = user.addTrip({
          tripId: uuid_v4(),
        });
        const ping = trip.addPing({
          pingId: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          transport: true,
          timestamp: sim,
        });
        trip.setStarted(ping.timestamp);
        user.save();
      }
      if (!sim) {
        await TptyTasks.startLocationUpdates();
      }
    } catch(err) {
      logger.error('TripStore.OnRegionLeave >', err.message);
    }
  }

  async parseTrips(statusAck) {
    try {
      // Retrieve the last logged user (in background) or current user (in foreground)
      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system pinged with no user authenticated');
      }
      user.parseTrips(null, statusAck);
    } catch(err) {
      logger.error('TripStore.parseTrips >', err.message);
    }
  }

  async parseMedia(sim) {
    try {
      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system pinged with no user authenticated');
      }

      const { homeCountry, homeCoords } = await this.store.UserStore.getHomeLocation();

      logger.debug('User:', user.email);
      logger.info('Parsing images');
      let trip = null;
      let previousPing = null;
      let currentPing = null;
      let page = 0;
      
      do {
        if (!sim) {
          var { assets, hasNextPage } = await MediaLibrary.getAssetsAsync({ sortBy: MediaLibrary.SortBy.creationTime, first: 100 });
        } else {
          var { assets, hasNextPage } = { assets: sim, hasNextPage: false };
        }
        logger.info(`Fetching page ${++page}, hasNextPage=${hasNextPage}`);
        for (let i = 0; i < assets.length; i++) {
          const meta = (sim) ? assets : await MediaLibrary.getAssetInfoAsync(assets[i]);
          // If the photo does not have GPS location recorded, skip it
          if (!meta.location) {
            logger.warn(`Image with id ${assets[i].id} does not have location set! Skipping...`);
            continue;
          }

          const photo = new Photo({
            photoId: assets[i].id,
            uri: assets[i].uri,
          });
          photo.save();

          logger.debug(meta.exif['{GPS}'].AltitudeRef, meta.exif['{GPS}'].Altitude);

          currentPing = new Ping({
            pingId: uuid_v4(),
            latitude: meta.location.latitude,
            longitude: meta.location.longitude,
            altitude: (meta.exif['{GPS}'].AltitudeRef === 0) ? meta.exif['{GPS}'].Altitude : 0,
            timestamp: assets[i].creationTime,
          })
          currentPing.setDistance(previousPing);

          // If the current photo was taken in a flight, skip it
          if (currentPing.isHighAltitude()) {
            logger.warn(`Image with id ${assets[i].id} has not been taken on ground! Skipping...`);
            continue;
          }

          // Finish the trip if started only if the current photo was taken at home or in a different country that the previous one
          if (trip && (this.isHome(homeCoords, meta.location) || (previousPing?.country !== currentPing.country))) {
            const minimumHours = (trip.lastPing.timestamp - trip.firstPing.timestamp > (2 * 3600 * 1000));
            logger.debug(`Trip started at ${homeCountry} and ended at ${trip.lastPing.country}`);
            if (minimumHours) {
              const lastPing = new Ping({
                pingId: uuid_v4(),
                latitude: homeCoords.latitude,
                longitude: homeCoords.longitude,
                timestamp: currentPing.timestamp + 1,
                parsed: true,
              });
              trip.addPing(lastPing);
              trip.setFinished(lastPing.timestamp);
              trip.setSynced(Date.now());
              user.addTrip(trip);
            }
            trip = null;
          }

          // Start the trip if not started only if the user is not home anymore
          if (!trip && !this.isHome(homeCoords, meta.location)) {
            logger.debug('New trip detected');
            const firstPing = new Ping({
              pingId: uuid_v4(),
              latitude: homeCoords.latitude,
              longitude: homeCoords.longitude,
              timestamp: currentPing.timestamp - 1,
              parsed: true,
            });
            trip = new Trip({
              tripId: uuid_v4(),
              startedAt: firstPing.timestamp,
            })
            trip.addPing(firstPing);
          }

          // If a trip has started already
          if (trip) {
            // If the distance of this current photo was taken within 200m of the first photo in the ping
            // Merge the previous ping with the current one
            if (currentPing.distance !== null && currentPing.distance < 0.2) {
              logger.debug(`Photo with id ${assets[i].id} is within 200m of the first in batch`);

              currentPing.mergePings(previousPing);
              trip.removePing('pop');
            }

            // Add the photo to the list of photos taken at this ping
            currentPing.addPhoto(photo);

            // Push the ping in the trip list
            trip.addPing(currentPing);
          } else {
            logger.debug(`Photo with id ${assets[i].id} taken at home with no trips started, nothing to do with it`);
          }
          previousPing = currentPing;
        }
      } while (hasNextPage);
      user.save();
    } catch(err) {
      logger.error('TripStore.parseMedia >', err.message);
    }
  }
}

export default TripStore;
