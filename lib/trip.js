// FURTHER TESTS: Ping receival on geofence trigger
/* Expo packages */
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

/* MobX store */
import store from '../store';
const { UserStore } = store;

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { v4 as uuid_v4 } from 'uuid';

/* App library */
import Realm from './realm';
import { getDistanceBetweenPoints, getTimeBetweenPoints } from './location';
import TptyLog from './log';
import TptyTasks from './tasks';

/* Lib constants */
const FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80; // in KM
const TRIP_DISTANCE_TRIGGER_THRESHOLD = 40; // in KM
const INTERVAL = 900; // TO CHANGE
const TIME_REQUIRED_VISIT = (INTERVAL + INTERVAL/2); // in seconds

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
    return ((ping.distance && ping.distance > FLIGHT_DISTANCE_TRIGGER_THRESHOLD) || ping.city === null);
  }

  mergePings(current, withPrevious, options={}) {
    if (options.withCoords) {
      current.latitude = withPrevious.latitude;
      current.longitude = withPrevious.longitude;
    }
    current.timestamp = withPrevious.timestamp;
    current.country = withPrevious.country;
    current.city = withPrevious.city;
    current.photos = withPrevious.photos;
    current.venue = withPrevious.venue;
    current.transport = withPrevious.transport;
    withPrevious.merged = true;
  }

  getLastTrip(user=UserStore.user) {
    try {
      const len = user.trips.length;
      return (len) ? user.trips[len-1] : null;
    } catch(e) {
      TptyLog.error('trip.getLastTrip() ->', e);
    }
  }

  getLastPingOfTrip(trip) {
    try {
      const len = trip.pings.length;
      return (len) ? trip.pings[len-1] : null;
    } catch(e) {
      TptyLog.error('trip.getLastPingOfTrip() ->', e);
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
   */
  async OnLocationPing(ping) {
    try {
      TptyLog.debug(`Ping received: ${new Date(ping.timestamp)}`);

      const user = await UserStore.getLastLogged();
      const trip = this.getLastTrip(user);
      if (trip.finished) {
        return TptyLog.warn('Blocked ping after trip was finished!');
      }

      const lastPing = this.getLastPingOfTrip(trip);
      if (lastPing && ping.timestamp < lastPing.time + (INTERVAL * 1000)) {
        return TptyLog.warn('Ping received too early!');
      }

      const currentPing = {
        id: uuid_v4(),
        latitude: ping.coords.latitude,
        longitude: ping.coords.longitude,
        timestamp: Date.now(),
        photos: [],
      }
      await Realm.write(() => {
        trip.pings.push(currentPing);
      });

      TptyLog.debug(currentPing);
    } catch(e) {
      TptyLog.error('trip.OnLocationPing() ->', e);
    }
  }
  
  async OnRegionEnter(region) {
    try {
      TptyLog.debug('Entered region');
      const user = await UserStore.getLastLogged();
      const trip = this.getLastTrip(user);
      if (trip && !trip.finished) {
        // If the user has trips and the last one is not finished
        const lastPing = {
          id: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          timestamp: Date.now(),
          photos: [],
          parsed: true,
        }
        // End the trip
        TptyLog.debug('Ending trip');
        await Realm.write(() => {
          trip.pings.push(lastPing);
          trip.finished = true;
        });
      }
      await TptyTasks.stopLocationUpdates();
    } catch(e) {
      TptyLog.error('trip.OnRegionEnter() ->', e);
    }
  }

  async OnRegionLeave(region) {
    try {
      TptyLog.debug('Left region');
      const user = await UserStore.getLastLogged();
      const trip = this.getLastTrip(user);
      if (!trip || trip.finished) {
        // If the user does not have any trips or the last trip has been finished 
        const firstPing = {
          id: uuid_v4(),
          latitude: region.latitude,
          longitude: region.longitude,
          timestamp: Date.now(),
          photos: [],
          parsed: true,
        }
        // Create a new trip
        await Realm.write(() => {
          user.trips.push({
            id: uuid_v4(),
            pings: [ firstPing ],
          });
          TptyLog.debug('Starting trip');
        });
      }
      await TptyTasks.startLocationUpdates(); 
    } catch(e) {
      TptyLog.error('trip.OnRegionLeave() ->', e);
    }
  }

  async parsePings(update) {
    TptyLog.info('parsePings() called');
    TptyLog.info('Fetching coords for user\'s home location...');

    const { homeCountry, homeCity } = UserStore.homeLocation;
    if (!homeCountry || !homeCity) {
      throw 'Cannot proceed without a home location set';
    }

    const homeCoords = await UserStore.getHomeCoords();

    TptyLog.success('Home location detected!');
    TptyLog.info(`Country: ${homeCountry}`);
    TptyLog.info(`City: ${homeCity}`);
    TptyLog.info(`Coords: ${homeCoords.latitude} lat, ${homeCoords.longitude} lon`);

    TptyLog.info('Parsing pings...');
    // Retrieve the last logged user (in background) or current user (in foreground)
    // And pull all the trips that have unparsed pings
    const user = await UserStore.getLastLogged();
    const trips = user.trips.filtered('ANY pings.parsed = null');
    TptyLog.debug('User:', user.email);
    await Realm.write(async () => {
      // Go through each of the unparsed ping of each trip that has unparsed pings
      for (let t = 0; t < trips.length; t++) {
        TptyLog.info(`Current trip: id=${trips[t].id} | pings=${trips[t].pings.length}`);
        const pings = trips[t].pings;
        // Skip the first ping (departure ping) and the last ping (return ping)
        // As they are both the home location set by the user
        for (let p = 1; p < pings.length - 1; p++) {
          const previousPing = pings[p-1];
          const currentPing = pings[p];

          if (!currentPing.parsed) {
            const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
            currentPing.country = location[0].country;
            currentPing.city = location[0].city;
            currentPing.distance = getDistanceBetweenPoints(previousPing, currentPing);
            currentPing.transport = this.isInFlight(currentPing);
            // currentPing.parsed = true;
            TptyLog.info('Current ping:', currentPing);

            if (currentPing.transport && previousPing.transport) {
              TptyLog.debug('Merging transport pings!');
              this.mergePings(currentPing, previousPing);
              pings.splice(--p, 1);
              console.log(pings.length);
              continue;
            }

            if (getTimeBetweenPoints(previousPing, currentPing) >= TIME_REQUIRED_VISIT) {
              TptyLog.debug('Visited location!');
              if (!currentPing.venue) {
                // If the venue data for the current ping has not been fetched, request it from foursquares
                TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
                const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${currentPing.latitude},${previousPing.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
                const [ venueResponse ] = venueRequest.data.response.venues;

                if (previousPing && previousPing.venue && previousPing.venue.id === venueResponse.id) {
                  // If the venue data is still the same as the previous one even if the user moved more than 200m
                  // Still merge the previous ping with the current one but keep the coords of the current one
                  TptyLog.debug(`This ping is not within 200m of the previous one but at the same venue`);
                  this.mergePings(currentPing, previousPing, { withCoords: false }); 
                } else {
                  // Make sure the venue data does not exist already in the database
                  const [ venueFound ] = Realm.db.objects('Venue').filtered(`id = "${venueResponse.id}" LIMIT(1)`);
                  TptyLog.debug(`Venue found with name: ${venueResponse.name}, venueFound=${!!venueFound}`);
                  // Use either the venue data from Realm DB if it exists or create a new one
                  currentPing.venue = venueFound || Realm.db.create('Venue', {
                    id: venueResponse.id,
                    name: venueResponse.name,
                    category: venueResponse.categories[0].name,
                    reviews: [],
                  });
                }
              }
            }
          }
        }
      }
    });
    return;
  }

  async parseMedia(update) {
    TptyLog.info('parseMedia() called');
    TptyLog.info('Fetching coords for user\'s home location...');
 
    const { homeCountry, homeCity } = UserStore.homeLocation;
    if (!homeCountry || !homeCity) {
      throw 'Cannot proceed without a home location set';
    }

    const [ homeCoords ] = await Location.geocodeAsync(`${homeCountry}, ${homeCity}`);
    if (!homeCoords) {
      throw 'Failed to parse the home location';
    }

    TptyLog.success('Home location detected!');
    TptyLog.info(`Country: ${homeCountry}`);
    TptyLog.info(`City: ${homeCity}`);
    TptyLog.info(`Coords: ${homeCoords.latitude} lat, ${homeCoords.longitude} lon`);

    TptyLog.info('Parsing images...');
    await Realm.write(async () => {
      let trip;
      let ping = {
        realm: null,
        current: null,
        previous: null,
      };
      let page = 0;
      do {
        var { assets, hasNextPage } = await MediaLibrary.getAssetsAsync({ sortBy: MediaLibrary.SortBy.creationTime, first: 100 });
        TptyLog.info(`Fetching page ${++page}, hasNextPage=${hasNextPage}`);
        for (let i = 0; i < assets.length; i++) {
          // Send parsing progress to react component for debugging
          update(assets[i], trip);

          const meta = await MediaLibrary.getAssetInfoAsync(assets[i]);
          // If the photo does not have GPS location recorded, skip it
          if (!meta.location) {
            TptyLog.warn(`Image with id ${assets[i].id} does not have location set! Skipping...`);
            continue;
          }

          // Fetch location of the photo and create a ping object
          const location = await Location.reverseGeocodeAsync(meta.location);
          ping.current = {
            id: uuid_v4(),
            latitude: meta.location.latitude,
            longitude: meta.location.longitude,
            country: location[0].country,
            city: location[0].city,
            timestamp: assets[i].creationTime,
            distance: getDistanceBetweenPoints(ping.previous, meta.location),
            photos: [],
          }

          // If the current photo was taken in a flight, skip it
          if (this.isInFlight(ping.current)) {
            TptyLog.warn(`Image with id ${assets[i].id} has not been taken on ground! Skipping...`);
            continue;
          }

          // Finish the trip if started only if
          // The current photo was taken at home or in a different country that the previous one
          if (trip && (this.isHome(homeCoords, meta.location) || (ping.previous && ping.current.country !== ping.previous.country))) {
            TptyLog.debug(`Trip started at ${homeCountry} and ended at ${trip.pings[0].country}`);
            trip.finished = true;
            trip = null;
          }
          
          // Start the trip if not started only if
          // The user is not home anymore
          if (!trip && !this.isHome(homeCoords, meta.location)) {
            TptyLog.debug('New trip detected');
            const tripsLen = UserStore.user.trips.push({
              id: uuid_v4(),
              pings: [],
            });
            trip = UserStore.user.trips[tripsLen-1];
          }
        
          // If a trip has started already
          if (trip) {
            // If the distance of this current photo was taken within 200m of the first photo in the ping
            // Merge the previous ping with the current one
            if (ping.current.distance !== null && ping.current.distance < 0.2) {
              TptyLog.debug(`Photo with id ${photo.id} is within 200m of the first in batch`);

              this.mergePings(pings.current, pings.previous);
              trip.pings.pop();
            }

            // If the venue data for the current ping has not been fetched, request it from foursquares
            if (!ping.current.venue) {
              TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
              const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${ping.current.latitude},${ping.current.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
              const [ venueResponse ] = venueRequest.data.response.venues;

              // If the venue data is still the same as the previous one even if the user moved more than 200m
              //      still merge the previous ping with the current one but keep the coords of the current one
              // Else
              //      make sure the venue data does not exist already in the database and set it for the current ping
              if (ping.previous && ping.previous.venue && ping.previous.venue.id === venueResponse.id) {
                TptyLog.debug(`Photo with id ${assets[i].id} not within 200m of the first in batch but at the same venue`);
                this.mergePings(pings.current, pings.previous, { withCoords: false }); 
              } else {
                const [ venueFound ] = Realm.db.objects('Venue').filtered(`id = "${venueResponse.id}" LIMIT(1)`);
                TptyLog.debug(`Venue found with name: ${venueResponse.name}, venueFound=${!!venueFound}`);
                // Use either the venue data from Realm DB if it exists or create a new one
                ping.current.venue = venueFound || Realm.db.create('Venue', {
                  id: venueResponse.id,
                  name: venueResponse.name,
                  category: venueResponse.categories[0].name,
                  reviews: [],
                });
              }
            }

            // Add the photo to the list of photos taken at this ping
            ping.current.photos.push({
              id: assets[i].id,
              uri: assets[i].uri,
            })
            // Push the ping in the trip list
            trip.pings.push(ping.current);
          } else {
            TptyLog.debug(`Photo with id ${assets[i].id} taken at home with no trips started, nothing to do with it`);
          }

          ping.previous = {
            ...ping.current,
          }
        }
      } while (hasNextPage);
      update({ finished: true });
    });
  }
}

export default new TptyTrip();
