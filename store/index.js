import UserStore from './UserStore';
// import SimStore from './SimStore';

class Store {
  constructor() {
    this.UserStore = new UserStore(this);
    // this.SimStore = SimStore;
  }
}

export default new Store();