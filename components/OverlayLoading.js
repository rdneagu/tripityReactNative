/* React packages */
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Animated, Easing } from 'react-native';
import Modal from 'react-native-modal';

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer } from "mobx-react"

/* MobX store */
import store from '../store/_index';

/* App components */
import IndeterminateLoading from './IndeterminateLoading';

const LOADING_TYPE = {
  INDETERMINATE: 0,
  DETERMINATE: 1,
}

@observer
class OverlayLoading extends Component {
  @observable loadingType = LOADING_TYPE.INDETERMINATE;

  constructor() {
    super();
  }

  render() {
    let loader;
    if (store.LoadingStore.currentLoader) {
      switch (this.loadingType) {
        case LOADING_TYPE.INDETERMINATE: 
          loader = <IndeterminateLoading>{store.LoadingStore.message}</IndeterminateLoading>
          break;
        case LOADING_TYPE.DETERMINATE:
          loader = <IndeterminateLoading>{store.LoadingStore.message}</IndeterminateLoading>
          // TODO: TPA-38
      }
    }
    
    if (!store.LoadingStore.isVisible) {
      return null;
    }
    return (
      <View style={styles.loadingWrapper}>
        {loader}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  loadingWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, .6)',
  },
});

export default OverlayLoading;
