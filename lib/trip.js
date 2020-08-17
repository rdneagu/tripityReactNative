/* Expo packages */
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

/* MobX store */
import store from '../store';
const { UserStore } = store;

/* Community packages */
import axios from 'axios';
import { v4 as uuid_v4 } from 'uuid';

/* App library */
import Realm from './realm';
import { getDistanceBetweenPoints } from './location';
import TptyLog from "./log";

/* Lib constants */
const FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80;
const TRIP_DISTANCE_TRIGGER_THRESHOLD = 40;

/**
 * Class definition for trips
 */
class TptyTrip {
  isHome(homeCoords, targetCoords) {
    const distance = getDistanceBetweenPoints(homeCoords, targetCoords);
    return (distance < TRIP_DISTANCE_TRIGGER_THRESHOLD);
  }

  isInFlight(ping) {
    return (ping.distance > FLIGHT_DISTANCE_TRIGGER_THRESHOLD || ping.city === null);
  }

  mergePings(current, previous, { withCoords=true }) {
    if (withCoords) {
      current.latitude = previous.latitude;
      current.longitude = previous.longitude;
    }
    current.country = previous.country;
    current.city = previous.city;
    current.photos = previous.photos;
    current.venue = previous.venue;
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
            distance: getDistanceBetweenPoints(ping.previous, ping.current),
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
            if (ping.current.distance && ping.current.distance < 0.2) {
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

              if (ping.previous && venueResponse.id === ping.previous.venue) {
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
