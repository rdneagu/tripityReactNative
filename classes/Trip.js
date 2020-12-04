/* Expo packages */
import * as Location from 'expo-location';

/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from 'mobx';

/* App classes */
import Ping from './Ping';

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import logger from '../lib/log';

class CTripError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CTripError';
  }
}

/**
 * Class definition for the Trip
 */
class Trip {
  @observable tripId;
  @observable pings = [];
  @observable startedAt = null;
  @observable finishedAt = null;
  @observable synced = null;

  constructor(props) {
    this.setProperties(props);
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  @computed
  get sortedPings() {
    return this.pings.slice().sort((p1, p2) => p1.timestamp - p2.timestamp);
  }

  @computed
  get firstPing() {
    return (this.sortedPings.length) ? this.sortedPings[0] : null;
  }

  @computed
  get lastPing() {
    return (this.sortedPings.length) ? this.sortedPings[this.pings.length - 1] : null;
  }

  @action.bound
  setTripId(tripId) {
    this.tripId = tripId ?? this.tripId;
  }

  @action.bound
  addPing(ping, op='push') {
    if (ping) {
      ping = (ping instanceof Ping) ? ping : new Ping(ping);
      this.pings[op](ping);
    }
    return ping;
  }

  @action.bound
  removePing(op='pop') {
    this.pings[op]();
  }

  @action.bound
  findPreviousPing(ping) {
    const pingId = this.pings.findIndex(p => p.pingId === ping.pingId) - 1;
    if (pingId >= 0) {
      return this.pings[pingId];
    }
    return null;
  }

  @action.bound
  setPings(pings) {
    this.pings = _.map(pings, ping => (ping instanceof Ping) ? ping : new Ping(ping));
  }

  @action.bound
  setStarted(timestamp) {
    this.startedAt = timestamp ?? this.startedAt;
  }

  @action.bound
  setFinished(timestamp) {
    this.finishedAt = timestamp ?? this.finishedAt;
  }

  @action.bound
  setSync(sync) {
    this.synced = sync ?? this.synced;
  }

  @action.bound
  setProperties(props={}) {
    try {
      this.setTripId(props.tripId);
      if (props.pings?.length) {
        this.setPings(props.pings);
      }
      this.setStarted(props.startedAt);
      this.setFinished(props.finishedAt);
      this.setSync(props.synced);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  @computed
  get isValid() {
    if (!this.finishedAt) {
      return true;
    }
    if (this.firstPing && this.lastPing && this.finishedAt) {
      const minimumHours = (this.firstPing.getTimeBetweenPings(this.lastPing) >= Ping.TRIP_MINIMUM_HOURS);
      const minimumPings = (this.pings.length >= Ping.TRIP_MINIMUM_LOCATIONS);
      return minimumHours && minimumPings;
    }
    return false;
  }

  async parsePings(ping, statusAck) {
    try {
      // Parse specific ping or all pings
      const pings = (ping) ? [ ping ] : this.pings;

      for (let p = 0; p < pings.length; p++) {
        if (statusAck) {
          statusAck(this, p);
        }

        // Grab the previous ping related to the ping getting parsed
        const previousPing = this.findPreviousPing(pings[p]);
        const currentPing = pings[p];
        const nextPing = (!p === pings.length - 1) ? pings[p+1] : null;

        // If the ping has not been parsed yet
        if (!currentPing.parsed) {
          try {
            // If the current ping has no location set, set location from coordinates
            if (!currentPing.country) {
              const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
              currentPing.setCountry(location[0]?.country);
              currentPing.setCity(location[0]?.city);
            }
            
            // If the current ping is not a media ping but is the last ping and the trip is not finished yet, don't parse the ping
            if (currentPing.type !== Ping.PING_TYPE.TYPE_MEDIA && !nextPing && !this.finishedAt) {
              continue;
            }

            currentPing.setDistance(currentPing.getDistanceBetweenCoords(previousPing));
            currentPing.setTransport(currentPing.transport ?? currentPing.isInFlight());
            currentPing.setParsed(true);

            // If the current ping is not a media ping but is the first ping, last ping,
            // or both previous and current pings are transport pings skip venue saving
            if (currentPing.type !== Ping.PING_TYPE.TYPE_MEDIA && (!previousPing || !nextPing || (previousPing.transport && currentPing.transport))) {
              // If the previous ping is a transport ping, merge the current ping with the previous ping
              if (previousPing?.transport) {
                currentPing.merge(previousPing);
                pings.splice(--p, 1);
              }
              continue;
            }

            // If the current ping is a media ping or the ping difference to the next ping is enough to mark it as visited, get the venue data
            if (currentPing.type === Ping.PING_TYPE.TYPE_MEDIA || currentPing.checkIfVisited(nextPing)) {
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
                if (previousPing?.venue?.venueId === venueResponse.venueId) {
                  logger.debug(`This ping is not within 200m of the previous one but at the same venue`);
                  // If the venue data is still the same as the previous one even if the user moved more than 200m
                  // merge the previous ping with the current one but keep the coords of the current one
                  currentPing.merge(previousPing, { withCoords: true });
                  pings.splice(--p, 1);
                } else {
                  // Use the venue data
                  currentPing.setVenue(venueResponse);
                }
              }
              await Trip.delay(1500);
            }
          } catch(err) {
            currentPing.setParsed(false);
            throw err;
          }
        }
      }
    } catch(err) {
      logger.error('Parsing failed: ', err.message);
      logger.debug('Automatic retry in 5 seconds');
      await Trip.delay(5000);
      await this.parsePings(null, statusAck);
    }
  }

  async delete() {
    try {
      await Realm.write(realm => realm.delete(Realm.db.objectForPrimaryKey('Trip', this.tripId)));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  @action.bound
  reset() {
    try {
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('Trip', this.tripId));
      if (!result) {
        throw new CTripError(`Could not reset the Trip (${this.tripId})`);
      }
      this.setProperties(result);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async save() {
    try {
      await Realm.write(realm => realm.create('Trip', {
        tripId: this.tripId,
        pings: this.pings,
        startedAt: this.startedAt,
        finishedAt: this.finishedAt,
        synced: this.synced,
      }, 'all'));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  // @override
  toString() {
    const props = Object.keys(this).filter(k => this[k]);
    return `{ Trip: ${props.map(prop => {
      if (this[prop]) {
        return `${prop}=${this[prop].toString()}`;
      }
    }).join(', ')} }\n`;
  }
}

export default Trip;