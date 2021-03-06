/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from 'mobx';

/* App classes */
import Photo from './Photo';
import Venue from './Venue';

/* App library */
import Realm from '../lib/realm';
import logger from '../lib/log';

class CPingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CPingError';
  }
}

/**
 * Class definition for the Ping
 */
class Ping {
  static TRIP_DISTANCE_TRIGGER_THRESHOLD = 40; // in KM
  static TRIP_MINIMUM_LOCATIONS = 3 // minimum number of visited locations for a trip to be recorded
  static TRIP_MINIMUM_HOURS = 3600 * 2 // minimum hours spent in a trip to be recorded (in seconds)
  static FLIGHT_DISTANCE_TRIGGER_THRESHOLD = 80; // in KM
  static FLIGHT_ALTITUDE_TRIGGER_THRESHOLD = 4000; // in m
  static INTERVAL = 900; // in seconds
  static TIME_REQUIRED_VISIT = (this.INTERVAL + this.INTERVAL/2); // time required to confirm a visit (in seconds)
  static TIME_MAX_BETWEEN_TRIPS = 3600 * 24 * 7; // 7 days difference maximum between trips (in seconds)
  static PING_TYPE = {
    TYPE_REALTIME: 0,
    TYPE_MEDIA: 1,
  }

  @observable pingId;
  @observable type = Ping.PING_TYPE.TYPE_REALTIME;
  @observable latitude;
  @observable longitude;
  @observable altitude = 0;
  @observable country = null;
  @observable city = null;
  @observable timestamp = Date.now();
  @observable distance = null;
  @observable transport = null;
  @observable venue;
  @observable photos = [];
  @observable parsed;
  @observable merged;

  constructor(props) {
    this.setProperties(props);
  }

  @computed
  get sortedPhotos() {
    return this.photos.slice().sort((p1, p2) => p1.timestamp - p2.timestamp);
  }

  @computed
  get firstPhoto() {
    return (this.photos.length) ? this.sortedPhotos[0] : null;
  }

  @computed
  get lastPhoto() {
    return (this.photos.length) ? this.sortedPhotos[this.photos.length - 1] : null;
  }

  isHighAltitude() {
    return (this.altitude && this.altitude > Ping.FLIGHT_ALTITUDE_TRIGGER_THRESHOLD);
  }
  
  isLongDistance() {
    return (this.distance && this.distance > Ping.FLIGHT_DISTANCE_TRIGGER_THRESHOLD);
  }

  isInFlight() {
    return (this.isHighAltitude() || this.isLongDistance() || this.city === null);
  }

  checkIfVisited(previousPing) {
    return (previousPing.getTimeBetweenPings(this) >= Ping.TIME_REQUIRED_VISIT && !this.transport);
  }

  isHome(homeCoords) {
    return (this.getDistanceBetweenCoords(homeCoords) < Ping.TRIP_DISTANCE_TRIGGER_THRESHOLD);
  }

  /**
   * Gets time taken, in seconds, between two pings
   * Formula: (to - from) / 1000
   */
  getTimeBetweenPings(to) {
    if (!to) {
      return 0;
    }
    return (to.timestamp - this.timestamp) / 1000;
  }

  /**
   * Gets distance, in kilometers, between two pings
   */
  getDistanceBetweenCoords(to) {
    if (!to) {
      return null;
    }
    const lat1 = this.latitude;
    const lon1 = this.longitude;
    const lat2 = to.latitude;
    const lon2 = to.longitude;
    // φ is latitude
    // λ is longitude
    // R is earth’s radius (mean radius = 6,371km)
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
  
    return distance / 1000;
  }

  @action.bound
  setPingId(pingId) {
    this.pingId = pingId ?? this.pingId;
  }

  @action.bound
  setType(type) {
    this.type = type ?? this.type;
  }

  @action.bound
  setLatitude(latitude) {
    this.latitude = latitude ?? this.latitude;
  }

  @action.bound
  setLongitude(longitude) {
    this.longitude = longitude ?? this.longitude;
  }

  @action.bound
  setAltitude(altitude) {
    this.altitude = altitude ?? this.altitude;
  }

  @action.bound
  setCountry(country) {
    this.country = country ?? this.country;
  }

  @action.bound
  setCity(city) {
    this.city = city ?? this.city;
  }

  @action.bound
  setTimestamp(timestamp) {
    this.timestamp = timestamp ?? this.timestamp;
  }

  @action.bound
  setDistance(distance) {
    this.distance = distance ?? this.distance;
  }

  @action.bound
  setTransport(transport) {
    this.transport = transport ?? this.transport;
  }

  @action.bound
  setVenue(venue) {
    if (venue) {
      venue = (venue instanceof Venue) ? venue : new Venue(venue);
    }
    this.venue = venue ?? this.venue;
  }

  @action.bound
  addPhoto(photo) {
    if (photo) {
      photo = (photo instanceof Photo) ? photo : new Photo(photo);
      this.photos.push(photo);
    }
  }

  @action.bound
  setPhotos(photos) {
    this.photos = _.map(photos, photo => (photo instanceof Photo) ? photo : new Photo(photo));
  }

  @action.bound
  setParsed(parsed) {
    this.parsed = parsed ?? this.parsed;
  }

  @action.bound
  setMerged(merged) {
    this.merged = merged ?? this.merged;
  }

  @action.bound
  setProperties(props) {
    try {
      if (!props) {
        throw new CPingError("Cannot set props to Ping object cause props is not an object");
      }
      this.setPingId(props.pingId);
      this.setType(props.type);
      this.setLatitude(props.latitude);
      this.setLongitude(props.longitude);
      this.setAltitude(props.altitude);
      this.setCountry(props.country);
      this.setCity(props.city);
      this.setTimestamp(props.timestamp);
      this.setDistance(props.distance);
      this.setTransport(props.transport);
      this.setVenue(props.venue);
      if (props.photos?.length) {
        this.setPhotos(props.photos);
      }
      this.setParsed(props.parsed);
      this.setMerged(props.merged);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  compare(toPing, key) {
    return this[key] === toPing[key];
  }

  @action.bound
  merge(withPing, options={}) {
    logger.debug('Merging pings!');
    if (options.withCoords) {
      this.setLatitude(withPing.latitude);
      this.setLongitude(withPing.longitude);
      this.setAltitude(withPing.altitude);
      this.setCountry(withPing.country);
      this.setCity(withPing.city);
    }
    if (!options.keepTime) {
      this.setTimestamp(withPing.timestamp);
    }
    this.setTransport(withPing.transport);
    this.setVenue(withPing.venue);
    this.setPhotos(this.photos.concat(withPing.photos));
    withPing.setMerged(true);
  }

  @action.bound
  reset() {
    try {
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('Ping', this.pingId));
      if (!result) {
        throw new CPingError(`Could not reset the Ping (${this.pingId})`);
      }
      this.setProperties(result);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async save() {
    try {
      await Realm.write(realm => realm.create('Ping', {
        pingId: this.pingId,
        type: this.type,
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: this.altitude,
        country: this.country,
        city: this.city,
        timestamp: this.timestamp,
        distance: this.distance,
        transport: this.transport,
        venue: this.venue,
        photos: this.photos,
        parsed: this.parsed,
        merged: this.merged,
      }, 'all'));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async delete() {
    try {
      await Realm.write(realm => realm.delete(realm.objectForPrimaryKey('Ping', this.pingId)));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  // @override
  toString() {
    const props = Object.keys(this).filter(k => this[k]);
    return `{ Ping: ${props.map(prop => {
      if (this[prop]) {
        return `${prop}=${this[prop].toString()}`;
      }
    }).join(', ')} }\n`;
  }
}

export default Ping;