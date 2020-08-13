import UserStore from './UserStore';
import NavigationStore from './NavigationStore';
// import SimStore from './SimStore';

class Store {
  constructor() {
    this.UserStore = new UserStore(this);
    this.NavigationStore = new NavigationStore(this);
    // this.SimStore = SimStore;
  }
}

export default new Store();