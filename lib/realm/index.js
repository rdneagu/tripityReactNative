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
    trips: 'Trip[]',
    token: 'string',
    expiration: 'int',
    isLogged: 'bool',
    loggedAt: 'int',
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
    country: 'string?',
    city: 'string?',
    timestamp: 'int',
    distance: 'int?',
    transport: 'bool?',
    venue: 'Venue?',
    photos: 'Photo[]',
    parsed: 'bool?',
    synced: 'bool?',
    merged: 'bool?',
  }
}

const PhotoSchema = {
  name: 'Photo',
  primaryKey: 'id',
  properties: {
    id: 'string',
    ping: { type: 'linkingObjects', objectType: 'Ping', property: 'photos' },
    uri: 'string',
    cover: { type: 'bool', default: false },
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
const SCHEMA_VERSION = 14;

import TptyLog from '../log';

class _Realm {
  db = null;
  realmIsReady = false;

  async openRealm() {
    try {
      // Stop opening if the realm database is already opened
      if (this.realmIsReady) {
        return;
      }
      this.db = await Realm.open({
        schema: SCHEMA,
        schemaVersion: SCHEMA_VERSION,
      });
      this.realmIsReady = true;
      TptyLog.debug(`Realm with schema version {${this.db.schemaVersion}} opened`);
    } catch(e) {
      TptyLog.error(e);
    }
  }

  closeRealm() {
    try {
      // Stop closing if the realm database is already closed
      if (!this.realmIsReady) {
        return;
      }

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

  /**
   * Opens the realm if runs the passed query
   *
   * @param {Function} query            Function that contains the realm query
   */
  async run(query) {
    try {
      await this.openRealm();
      const result = query();
      return result;
    } catch(e) {
      TptyLog.error('Realm.run() ->', e);
    }
  }

  /**
   * Opens the realm and commits the transaction passed
   *
   * @param {Function} transaction      Function that contains the realm transaction to commit
   */
  async write(transaction) {
    try {
      await this.openRealm();
      this.db.beginTransaction();
      try {
        await transaction();
        this.db.commitTransaction();
      } catch(e) {
        this.db.cancelTransaction();
        TptyLog.error(e);
      }
    } catch(e) {
      TptyLog.error('Realm.write() ->', e);
    }
  }
}

export default new _Realm();
