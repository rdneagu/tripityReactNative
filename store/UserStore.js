/* Expo packages */
// import * as SecureStore from 'expo-secure-store';
import * as Permissions from 'expo-permissions';

/* Community packages */
import { observable, reaction, action, computed } from 'mobx';

/* App library */
import AWS from '../lib/aws';
import Realm from '../lib/realm';
import TptyLog from '../lib/log';

// const secureStoreOptions = {
//   keychainService: 'kTripity',
//   keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
// }

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
    this.rootStore = rootStore;
    reaction(() => this.auth.step, this.OnAuthStepChange.bind(this));
  }

  /**
   * Gets the user session and updates the MobX storage
   */
  @action.bound
  async getUserSession() {
    try {
      // Attempt to parse the user key securely stored locally
      let local = true;
      let [ user ] = Realm.db.objects('User').filtered('isLogged = true SORT(loggedAt DESC)').slice(0, 1);

      // If no user logged has been found on the device, keep the user on the get started screen
      if (!user) {
        return this.changeStep(AUTH_STEP.STEP_SPLASH);
      }

      if (Date.now() > user.expiration) {
        // If the current time went over the expiration time verify the user token for geunuinity
        try {
          // Invoke the lambda function and update the token if successfully returned
          user = await AWS.invokeLambda('userAuthenticate', 'RequestResponse', { id: user.id, token: user.token });
          local = false;
        } catch(e) {
          // Redirect the user to the login screen for re-authentication if verification fails
          return this.changeStep(AUTH_STEP.STEP_LOGIN);
        }
      }
      // Save the user object in memory and in realm DB
      await this.setUser(user, local);
    } catch (e) {
      TptyLog.error(e);
    }
  }

  @action.bound
  async register(data={}) {
    const user = await AWS.invokeLambda('userRegister', 'RequestResponse', data);
    await this.setUser(user);
  }

  @action.bound
  async authenticate(data={}) {
    const user = await AWS.invokeLambda('userAuthenticate', 'RequestResponse', data);
    await this.setUser(user);
  }

  @action.bound
  async setHome(data={}) {
    await AWS.invokeLambda('userSetHome', 'RequestResponse', { id: this.user.id, ...data });

    // Update the user if the lambda function was successful
    await this.updateUser(data);
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
        this.user = Realm.db.create('User', { id: this.user.id, ...user }, 'modified');
        resolve();
      });
    });
  }

  /**
   * Sets the user in the realm DB and touches the session
   */
  @action.bound
  async setUser(user={}, local=false) {
    return new Promise((resolve, reject) => {
      // Reject the promise if the user is already set or if the id is missing from the user object
      if (!user.id) {
        return reject('id is missing from the user object, authenticating an user requires the user id!');
      }

      Realm.db.write(() => {
        try {
          // Touch the session then write or update the realm DB
          user.isLogged = true;
          user.loggedAt = Date.now();
          user.expiration = Date.now() + (86400 * 7 * 1000);

          if (!local) {
            // If the user data is not from local Realm DB
            const found = Realm.db.objects('User').filtered(`id = ${user.id}`);
            const modify = (found.length) ? 'modified' : null
            
            user.trips = user.trips || [];
            this.user = Realm.db.create('User', user, modify);
          } else {
            this.user = user;
          }

          this.changeStep(AUTH_STEP.STEP_COUNTRY);
          resolve();
        } catch(e) {
          TptyLog.error(e);
        }
      });
    })
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
        return this.rootStore.NavigationStore.replace('Screen.Splash', { screen: 'Login' });
 
      case AUTH_STEP.STEP_LOGIN:
        return this.rootStore.NavigationStore.replace('Screen.Auth', { screen: 'Login' });

      case AUTH_STEP.STEP_COUNTRY:
        const { homeCountry, homeCity, postCode } = this.user;
        if (!homeCountry || !homeCity || !postCode) {
          return this.rootStore.NavigationStore.replace('Screen.Auth', { screen: 'Country' });
        }
        this.changeStep(AUTH_STEP.STEP_PERMISSIONS);
        break;
      
      case AUTH_STEP.STEP_PERMISSIONS:
        const permissions = await Permissions.getAsync(Permissions.LOCATION, Permissions.CAMERA_ROLL);
        if (permissions.status !== 'granted') {
          return this.rootStore.NavigationStore.replace('Screen.Auth', { screen: 'Permissions' });
        }
        this.changeStep(AUTH_STEP.STEP_FINISHED);
        break;

      default:
        return this.rootStore.NavigationStore.replace('Screen.Main', { screen: 'Itinerary' });
    }
  }

  // @computed
  // get homeCoords() {
  //   const [ coords ] = await Location.geocodeAsync(`${this.homeLocation.homeCountry}, ${this.homeLocation.homeCity}`);
  //   return coords;
  // }

  @computed
  get homeLocation() {
    return {
      homeCity: this.user.homeCity,
      homeCountry: this.user.homeCountry,
      postCode: this.user.postCode,
    }
  }

  @computed
  get lastTrip() {
    const len = this.user.trips.length;
    return (len) ? this.user.trips[len-1] : null;
  }
}

export default UserStore;
