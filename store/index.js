import User from './User';
import Navigation from './Navigation';
import SimStore from './SimStore';
import Loading from './Loading';

/* Community packages */
import { observable, action, computed } from "mobx"

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import logger from '../lib/log';

import Mapbox from '@react-native-mapbox-gl/maps';

class Store {
  @observable applicationReady = false;

  constructor() {
    this.User = new User(this);
    this.Navigation = new Navigation(this);
    this.Loading = new Loading(this);
    this.SimStore = SimStore;
  }

  @computed
  get isApplicationReady() {
    return this.applicationReady;
  }

  @action.bound
  async OnApplicationReady() {
    try {
      // Initialize AWS
      AWS.ready();

      // Set Mapbox token and disable telemetry
      Mapbox.setAccessToken('pk.eyJ1IjoiZGF2aWRwYWciLCJhIjoiY2szb3FwamRvMDFnMDNtcDA2bHV0ZWpwNCJ9.vY5NCGfl39eGMZozkUM9LA');
      Mapbox.setTelemetryEnabled(false);

      // Initialize navigation ref
      this.Navigation.ready();

      // Open Realm DB and get the user's session
      await Realm.openRealm();
      // Realm.clearRealm();

      // Create a loader for user session authentication
      this.Loading.createLoader(async () => {
        await this.User.getUserSession();

        this.applicationReady = true;
      }, { 
        message: 'Authenticating',
        failMessage: 'Authentication failed',
        obligatory: true,
      });
    } catch(e) {
      logger.error(e);
    }
  }
}

export default new Store();