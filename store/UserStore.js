/* Expo packages */
// import * as SecureStore from 'expo-secure-store';
import * as Permissions from 'expo-permissions';

/* Community packages */
import { observable, computed, reaction } from 'mobx';

/* Tripity library */
import { invokeLambda } from '../lib/lambda';

/* React navigator */
import { navigationRef as Navigator } from '../navigator';

// const secureStoreOptions = {
//   keychainService: 'kTripity',
//   keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
// }

class UserStore {
  @observable userData;
  @observable authStep = 0;

  constructor(rootStore) {
    this.rootStore = rootStore;

    reaction(() => this.authStep, this.OnAuthStepChange.bind(this));
  }

  /**
   * Gets the user session and updates the MobX storage
   */
  async getUserSession() {
    // await SecureStore.deleteItemAsync('user', secureStoreOptions);
    try {
      // Attempt to parse the user key securely stored locally
      // let user = JSON.parse(await SecureStore.getItemAsync('user', secureStoreOptions));
      throw 'TODO';

      if (Date.now() > user.expiration) {
        // If the current time went over the expiration time retrieve the user data from serverless using the stored JWT
        const payload = {
          id: user.id,
          token: user.token,
        }

        try {
          user = await invokeLambda('userAuthenticate', 'RequestResponse', payload);
        } catch(e) {
          throw 'User must relog for security reasons';
        }
      }
      await this.setUser(user);
    } catch (e) {
      this.unsetUser();
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
    const payload = {
      id: this.userData.user.id,
      ...data,
    }
    const home = await invokeLambda('userSetHome', 'RequestResponse', payload);
  
    // Merge home location into user data and update the user;
    this.userData.user = { ...this.userData.user, ...home };
    await this.saveUser();

    this.authStep = 3;
  }

  confirmPermissions = () => {
    this.authStep = -1;
  }

  /**
   * Saves the user in the secured storage
   */
  async saveUser() {
    this.userData.expiration = Date.now() + (86400 * 7 * 1000);
    // await SecureStore.setItemAsync('user', JSON.stringify(this.userData), secureStoreOptions);
  }

  /**
   * Sets the user in the MobX storage and touches the session
   */
  async setUser(data) {
    this.userData = data;
    await this.saveUser();

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
