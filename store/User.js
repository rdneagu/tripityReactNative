/* Expo packages */
// import * as SecureStore from 'expo-secure-store';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';

/* Community packages */
import { observable, reaction, action, computed } from 'mobx';
import axios from 'axios';
import _ from 'lodash';

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

class User {
  @observable user;
  @observable auth = {
    step: AUTH_STEP.STEP_SPLASH,
  };

  constructor(rootStore) {
    this.store = rootStore;
    reaction(() => this.auth.step, this.OnAuthStepChange.bind(this));
  }

  async getLastLogged() {
    return this.user || (await Realm.run(() => Realm.db.objects('User').filtered('isLogged = true LIMIT(1)')))[0];
  }

  /**
   * Gets the user session and updates the MobX storage
   */
  @action.bound
  async getUserSession() {
    try {
      // Attempt to parse the user key securely stored locally
      let local = true;
      let user = await this.getLastLogged();

      // If no user logged has been found on the device, keep the user on the get started screen
      if (!user) {
        return this.changeStep(AUTH_STEP.STEP_SPLASH);
      }

      if (Date.now() > user.expiration) {
        // If the current time went over the expiration time verify the user token for geunuinity
        try {
          // Invoke the lambda function and update the token if successfully returned
          user = await AWS.invokeAPI('/users/authenticate', {
            method: 'post',
            data: { 
              userId: user.userId,
              token: user.token,
            }
          });
          local = false;
        } catch(e) {
          // Redirect the user to the login screen for re-authentication if verification fails
          return this.changeStep(AUTH_STEP.STEP_LOGIN);
        }
      }
      // Save the user object in memory and in realm DB
      await this.setUser(user, local);
    } catch (e) {
      logger.error('getUserSession() ->', e);
    }
  }

  @action.bound
  async register(data) {
    // const user = await AWS.invokeLambda('userRegister', 'RequestResponse', data);
    const user = await AWS.invokeAPI('/users/register', {
      method: 'post',
      data,
    });

    await this.setUser(user);
  }

  @action.bound
  async authenticate(data) {
    // const user = await AWS.invokeLambda('userAuthenticate', 'RequestResponse', data);
    const user = await AWS.invokeAPI('/users/authenticate', {
      method: 'post',
      data,
    });

    await this.setUser(user);
  }

  @action.bound
  async setHome(data) {
    // await AWS.invokeLambda('userSetHome', 'RequestResponse', { id: this.user.id, ...data });
    await AWS.invokeAPI(`/users/${this.user.userId}/update`, {
      method: 'patch',
      data,
    });

    // Update the user and restart the geofencing service
    await this.updateUser(data);
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
  async updateUser(user={}) {
    return new Promise((resolve, reject) => {
      // Reject the promise if the user is not initialized yet or if the id is missing from the user object
      if (!this.user) {
        return reject('The user must be authenticated in order to update it');
      }
      
      // Update the user in the realm DB and fulfill the promise
      Realm.db.write(() => {
        this.user = Realm.db.create('User', { userId: this.user.userId, ...user }, 'modified');
        resolve();
      });
    });
  }

  /**
   * Sets the user in the realm DB and touches the session
   */
  @action.bound
  async setUser(user={}, local=false) {
    try {
      // Reject the promise if the user is already set or if the id is missing from the user object
      if (!user.userId) {
        throw 'id is missing from the user object, authenticating an user requires the user id!';
      }

      const requireSync = (Date.now() - (user.loggedAt || 0) > 60 * 1000);

      await Realm.write((realm) => {
        // Touch the session then write or update the realm DB
        user.isLogged = true;
        user.loggedAt = Date.now();
        user.expiration = Date.now() + (86400 * 7 * 1000);

        if (!local) {
          // If the user data is not from local Realm DB
          user.trips = [];
          this.user = realm.create('User', user, 'all');
        } else {
          this.user = user;
        }

        this.changeStep(AUTH_STEP.STEP_COUNTRY);
      });

      axios.defaults.headers = {
        ...axios.defaults.headers,
        Authorization: `Bearer ${user.userId}:${user.token}`,
      }

      if (requireSync) {
        this.store.Loading.createLoader(async () => {
          const trips = await AWS.invokeAPI('/trips/synchronize', {});
          const tripsToSync = trips.filter(trip => {
            const conditionUpdated = (this.user.trips.find(local => trip.tripId === local.tripId && trip.synced > local.synced));
            const conditionNew = (!this.user.trips.find(local => trip.tripId === local.tripId));
            return conditionUpdated || conditionNew;
          });
          logger.info(tripsToSync);
          await Realm.write((realm) => {
            tripsToSync.forEach(trip => {
              const realmTrip = realm.create('Trip', trip, 'all');
              this.user.trips.push(realmTrip);
            });
          });
        }, {
          message: 'Synchronizing trips',
          failMessage: 'Failed synchronization',
          obligatory: true,
        });
      }

      await this.startHomeGeofencing();
    } catch(e) {
      logger.error('setUser() ->', e);
    }
  }

  /**
   * Unset the user in the MobX storage and redirect to another authentication step
   *
   * @param {AUTH_SPLASH} redirect    Specify the screen to redirect to
   */
  @action.bound
  async unsetUser(redirect=AUTH_STEP.STEP_SPLASH) {
    await this.updateUser({ isLogged: false });
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
        throw 'Attempted to start geofencing service without a logged in user';
      }

      const { homeCoords } = await this.getHomeLocation();
      const regions = [{
        ...homeCoords,
        radius: 20 * 1000,
      }];
      await TptyTasks.restartGeofencing(regions);
    } catch(e) {
      logger.error('startHomeGeofencing() ->', e);
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
    } catch(e) {
      logger.error('stopHomeGeofencing() ->', e);
    }
  }

  async getHomeLocation() {
    logger.info(`Fetching coords for user's home location...`);
    console.log(await Location.geocodeAsync(`United Kingdom, Glasgow, G20 6AF`));
  
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
}

export default User;
