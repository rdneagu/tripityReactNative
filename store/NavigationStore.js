/* React packages */
import { createRef } from 'react';
import { StackActions } from '@react-navigation/native';

/* Community packages */
import { observable, action, computed } from 'mobx';

/* App library */
import TptyLog from '../lib/log';

class NavigationStore {
  @observable state = {};
  @observable navigationRefReady = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.navigationRef = createRef();
  }

  @action.bound
  OnReady() {
    this.state = this.navigationRef.current.getRootState();
    this.navigationRefReady = true;
  }

  @action.bound
  OnStateChange(state) {
    this.state = state;
  }

  @computed
  get screenPath() {
    try {
      if (!this.navigationRefReady) {
        throw 'Attempted to get screen path on unitialized navigationRef';
      }
      let path = null;
      let state = this.state;
      while (state) {
        const { index, routes } = state;
        path = {
          parent: path,
          screen: routes[index].name,
        }
        state = routes[index].state;
      }
      return path;  
    } catch(e) {
      TptyLog.error(e);
    }
  }

  @computed
  get currentScreen() {
    try {
      if (!this.navigationRefReady) {
        throw 'Attempted to get current screen on unitialized navigationRef';
      }
      return this.screenPath.screen;
    } catch(e) {
      TptyLog.error(e);
    }
  }

  navigate(name, params) {
    this.navigationRef.current?.navigate(name, params);
  }

  push(...args) {
    this.navigationRef.current?.dispatch(StackActions.push(...args));
  }
  
  replace(name, params) {
    this.navigationRef.current?.dispatch(StackActions.replace(name, params));
  }
  
}

export default NavigationStore;
