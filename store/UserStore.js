/* React packages */
import { Platform } from 'react-native';

/* Expo packages */
// import * as SecureStore from 'expo-secure-store';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';

/* Community packages */
import { observable, reaction, action, computed } from 'mobx';
import axios from 'axios';
import _ from 'lodash';

/* App classes */
import User from '../classes/User';

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import logger from '../lib/log';
import TptyTasks from '../lib/tasks';

// AUTH_STEP enum
const AUTH_STEP = {
  STEP_FINISHED: -1,
  STEP_SPLASH: 0,
  STEP_LOGIN: 1,
  STEP_COUNTRY: 2,
  STEP_PERMISSIONS: 3,
}

class UserStore {
  @observable user;
  @observable auth = {
    step: AUTH_STEP.STEP_SPLASH,
  };

  constructor(rootStore) {
    this.store = rootStore;
    reaction(() => this.auth.step, this.OnAuthStepChange);
  }

  createUser(user) {
    return (user) ? new User(user) : null;
  }

  async getLastLogged() {
    const lastLogged = (await Realm.run(() => Realm.db.objects('User').filtered('isLogged = true LIMIT(1)')))[0];
    return this.user || this.createUser(lastLogged);
  } 

  /**
   * Gets the user session and updates the MobX storage
   */
  @action.bound
  async getUserSession() {
    try {
      // Attempt to parse the user key securely stored locally
      var lastLogged = (await Realm.run(() => Realm.db.objects('User').filtered('isLogged = true LIMIT(1)')))[0];

      // If no user logged has been found on the device, switch to the get started screen
      if (!lastLogged) {
        return this.changeStep(AUTH_STEP.STEP_SPLASH);
      }

      // Invoke the API function and update the token if successfully returned
      const user = await AWS.invokeAPI('/users/authenticate', {
        method: 'post',
        data: { 
          userId: lastLogged.userId,
          token: lastLogged.token,
        }
      });
      await this.setUser(user);
    } catch (err) {
      logger.error('store.UserStore.getUserSession >', err.message);
      await Realm.write(realm => realm.delete(lastLogged));
      this.changeStep(AUTH_STEP.STEP_LOGIN);
    }
  }

  @action.bound
  async register(data) {
    const user = await AWS.invokeAPI('/users/register', {
      method: 'post',
      data,
    });
    await this.setUser(user);
  }

  @action.bound
  async authenticate(data) {
    const user = await AWS.invokeAPI('/users/authenticate', {
      method: 'post',
      data,
    });
    await this.setUser(user);
  }

  @action.bound
  async update(data) {
    await AWS.invokeAPI(`/users/${this.user.userId}/update`, {
      method: 'patch',
      data,
    });

    // Update the user and restart the geofencing service
    this.updateUser(data);
    await this.startHomeGeofencing();
    this.changeStep(AUTH_STEP.STEP_PERMISSIONS);
  }

  @action.bound
  async setPermissions() {
    this.changeStep(AUTH_STEP.STEP_FINISHED);
  }

  /**
   * Updates the user in the realm DB
   */
  @action.bound
  updateUser(user={}) {
    if (!this.user) {
      return reject('The user must be authenticated in order to update it');
    }
    
    // Update the user in the realm DB
    this.user.setProperties(user);
    this.user.save();
  }

  @action.bound
  async deleteUser() {
    try {
      await this.user.delete();
      await AWS.invokeAPI(`/users/${this.user.userId}/delete`, {
        method: 'delete',
      });
      await this.stopHomeGeofencing();
      this.changeStep(AUTH_STEP.STEP_SPLASH);
      this.user = null;
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  /**
   * Sets the user in the realm DB and touches the session
   */
  @action.bound
  async setUser(user={}) {
    try {
      logger.debug(user);
      this.user = new User(user);

      const requireSync = (Date.now() - (this.user.loggedAt || 0) > 60 * 1000);
      this.user.setLogged(true);
      this.user.setLoggedAt(Date.now());
      this.user.setExpiration(Date.now() + (86400 * 7 * 1000));

      this.changeStep(AUTH_STEP.STEP_COUNTRY);

      axios.defaults.headers = {
        ...axios.defaults.headers,
        Authorization: `Bearer ${this.user.userId}:${this.user.token}`,
      }

      if (requireSync) {
        this.store.LoadingStore.createLoader(async () => {
          const trips = await AWS.invokeAPI('/trips/synchronize', {});
          trips
            .filter(trip => {
              const conditionUpdated = (this.user.trips.find(local => trip.tripId === local.tripId && (trip.synced || 0) > (local.synced || 0)));
              const conditionNew = (!this.user.trips.find(local => trip.tripId === local.tripId));
              return (conditionUpdated || conditionNew);
            })
            .forEach(trip => {
              this.user.addTrip(trip);
            });

          this.user.save();
        }, {
          message: 'Synchronizing trips',
          failMessage: 'Failed synchronization',
          obligatory: true,
        });
      }

      this.user.save();
      await this.startHomeGeofencing();
    } catch(err) {
      logger.error('store.UserStore.setUser >', err.message);
    }
  }

  /**
   * Unset the user in the MobX storage and redirect to another authentication step
   *
   * @param {AUTH_SPLASH} redirect    Specify the screen to redirect to
   */
  @action.bound
  async unsetUser(redirect=AUTH_STEP.STEP_SPLASH) {
    this.updateUser({ isLogged: false });
    this.user = null;

    await this.stopHomeGeofencing();
    this.changeStep(redirect);
  }

  @action.bound
  changeStep(step=AUTH_STEP.STEP_SPLASH) {
    this.auth.step = step;
  }

  /**
   * Callback observer when authentication step changes
   */
  @action.bound
  async OnAuthStepChange(step) {
    switch (step) {
      case AUTH_STEP.STEP_SPLASH:
        return this.store.Navigation.replace('Screen.Splash');
 
      case AUTH_STEP.STEP_LOGIN:
        return this.store.Navigation.replace('Screen.Auth', { screen: 'Auth.Login' });

      case AUTH_STEP.STEP_COUNTRY:
        const { homeCountry, homeCity, postCode } = this.user;
        if (!homeCountry || !homeCity || !postCode) {
          return this.store.Navigation.replace('Screen.Auth', { screen: 'Auth.Country' });
        }
        this.changeStep(AUTH_STEP.STEP_PERMISSIONS);
        break;
      
      case AUTH_STEP.STEP_PERMISSIONS:
        const permissions = await Permissions.getAsync(Permissions.LOCATION, Permissions.CAMERA_ROLL);
        if (permissions.status !== 'granted') {
          return this.store.Navigation.replace('Screen.Auth', { screen: 'Auth.Permissions' });
        }
        this.changeStep(AUTH_STEP.STEP_FINISHED);
        break;

      default:
        return this.store.Navigation.replace('Screen.Main', { screen: 'Main.Tab.Trips' });
    }
  }

  /**
   * Starts the geofencing service on current's user home location
   */
  async startHomeGeofencing() {
    try {
      if (!this.user) {
        throw new Error('Attempted to start geofencing service without a logged in user');
      }
      if (Platform.OS === 'android') {
        throw new Error('Geofencing is currently disabled on android');
      }

      const { homeCoords } = await this.getHomeLocation();
      const regions = [{
        ...homeCoords,
        radius: 20 * 1000,
      }];
      await TptyTasks.restartGeofencing(regions);
    } catch(err) {
      logger.error('store.UserStore.startHomeGeofencing >', err.message);
    }
  }

  /**
   * Stops the geofencing service on current's user home location
   */
  async stopHomeGeofencing() {
    try {
      if (this.user) {
        throw 'Attempted to stop geofencing service with a logged in user';
      }

      await TptyTasks.stopGeofencing();
    } catch(err) {
      logger.error('store.UserStore.stopHomeGeofencing >', err.message);
    }
  }

  async getHomeLocation() {
    logger.info(`Fetching coords for user's home location...`);
  
    const { homeCountry, homeCity } = this.homeLocation;
    if (!homeCountry || !homeCity) {
      throw 'Cannot proceed without a home location set';
    }

    const [ homeCoords ] = await Location.geocodeAsync(`${homeCountry}, ${homeCity}`);
    if (!homeCoords) {
      throw 'Failed to parse the home location';
    }

    logger.success('Home location detected!');
    logger.info(`Country: ${homeCountry}`);
    logger.info(`City: ${homeCity}`);
    logger.info(`Coords: ${homeCoords.latitude} lat, ${homeCoords.longitude} lon`);

    return { homeCountry, homeCity, homeCoords };
  }

  @computed
  get homeLocation() {
    return {
      homeCity: this.user.homeCity,
      homeCountry: this.user.homeCountry,
      postCode: this.user.postCode,
    }
  }

  @computed
  get currentUser() {
    return this.user;
  }
}

export default UserStore;
