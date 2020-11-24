import UserStore from './UserStore';
import Navigation from './Navigation';
import Loading from './Loading';
import Dialog from './Dialog';
import TripStore from './TripStore';

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
    this.User = new UserStore(this);
    this.Navigation = new Navigation(this);
    this.Loading = new Loading(this);
    this.Dialog = new Dialog(this);
    this.TripStore = new TripStore(this);
  }

  @computed
  get isApplicationReady() {
    return this.applicationReady;
  }

  @action.bound
  async OnApplicationReady() {
    try {
      logger.info('store.OnApplicationReady > Initializing App');
      // Initialize AWS
      // AWS.ready();

      // Set Mapbox token and disable telemetry
      Mapbox.setAccessToken('pk.eyJ1IjoiZGF2aWRwYWciLCJhIjoiY2szb3FwamRvMDFnMDNtcDA2bHV0ZWpwNCJ9.vY5NCGfl39eGMZozkUM9LA');
      Mapbox.setTelemetryEnabled(false);

      logger.info('store.OnApplicationReady > Initializing Navigation');
      // Initialize navigation ref
      this.Navigation.ready();

      logger.info('store.OnApplicationReady > Loading Realm');
      // Open Realm DB and get the user's session
      await Realm.openRealm();
      // Realm.clearRealm();

      logger.info('store.OnApplicationReady > Retrieving user session');
      // Create a loader for user session authentication
      this.Loading.createLoader(async () => {
        await this.UserStore.getUserSession();
        this.applicationReady = true;
      }, { 
        message: 'Authenticating',
        failMessage: 'Authentication failed',
        obligatory: true,
      });
    } catch(err) {
      logger.error('store.OnApplicationReady >', err.message);
    }
  }
}

export default new Store();