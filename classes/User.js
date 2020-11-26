/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from 'mobx';

/* App classes */
import Trip from './Trip';

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import logger from '../lib/log';

class CUserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CUserError';
  }
}

/**
 * Class definition for the User
 */
class User {
  @observable userId;
  @observable email;
  @observable permission;
  @observable fullName;
  @observable birthDay = null;
  @observable homeCountry = null;
  @observable homeCity = null;
  @observable postCode = null;
  @observable trips = [];
  @observable token;
  @observable expiration;
  @observable isLogged;
  @observable loggedAt;

  constructor(props) {
    if (!props.userId) {
      throw new CUserError('id is missing from the user object!');
    }
    this.setProperties(props);
  }

  @computed
  get isAdmin() {
    return (this.permission === 31);
  }

  @computed
  get lastTrip() {
    return (this.trips.length) ? this.trips[this.trips.length - 1] : null;
  }

  @action.bound
  setUserId(userId) {
    this.userId = userId || this.userId;
  }

  @action.bound
  setEmail(email) {
    this.email = email || this.email;
  }

  @action.bound
  setPermission(permission) {
    this.permission = permission || this.permission;
  }

  @action.bound
  setFullName(fullName) {
    this.fullName = fullName || this.fullName;
  }

  @action.bound
  setBirthday(birthDay) {
    this.birthDay = birthDay || this.birthDay;
  }

  @action.bound
  setHomeCountry(homeCountry) {
    this.homeCountry = homeCountry || this.homeCountry;
  }

  @action.bound
  setHomeCity(homeCity) {
    this.homeCity = homeCity || this.homeCity;
  }

  @action.bound
  setPostCode(postCode) {
    this.postCode = postCode || this.postCode;
  }
  
  @action.bound
  addTrip(trip) {
    if (trip) {
      trip = (trip instanceof Trip) ? trip : new Trip(trip);
      this.trips.push(trip);
    }
    return trip;
  }

  @action.bound
  removeTrip() {
    this.trips.pop();
  }

  @action.bound
  setTrips(trips) {
    this.trips = _.map(trips, trip => (trip instanceof Trip) ? trip : new Trip(trip));
  }

  @action.bound
  setToken(token) {
    this.token = token || this.token;
  }

  @action.bound
  setExpiration(exp) {
    this.expiration = exp || this.expiration;
  }

  @action.bound
  setLogged(isLogged) {
    this.isLogged = isLogged || this.isLogged;
  }

  @action.bound
  setLoggedAt(loggedAt) {
    this.loggedAt = loggedAt || this.loggedAt;
  }

  @action.bound
  setProperties(props={}) {
    try {
      this.setUserId(props.userId);
      this.setEmail(props.email);
      this.setPermission(props.permission);
      this.setFullName(props.fullName);
      this.setBirthday(props.birthDay);
      this.setHomeCountry(props.homeCountry);
      this.setHomeCity(props.homeCity);
      this.setPostCode(props.postCode);
      if (props.trips?.length) {
        this.setTrips(props.trips);
      }
      this.setToken(props.token);
      this.setExpiration(props.expiration);
      this.setLogged(props.isLogged);
      this.setLoggedAt(props.loggedAt);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  @action.bound
  reset() {
    try {
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('User', this.userId));
      if (!result) {
        throw new CUserError(`Could not reset the User (${this.userId})`);
      }
      this.setProperties(result);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async parseTrips(trip, statusAck) {
    // Parse specific trip or all trips that have unparsed pings
    const trips = (trip) ? [ trip ] : this.trips.filter(trip => trip.pings.find(ping => !ping.parsed));

    logger.debug('User:', this.email);
    // Go through each of the unparsed ping of each trip that has unparsed pings
    for (let t = 0; t < trips.length; t++) {
      logger.info(`Current trip: id=${trips[t].tripId} | pings=${trips[t].pings.length}`);
      await trips[t].parsePings(null, statusAck);
      trips[t].setSync(Date.now());
      trips[t].save();

      /* Synchronize trip */
      await AWS.invokeAPI('/trips/synchronize', {
        method: 'patch',
        data: { trip: trips[t] }
      });
    }
  }

  async save() {
    try {
      await Realm.write(realm => realm.create('User', {
        userId: this.userId,
        email: this.email,
        permission: this.permission,
        fullName: this.fullName,
        birthDay: this.birthDay,
        homeCountry: this.homeCountry,
        homeCity: this.homeCity,
        postCode: this.postCode,
        trips: this.trips,
        token: this.token,
        expiration: this.expiration,
        isLogged: this.isLogged,
        loggedAt: this.loggedAt,
      }, 'all'));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  // @override
  toString() {
    const props = Object.keys(this).filter(k => this[k]);
    return `{ User: ${props.map(prop => {
      if (this[prop]) {
        return `${prop}=${this[prop].toString()}`;
      }
    }).join(', ')} }\n`;
  }
}

export default User;