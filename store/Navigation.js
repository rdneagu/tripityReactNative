/* React packages */
import { createRef } from 'react';
import { StackActions } from '@react-navigation/native';

/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from 'mobx';

/* App library */
import logger from '../lib/log';

class Navigation {
  @observable screens = {};
  @observable state = {};
  @observable navigationRefReady = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.navigationRef = createRef();
  }

  @action.bound
  ready() {
    this.state = this.navigationRef.current.getRootState();
    this.navigationRefReady = true;
  }

  @action.bound
  OnStateChange(state) {
    this.state = state;
  }

  @action.bound
  addScreen(options) {
    this.screens[options.name] = observable(options);
  }

  getScreens(parent, tabs) {
    return _.filter(this.screens, screen => {
      const passedCondition = (screen.condition !== undefined) ? screen.condition() : true;
      return screen.name.startsWith(parent) && (screen.isTab === tabs) && passedCondition;
    });
  }  

  getScreenData(screen) {
    return this.screens[screen];
  }

  @action.bound
  setScreenData(screen, key, data) {
    this.screens[screen][key] = data;
  }

  @computed
  get screenData() {
    try {
      if (!this.navigationRefReady) {
        throw 'screenData() attempted to get screen data on unitialized navigationRef';
      }
      return this.screens[this.currentScreen];
    } catch(err) {
      logger.error('store.Navigation.screenData >', err.message);
    }
  }

  @computed
  get screenPath() {
    try {
      if (!this.navigationRefReady) {
        throw 'screenPath() attempted to get screen path on unitialized navigationRef';
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
    } catch(err) {
      logger.error('store.Navigation.screenPath >', err.message);
    }
  }

  @computed
  get currentState() {
    try {
      if (!this.navigationRefReady) {
        throw 'currentState() attempted to get current state on unitialized navigationRef';
      }
      let state = this.state;
      while (state.routes[state.index].state) {
        state = state.routes[state.index].state;
      }
      return state;
    } catch(err) {
      logger.error('store.Navigation.currentState >', err.message);
    }
  }

  @computed
  get currentRoute() {
    try {
      if (!this.navigationRefReady) {
        throw 'currentRoute() attempted to get current route on unitialized navigationRef';
      }
      return this.currentState.routes[this.currentState.index];
    } catch(err) {
      logger.error('store.Navigation.currentRoute >', err.message);
    }
  }

  @computed
  get currentScreen() {
    try {
      if (!this.navigationRefReady) {
        throw 'currentScreen() attempted to get current screen on unitialized navigationRef';
      }
      return this.screenPath.screen;
    } catch(err) {
      logger.error('store.Navigation.currentScreen >', err.message);
    }
  }

  navigate = (name, params) => {
    this.navigationRef.current?.navigate(name, params);
  }

  push = (...args) => {
    this.navigationRef.current?.dispatch(StackActions.push(...args));
  }
  
  replace = (name, params) => {
    this.navigationRef.current?.dispatch(StackActions.replace(name, params));
  }

  canGoBack = () => {
    return this.navigationRef.current?.canGoBack();
  }

  goBack = () => {
    if (this.canGoBack()) {
      this.navigationRef.current?.goBack();
    }
  }
  
}

export default Navigation;
