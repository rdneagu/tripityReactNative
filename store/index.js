import UserStore from './UserStore';
import NavigationStore from './NavigationStore';
import SimStore from './SimStore';

/* Community packages */
import { observable, action, computed } from "mobx"

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import TptyTasks from '../lib/tasks';
import TptyLog from '../lib/log';

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
      // Initialize navigation ref
      this.NavigationStore.OnReady();
      
      // Initialize AWS
      AWS.initialize();

      // Set Mapbox token and disable telemetry
      Mapbox.setAccessToken('pk.eyJ1IjoiZGF2aWRwYWciLCJhIjoiY2szb3FwamRvMDFnMDNtcDA2bHV0ZWpwNCJ9.vY5NCGfl39eGMZozkUM9LA');
      Mapbox.setTelemetryEnabled(false);

      // Open Realm DB and get the user's session
      await Realm.openRealm();
      await this.UserStore.getUserSession();

      // Start background tasks
      await TptyTasks.startGeofencing();

      this.applicationReady = true;
    } catch(e) {
      console.log(e);
      TptyLog.error(e);
    }
  }
}

export default new Store();