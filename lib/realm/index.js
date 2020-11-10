const Realm = require('realm');

const UserSchema = {
  name: 'User',
  primaryKey: 'userId',
  properties: {
    userId: 'int',
    email: 'string',
    permission: 'int',
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
  primaryKey: 'tripId',
  properties: {
    tripId: 'string',
    pings: 'Ping[]',
    startedAt: 'int',
    finishedAt: 'int?',
    synced: 'int?',
  }
}

const PingSchema = {
  name: 'Ping',
  primaryKey: 'pingId',
  properties: {
    pingId: 'string',
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
    merged: 'bool?',
  }
}

const PhotoSchema = {
  name: 'Photo',
  primaryKey: 'photoId',
  properties: {
    photoId: 'string',
    uri: 'string',
    s3: 'string?',
    cover: { type: 'bool', default: false },
  }
}

const VenueSchema = {
  name: 'Venue',
  primaryKey: 'venueId',
  properties: {
    venueId: 'string',
    name: 'string',
    category: 'string',
    contact: 'string?',
    location: 'string?',
    url: 'string?',
    description: 'string?',
    hours: 'string?',
  }
}

const SCHEMA = [ UserSchema, TripSchema, PingSchema, PhotoSchema, VenueSchema ];
const SCHEMA_VERSION = 8;

import _ from 'lodash';

import logger from '../log';

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
      logger.debug(`Realm with schema version {${this.db.schemaVersion}} opened`);
    } catch(err) {
      logger.error('Realm.openRealm >', err.message);
    }
  }

  closeRealm() {
    try {
      // Stop closing if the realm database is already closed
      if (!this.realmIsReady) {
        return;
      }

      logger.debug(`Realm with schema {${this.db.schemaVersion}} closed`);
      this.realmIsReady = false;
      this.db.close();
    } catch(err) {
      logger.error('Realm.closeRealm >', err.message);
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
    } catch(err) {
      logger.error('Realm.getRealmVersion >', err.message);
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
      return query();
    } catch(err) {
      logger.error('Realm.run >', err.message);
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
        transaction(this.db);
        this.db.commitTransaction();
      } catch(err) {
        this.db.cancelTransaction();
        throw err;
      }
    } catch(err) {
      logger.error('Realm.write >', err.message);
    }
  }

  toJSON(realmObject) {
    const stringified = JSON.stringify(realmObject, (key, value) => {
      if (_.isObject(value) && value.length !== undefined) {
        const arr = [];
        for (let val of value.values()) {
          arr.push(val);
        }
        return arr;
      }
      return value;
    });
    return JSON.parse(stringified);
  }
}

export default new _Realm();
