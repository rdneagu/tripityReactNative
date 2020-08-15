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
  }
};

const SCHEMA_VERSION = 4;

import TptyLog from '../log';

class _Realm {
  db = null;
  realmIsReady = false;

  async openRealm() {
    try {
      if (this.realmIsReady) throw 'openRealm() -> Realm is already initialized';

      this.db = await Realm.open({
        schema: [UserSchema],
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
      if (!this.realmIsReady) throw 'closeRealm() -> Realm is not initialized yet';

      TptyLog.debug(`Realm with schema {${this.db.schemaVersion}} closed`);
      this.realmIsReady = false;
      this.db.close();
    } catch(e) {
      TptyLog.error(e);
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
