/* Expo packages */
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

/* React packages */
import AsyncStorage from '@react-native-community/async-storage';

/* MobX store */
import store from '../store';
const { UserStore } = store;

/* Community packages */
import axios from 'axios';
import { v4 as uuid_v4 } from 'uuid';

/* App library */
import Realm from './realm';
import { getDistanceBetweenPoints } from './location';
import TptyLog from './log';
import TptyTasks from './tasks';

/* Lib constants */
const FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80; // in KM
const TRIP_DISTANCE_TRIGGER_THRESHOLD = 40; // in KM
const INTERVAL = 60; // TO CHANGE
const TIME_REQUIRED_VISIT = (INTERVAL + INTERVAL/2) * 1000; // in miliseconds

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

  mergePings(current, previous, options) {
    if (options.withCoords) {
      current.latitude = previous.latitude;
      current.longitude = previous.longitude;
    }
    current.timestamp = previous.timestamp;
    current.country = previous.country;
    current.city = previous.city;
    current.photos = previous.photos;
    current.venue = previous.venue;
    current.transport = previous.transport;
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
        time: ping.timestamp,
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
          time: Date.now(),
          photos: [],
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
          time: Date.now(),
          photos: [],
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
    try {
      TptyLog.info('parsePings() called');
      TptyLog.info('Fetching coords for user\'s home location...');

      const { homeCountry, homeCity } = UserStore.homeLocation;
      if (!homeCountry || !homeCity) {
        throw 'Cannot proceed without a home location set';
      }

      const homeCoords = UserStore.getHomeCoords();

      TptyLog.success('Home location detected!');
      TptyLog.info(`Country: ${homeCountry}`);
      TptyLog.info(`City: ${homeCity}`);
      TptyLog.info(`Coords: ${homeCoords.latitude} lat, ${homeCoords.longitude} lon`);

      TptyLog.info('Parsing pings...');
      
      const user = await UserStore.getLastLogged();
      TptyLog.debug('User:', user.email);
      const trips = user.trips.filtered('ANY pings.parsed = null');
      for (let t = 0; t < trips.length; t++) {
        const pings = trips[t].pings;
        let previousPing = pings[0];
        // Start the loop from 1, skipping the first ping
        // Solution: if trip not finished last ping is 'current' and not parsed
        for (let p = 1; p < pings.length; p++) {
          const blockcode = true;
          if (blockcode) {
            return;
          }

          if (!pings[p].parsed) {
            const location = await Location.reverseGeocodeAsync(pings[p]);
            pings[p].country = location[0].country;
            pings[p].city = location[0].city;
            pings[p].distance = getDistanceBetweenPoints(previousPing, pings[p]);
            pings[p].transport = this.isInFlight(pings[p]);
            
            if (pings[p].transport && previousPing.transport) {
              this.mergePings(pings[p], previousPing);
              pings.splice(--p, 1);
            } else if (pings[p]{
              if ()
            }

            if (pings[p].distance < )

            // if (!pings[p].venue) {
            //   // If the venue data for the current ping has not been fetched, request it from foursquares
            //   TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
            //   const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${ping.current.latitude},${ping.current.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
            //   const [ venueResponse ] = venueRequest.data.response.venues;

            //   if (ping.previous && venueResponse.id === ping.previous.venue.id) {
            //     // If the venue data is still the same as the previous one even if the user moved more than 200m
            //     // Still merge the previous ping with the current one but keep the coords of the current one
            //     TptyLog.debug(`Photo with id ${assets[i].id} not within 200m of the first in batch but at the same venue`);
            //     this.mergePings(pings.current, pings.previous, { withCoords: false }); 
            //   } else {
            //     // Make sure the venue data does not exist already in the database
            //     const [ venueFound ] = Realm.db.objects('Venue').filtered(`id = "${venueResponse.id}" LIMIT(1)`);
            //     TptyLog.debug(`Venue found with name: ${venueResponse.name}, venueFound=${!!venueFound}`);
            //     // Use either the venue data from Realm DB if it exists or create a new one
            //     ping.current.venue = venueFound || Realm.db.create('Venue', {
            //       id: venueResponse.id,
            //       name: venueResponse.name,
            //       category: venueResponse.categories[0].name,
            //       reviews: [],
            //     });
            //   }
            // }


              //       // If the distance of the current ping is within 200m of the previous ping
              //       // Merge the previous ping with the current one
              //       this.mergePings(currentPing, previousPing);
              //       trip.pings.pop();
          
              //       if (!currentPing.transport && !currentPing.venue) {
              //         // If the venue data for the current ping has not been fetched, request it from foursquares
              //         TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
              //         const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${currentPing.latitude},${currentPing.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
              //         const [ venueResponse ] = venueRequest.data.response.venues;
          
              //         // Make sure the venue data does not exist already in the database
              //         const [ venueFound ] = Realm.db.objects('Venue').filtered(`id = "${venueResponse.id}" LIMIT(1)`);
              //         TptyLog.debug(`Venue found with name: ${venueResponse.name}, venueFound=${!!venueFound}`);
              //         // Use either the venue data from Realm DB if it exists or create a new one
              //         currentPing.venue = venueFound || Realm.db.create('Venue', {
              //           id: venueResponse.id,
              //           name: venueResponse.name,
              //           category: venueResponse.categories[0].name,
              //           reviews: [],
              //         });
              //       }
              //     }
          }
          previousPing = pings[p];          
        }
      }
    } catch(e) {
      TptyLog.error('parsePings() ->', e);
    }
    return;

    // let trip = this.getLastTrip();
    //   let previousPing = this.getLastPingOfTrip(trip);

    //   if (previousPing && ping.timestamp < previousPing.time + (INTERVAL * 1000)) {
    //     return TptyLog.warn('Ping received too early');
    //   }

    //   const location = await Location.reverseGeocodeAsync(ping.coords);
    //   const currentPing = {
    //     id: uuid_v4(),
    //     latitude: ping.coords.latitude,
    //     longitude: ping.coords.longitude,
    //     country: location[0].country,
    //     city: location[0].city,
    //     time: ping.timestamp,
    //     distance: getDistanceBetweenPoints(previousPing, ping.coords),
    //     photos: [],
    //   }
    //   currentPing.transport = this.isInFlight(currentPing);

    //   Realm.db.beginTransaction();
    //   try {
    //     if (currentPing.distance !== null && (currentPing.distance < 0.2 || (currentPing.transport && previousPing.transport))) {
    //       // If the distance of the current ping is within 200m of the previous ping
    //       // Merge the previous ping with the current one
    //       this.mergePings(currentPing, previousPing);
    //       trip.pings.pop();

    //       if (!currentPing.transport && !currentPing.venue) {
    //         // If the venue data for the current ping has not been fetched, request it from foursquares
    //         TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
    //         const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${currentPing.latitude},${currentPing.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
    //         const [ venueResponse ] = venueRequest.data.response.venues;

    //         // Make sure the venue data does not exist already in the database
    //         const [ venueFound ] = Realm.db.objects('Venue').filtered(`id = "${venueResponse.id}" LIMIT(1)`);
    //         TptyLog.debug(`Venue found with name: ${venueResponse.name}, venueFound=${!!venueFound}`);
    //         // Use either the venue data from Realm DB if it exists or create a new one
    //         currentPing.venue = venueFound || Realm.db.create('Venue', {
    //           id: venueResponse.id,
    //           name: venueResponse.name,
    //           category: venueResponse.categories[0].name,
    //           reviews: [],
    //         });
    //       }
    //     }

    //     TptyLog.debug('Current ping: ', currentPing);
    //     // Push the ping in the trip list
    //     trip.pings.push(currentPing);
    //     Realm.db.commitTransaction();
    //   } catch(e) {
    //     Realm.db.cancelTransaction();
    //     throw e;
    //   }
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
    Realm.db.beginTransaction();
    try {
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
          if (!meta.location) {
            TptyLog.warn(`Image with id ${assets[i].id} does not have location set! Skipping...`);
            continue;
          }

          const location = await Location.reverseGeocodeAsync(meta.location);
          ping.current = {
            id: uuid_v4(),
            latitude: meta.location.latitude,
            longitude: meta.location.longitude,
            country: location[0].country,
            city: location[0].city,
            time: assets[i].creationTime,
            distance: getDistanceBetweenPoints(ping.previous, meta.location),
            photos: [],
          }

          if (this.isInFlight(ping.current)) {
            TptyLog.warn(`Image with id ${assets[i].id} has not been taken on ground! Skipping...`);
            continue;
          }

          // If the trip is not started yet and the user is not home anymore, create a new trip in the database
          if (!trip && !this.isHome(homeCoords, meta.location)) {
            TptyLog.debug('New trip detected');
            const tripsLen = UserStore.user.trips.push({
              id: uuid_v4(),
              pings: [],
            });
            trip = UserStore.user.trips[tripsLen-1];
          }
        
          if (trip) {
            // If a trip has started already
            if (ping.current.distance !== null && ping.current.distance < 0.2) {
              // If the distance of this current photo was taken within 200m of the first photo in the ping
              // Merge the previous ping with the current one
              TptyLog.debug(`Photo with id ${photo.id} is within 200m of the first in batch`);

              this.mergePings(pings.current, pings.previous);
              trip.pings.pop();
            }

            if (!ping.current.venue) {
              // If the venue data for the current photo has not been fetched, request it from foursquares
              TptyLog.debug('This ping has no venue... request foursquare and see if it exists already in local db');
              const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${ping.current.latitude},${ping.current.longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
              const [ venueResponse ] = venueRequest.data.response.venues;

              if (ping.previous && venueResponse.id === ping.previous.venue.id) {
                // If the venue data is still the same as the previous one even if the user moved more than 200m
                // Still merge the previous ping with the current one but keep the coords of the current one
                TptyLog.debug(`Photo with id ${assets[i].id} not within 200m of the first in batch but at the same venue`);
                this.mergePings(pings.current, pings.previous, { withCoords: false }); 
              } else {
                // Make sure the venue data does not exist already in the database
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

            // If the current photo was taken at home, finish the trip
            if (this.isHome(homeCoords, meta.location)) {
              TptyLog.debug(`Trip started at ${trip.pings[0].country} and ended at ${trip.pings[trip.pings.length-1].country}`);
              trip.finished = true;
              trip = null;
            }
          } else {
            TptyLog.debug(`Photo with id ${assets[i].id} taken at home with no trips started, nothing to do with it`);
          }

          ping.previous = {
            prev: ping.previous,
            ...ping.current,
          }
        }
      } while (hasNextPage);

      Realm.db.commitTransaction();
      update({ finished: true });
    } catch(e) {
      Realm.db.cancelTransaction();
      throw e;
    }
  }
}

export default new TptyTrip();
