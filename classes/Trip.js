/* Community packages */
import { observable, action, computed } from 'mobx';
import _ from 'lodash';

/* App classes */
import Ping from './Ping';

/* App library */
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

  @computed
  get firstPing() {
    return (this.pings.length) ? this.pings[0] : null;
  }

  @computed
  get lastPing() {
    return (this.pings.length) ? this.pings[this.pings.length - 1] : null;
  }

  @action.bound
  setTripId(tripId) {
    this.tripId = tripId || this.tripId;
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
    this.pings[op];
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
    this.startedAt = timestamp || this.startedAt;
  }

  @action.bound
  setFinished(timestamp) {
    this.finishedAt = timestamp || this.finishedAt;
  }

  @action.bound
  setSync(sync) {
    this.synced = sync || this.synced;
  }

  @action.bound
  setProperties(props={}) {
    try {
      this.setTripId(props.tripId);
      if (props.pings.length) {
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

  async parsePings(ping) {
    try {
      // Parse specific ping or all pings
      const pings = (ping) ? [ ping ] : this.pings;

      // If the trip is not finished, ignore the last ping
      let pingsNum = (this.finishedAt) ? pings.length : pings.length - 1;

      for (let p = 0; p < pingsNum; p++) {
        // Grab the previous ping related to the ping getting parsed
        const previousPing = this.findPreviousPing(pings[0]);
        const currentPing = pings[p];

        // If the ping has not been parsed yet
        if (!currentPing.parsed) {
          try {
            const isFirstPing = currentPing.compare(this.firstPing, 'pingId');
            const isLastPing = currentPing.compare(this.lastPing, 'pingId');

            // If the current ping has no location set, set location from coordinates
            if (!currentPing.country) {
              const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
              currentPing.setCountry(location[0].country);
              currentPing.setCity(location[0].city);
            }

            // If the current ping is the last ping and the trip is not finished yet, don't parse the ping
            if (isLastPing && !this.finishedAt) {
              continue;
            }

            currentPing.setDistance(currentPing.getDistanceBetweenCoords(previousPing));
            currentPing.setTransport(isLastPing || currentPing.isInFlight());
            currentPing.setParsed(true);

            // If this is the first ping or both previous and current pings are transport pings skip venue saving
            if (isFirstPing || (previousPing?.transport && currentPing.transport)) {
              // If this is the last ping and the trip is finished or is a transport ping, also merge the current ping with the previous ping
              if (previousPing?.transport) {
                currentPing.mergePings(previousPing);
                pings.splice(--p, 1);
              }
              continue;
            }

            if (currentPing.isVisited()) {
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
                  // or there is no venue at the current location (the user is most likely flying)
                  // Still merge the previous ping with the current one but keep the coords of the current one
                  currentPing.mergePings(previousPing, { withCoords: true });
                  pings.splice(--p, 1);
                } else {
                  // Use the venue data
                  currentPing.setVenue(venueResponse);
                }
              }
              await asyncTimeout(1500);
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
      await asyncTimeout(5000);
      await this.parsePings(null, trip);
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
    return `{ Trip: ${_.map(Object.getOwnPropertyNames(new Trip), prop => this[prop]).join(', ')} }\n`;
  }
}

export default Trip;