// FURTHER TESTS: Ping receival on geofence trigger
/* Expo packages */
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

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
  constructor(rootStore) {
    this.store = rootStore;
  }

  getAllTrips() {
    return this.store.UserStore.user?.sortedTrips;
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

      if (trip.lastPing && ping.timestamp < trip.lastPing.time + (Ping.INTERVAL * 1000)) {
        throw new Error('Ping received too early!');
      }

      trip.addPing({
        pingId: uuid_v4(),
        type: Ping.PING_TYPE.TYPE_REALTIME,
        latitude: ping.coords.latitude,
        longitude: ping.coords.longitude,
        altitude: ping.coords.altitude,
        timestamp: sim,
      });
      trip.save();

      logger.debug(trip.lastPing.toString());
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
        // End the trip
        const ping = lastTrip.addPing({
          pingId: uuid_v4(),
          type: Ping.PING_TYPE.TYPE_REALTIME,
          latitude: region.latitude,
          longitude: region.longitude,
          transport: true,
          timestamp: sim,
        });
        lastTrip.setFinished(ping.timestamp);
        lastTrip.save();
        logger.debug('Ending trip');
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
        // Create a new trip
        const trip = user.addTrip({
          tripId: uuid_v4(),
        });
        const ping = trip.addPing({
          pingId: uuid_v4(),
          type: Ping.PING_TYPE.TYPE_REALTIME,
          latitude: region.latitude,
          longitude: region.longitude,
          transport: true,
          timestamp: sim,
        });
        trip.setStarted(ping.timestamp);
        user.save();
        logger.debug('Starting trip');
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
      await user.parseTrips(null, statusAck);
    } catch(err) {
      logger.error('TripStore.parseTrips >', err.message);
    }
  }

  async parseMedia(sim, statusAck) {
    try {
      const user = await this.store.UserStore.getLastLogged();
      if (!user) {
        throw new Error('The system attempted to parse the media with no user authenticated');
      }

      const { homeCoords } = await this.store.UserStore.getHomeLocation();

      logger.debug('User:', user.email);
      logger.info('Parsing images');

      let lastPhotoCursor = user.lastTrip?.lastPing?.lastPhoto;
      let trip = null;
      let currentPing = null;
      let previousPing = null;
      let page = 0;

      const album = await MediaLibrary.getAlbumAsync("Camera");
      do {
        if (!sim) {
          var { assets, hasNextPage } = await MediaLibrary.getAssetsAsync({ sortBy: [ [ MediaLibrary.SortBy.creationTime, true ] ], album, first: 100 });
        } else {
          var { assets, hasNextPage } = { assets: sim, hasNextPage: false };
        }
        logger.info(`Fetching page ${++page}, hasNextPage=${hasNextPage}`);
        for (let i = 0; i < assets.length; i++) {
          if (statusAck) {
            statusAck(assets, i);
          }

          // Ignore all photos that have been already accessed
          if (lastPhotoCursor && assets[i].creationTime <= lastPhotoCursor.timestamp) {
            continue;
          }
          
          const meta = (sim) ? assets[i].meta : await MediaLibrary.getAssetInfoAsync(assets[i]);   

          // If the photo does not have GPS location recorded, skip it
          if (!meta.location) {
            logger.warn(`Image ${assets[i].uri} does not have location set! Skipping...`);
            continue;
          }

          // Fetch the file md5 checksum
          const { md5 } = (sim) ? { md5: uuid_v4() } : await FileSystem.getInfoAsync(assets[i].uri, { md5: true });       

          // Create the photo object and save it in Realm
          const photo = new Photo({
            hash: md5,
            uri: assets[i].uri,
          });
          photo.save();

          console.log(photo.hash);
          // logger.debug(`AltitudeRef: ${meta.exif['{GPS}'].AltitudeRef}, Altitude: ${meta.exif['{GPS}'].Altitude}`);

          const altRef = meta.exif['{GPS}']?.AltitudeRef || meta.exif?.GPSAltitudeRef || 0;
          const altitude = meta.exif['{GPS}']?.Altitude || meta.exif?.GPSAltitude || 0;

          currentPing = new Ping({
            pingId: uuid_v4(),
            type: Ping.PING_TYPE.TYPE_MEDIA,
            latitude: meta.location.latitude,
            longitude: meta.location.longitude,
            altitude: (altRef === 0) ? altitude : 0,
            timestamp: assets[i].creationTime,
          })
          currentPing.setDistance(currentPing.getDistanceBetweenCoords(previousPing));
          currentPing.setTransport(false);

          const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
          currentPing.setCountry(location[0]?.country);
          currentPing.setCity(location[0]?.city);

          // If the current photo was taken in a flight, skip it
          if (currentPing.isHighAltitude() || currentPing.country === null) {
            logger.warn(`Photo ${photo.uri} with hash ${photo.hash} has not been taken on ground! Skipping...`);
            continue;
          }

          // Finish the trip if started only if the current photo was taken at home
          // or in a different country than the previous one
          // or the previous photo is 3 days older than the current photo
          const timeDiff = (previousPing?.getTimeBetweenPings(currentPing) >= Ping.TIME_MAX_BETWEEN_TRIPS);
          const sameCountry = (previousPing?.country === currentPing.country);
          if (trip && (currentPing.isHome(homeCoords) || !sameCountry || timeDiff)) {
            logger.info(`Trip to ${trip.lastPing.country} ended`);
            trip.setFinished(trip.lastPing.timestamp);
            if (trip.isValid) {
              logger.debug('The trip has the minimum requirements to be recorded!')
              trip.setSync(Date.now());
              user.addTrip(trip);
            }
            trip = null;
          }

          // Start the trip if not started only if the user is not home anymore
          if (!trip && !currentPing.isHome(homeCoords)) {
            logger.debug('New possible trip detected');
            trip = new Trip({
              tripId: uuid_v4(),
              startedAt: currentPing.timestamp,
            });
          }

          // If a trip has started already
          if (trip) {
            // If the distance of this current photo was taken within 200m of the first photo in the ping
            // Merge the previous ping with the current one
            if (currentPing.distance !== null && currentPing.distance < 0.2) {
              logger.debug(`Photo ${photo.uri} with hash ${photo.hash} is within 200m of the first in batch`);
              currentPing.merge(previousPing, { keepTime: true });
              trip.removePing('pop');
            }

            // Add the photo to the list of photos taken at this ping
            currentPing.addPhoto(photo);

            // Push the ping in the trip list
            trip.addPing(currentPing);
          } else {
            logger.debug(`Photo ${photo.uri} with hash ${photo.hash} taken at home with no trips started, nothing to do with it`);
          }
          previousPing = currentPing;
        }
      } while (hasNextPage);

      // Add unfinished trip
      if (trip) {
        user.addTrip(trip);
      }
      user.save();
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }
}

export default TripStore;
