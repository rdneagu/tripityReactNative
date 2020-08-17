const Realm = require('realm');

const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'int',
    email:  'string',
    fullName: 'string',
    birthDay: 'string?',
    homeCountry: 'string?',
    homeCity: 'string?',
    postCode: 'string?',
    token: 'string',
    expiration: 'int',
    isLogged: 'bool',
    loggedAt: 'int',
    trips: 'Trip[]',
  }
};

const TripSchema = {
  name: 'Trip',
  primaryKey: 'id',
  properties: {
    id: 'string',
    user: { type: 'linkingObjects', objectType: 'User', property: 'trips' },
    pings: 'Ping[]',
    finished: { type: 'bool', default: false },
  }
}

const PingSchema = {
  name: 'Ping',
  primaryKey: 'id',
  properties: {
    id: 'string',
    trip: { type: 'linkingObjects', objectType: 'Trip', property: 'pings' },
    latitude: 'float',
    longitude: 'float',
    country: 'string',
    city: 'string',
    time: 'int',
    distance: 'int?',
    transport: 'bool?',
    venue: 'Venue?',
    photos: 'Photo[]',
  }
}

const PhotoSchema = {
  name: 'Photo',
  primaryKey: 'id',
  properties: {
    id: 'string',
    ping: { type: 'linkingObjects', objectType: 'Ping', property: 'photos' },
    uri: 'string',
    cover: 'bool?',
  }
}

const VenueSchema = {
  name: 'Venue',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    category: 'string',
    /* To add the rest of venue details */
    reviews: 'VenueReview[]',
  }
}

const VenueReviewSchema = {
  name: 'VenueReview',
  primaryKey: 'id',
  properties: {
    id: 'string',
    venue: { type: 'linkingObjects', objectType: 'Venue', property: 'reviews' },
    user: 'User',
    stars: 'int',
    comment: 'string?',
  }
}

const SCHEMA = [ UserSchema, TripSchema, PingSchema, PhotoSchema, VenueSchema, VenueReviewSchema ];
const SCHEMA_VERSION = 11;

import TptyLog from '../log';

class _Realm {
  db = null;
  realmIsReady = false;

  async openRealm() {
    try {
      if (this.realmIsReady) throw 'openRealm() -> Realm is already initialized';
      this.db = await Realm.open({
        schema: SCHEMA,
        schemaVersion: SCHEMA_VERSION,
      });
      // this.clearRealm();
      this.realmIsReady = true;
      TptyLog.debug(`Realm with schema version {${this.db.schemaVersion}} opened`);
    } catch(e) {
      TptyLog.error(e);
    }
  }

  closeRealm() {
    try {
      if (!this.realmIsReady) throw 'closeRealm() -> Realm is not initialized yet';

      TptyLog.debug(`Realm with schema {${this.db.schemaVersion}} closed`);
      this.realmIsReady = false;
      this.db.close();
    } catch(e) {
      TptyLog.error(e);
    }
  }

  clearRealm() {
    try {
      this.db.beginTransaction();
      this.db.deleteAll();
      this.db.commitTransaction();
    } catch(e) {
      this.db.cancelTransaction();
    }
  }

  getRealmVersion() {
    try {
      if (!this.realmIsReady) throw 'geRealmVersion() -> Realm is not initialized yet';
      
      return this.db.schemaVersion;
    } catch(e) {
      TptyLog.error(e);
    }
  }

  toPlainObject(realmResult) {
    return JSON.parse(JSON.stringify(realmResult));
  }
}

export default new _Realm();
