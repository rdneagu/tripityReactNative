/* React navigator */
import { navigationRef as Navigator } from '../navigator';

/* Expo packages */
// import * as SecureStore from 'expo-secure-store';
import * as Permissions from 'expo-permissions';

/* Community packages */
import { observable, computed, reaction } from 'mobx';

/* App library */
import { invokeLambda } from '../lib/lambda';
import Realm from '../lib/realm';
import TptyLog from '../lib/log';

// const secureStoreOptions = {
//   keychainService: 'kTripity',
//   keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
// }

class UserStore {
  @observable user;
  @observable authStep = 0;

  constructor(rootStore) {
    this.rootStore = rootStore;

    reaction(() => this.authStep, this.OnAuthStepChange.bind(this));
  }

  /**
   * Gets the user session and updates the MobX storage
   */
  async getUserSession() {
    try {
      // Attempt to parse the user key securely stored locally
      let user = Realm.toPlainObject(Realm.db.objects('User').sorted('loggedAt', true)[0]);

      if (!user) {
        throw 'No sessions found';
      }

      if (Date.now() > user.expiration) {
        // If the current time went over the expiration time verify the user token for geunuinity
        try {
          const response = await invokeLambda('userAuthenticate', 'RequestResponse', { id: user.id, token: user.token });
          user.token = response.token;
        } catch(e) {
          throw 'User must relog for security reasons';
        }
      }
      await this.setUser(user);
    } catch (e) {
      this.unsetUser();
      TptyLog.error(e);
    }
  }

  register = async (data) => {
    const user = await invokeLambda('userRegister', 'RequestResponse', data);
    await this.setUser(user);
  }

  authenticate = async (data) => {
    const user = await invokeLambda('userAuthenticate', 'RequestResponse', data);
    await this.setUser(user);
  }

  setHome = async (data) => {
    const home = await invokeLambda('userSetHome', 'RequestResponse', { id: this.user.id, ...data });
    // Merge home location into user data and update the user;
    const user = { ...Realm.toPlainObject(this.user), ...home };
    await this.saveUser(user);

    this.authStep = 3;
  }

  confirmPermissions = () => {
    this.authStep = -1;
  }

  /**
   * Saves the user in the secured storage
   */
  saveUser(user) {
    this.userData.expiration = Date.now() + (86400 * 7 * 1000);
    return new Promise((resolve) => {
      Realm.db.write(() => {
        const user = Realm.db.objects('User').filtered(`id = ${this.userData.id}`);
        const modify = (user) ? true : false;
        
        this.user = realm.create('User', this.userData, modify);
      });
      resolve();
    })
  }

  /**
   * Sets the user in the MobX storage and touches the session
   */
  async setUser(user) {
    user.loggedAt = Date.now();
    await this.saveUser(user);

    this.authStep = 2;
  }

  /**
   * Gets the user from the MobX storage
   */
  @computed get user() {
    return (this.userData) ? this.userData.user : null;
  }

  /**
   * Clears the user in the MobX storage
   */
  unsetUser() {
    this.userData = null;

    this.authStep = 2;
  }

  /**
   * Callback observer when authentication step changes
   */
  async OnAuthStepChange(step) {
    if (step === 2) {
      const { homeCountry, homeCity, postCode } = this.userData.user;
      if (!homeCountry || !homeCity || !postCode) {
        return Navigator.replace('Screen.Auth.Country');
      }
    }
    if (step === 3) {
      const permissions = await Permissions.getAsync(Permissions.LOCATION, Permissions.CAMERA, Permissions.CAMERA_ROLL);
      if (permissions.status !== 'granted') {
        return Navigator.replace('Screen.Auth.Permissions');
      }
    }
    return Navigator.replace('Screen.Main.Itinerary');
  }
}

export default UserStore;
