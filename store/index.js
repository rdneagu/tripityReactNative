import UserStore from './UserStore';
import NavigationStore from './NavigationStore';
import SimStore from './SimStore';

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
    this.UserStore = new UserStore(this);
    this.NavigationStore = new NavigationStore(this);
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
      this.NavigationStore.ready();

      // Open Realm DB and get the user's session
      await Realm.openRealm();
      Realm.clearRealm();
      await this.UserStore.getUserSession();

      this.applicationReady = true;
    } catch(e) {
      logger.error(e);
    }
  }
}

export default new Store();