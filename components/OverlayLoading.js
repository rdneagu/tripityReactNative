/* React packages */
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Animated, Easing } from 'react-native';
import Modal from 'react-native-modal';

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer } from "mobx-react"

/* MobX store */
import store from '../store';

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
    if (store.Loading.currentLoader) {
      switch (this.loadingType) {
        case LOADING_TYPE.INDETERMINATE: 
          loader = <IndeterminateLoading>{store.Loading.message}</IndeterminateLoading>
          break;
        case LOADING_TYPE.DETERMINATE:
          loader = <IndeterminateLoading>{store.Loading.message}</IndeterminateLoading>
          // TODO: TPA-38
      }
    }
    
    return (
      <Modal isVisible={store.Loading.isVisible} style={{ margin: 0 }} animationIn="fadeIn" animationOut="fadeOut">
        <View style={styles.loadingWrapper}>
          {loader}
        </View>
      </Modal>
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
  },
});

export default OverlayLoading;
