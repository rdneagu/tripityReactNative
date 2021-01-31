/* React packages */
import React, { Component } from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import { UIActivityIndicator } from 'react-native-indicators';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons'; 

/* MobX store */
import store from '../store/_index';

/* Community packages */
import { observable, computed } from "mobx"
import { observer } from "mobx-react"

/* App classes */
import Loading from '../classes/Loading';
import { LOADING_STATES } from '../classes/LoadingQueue';

/* App components */
import StyledText from './StyledText';
import StyledButton from './StyledButton';

/**
 * Class definition for the StatusBarCstm component
 */
@observer
class StatusBarCstm extends Component {
  @observable timeTicker = 0;

  constructor() {
    super();
    this.tick();
  }

  tick() {
    if (this.currentLoading?.state === LOADING_STATES.PENDING) {
      this.timeTicker = Math.floor((Date.now() - this.currentLoading.startTz) / 1000);
    }
    setTimeout(this.tick.bind(this), 1000);
  }

  @computed get formattedTimeTicker() {
    const hour = Math.floor(this.timeTicker / 3600);
    const minute = Math.floor(this.timeTicker / 60) % 60;
    const second = this.timeTicker % 60;

    let hourStr = (hour) ? `${hour.toString().padStart(2, '0')}:` : '';
    return `${hourStr}${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }

  @computed get currentLoading() {
    const current = Loading.getQueue('background').active;
    if (!current) {
      return null;
    }
    return current;
  }

  render() {
    if (!this.currentLoading) {
      return null;
    }

    let loadingComponent;
    let stateStyle;
    let textPrefix;
    let textAttempt = (this.currentLoading.tryTimes > 1) ? `(Try #${this.currentLoading.tryTimes}) ` : '';
    switch (this.currentLoading.state) {
      case LOADING_STATES.FINISHED:
        stateStyle = { backgroundColor: '#228B22' };
        textPrefix = 'Success: ';
        loadingComponent = <>
          <Ionicons style={{ marginRight: 5 }} name='md-checkmark' color="white" size={18} />
        </>
        break;
      case LOADING_STATES.FAILED:
        stateStyle = { backgroundColor: 'tomato' };
        textPrefix = `${textAttempt}Failed: `;
        loadingComponent = <>
          <Ionicons style={{ marginRight: 5 }} name='md-close' color="white" size={18} />
        </>
        break;
      default:
        textPrefix = textAttempt;
        loadingComponent = <>
          <UIActivityIndicator animationDuration={1800} style={styles.loadingIndicator} size={18} color="white" />
        </>
    }

    return (
      <View style={{ ...styles.wrapper, ...stateStyle }}>
        <View style={styles.loading}>
          {loadingComponent}
          <StyledText style={styles.loadingText} weight="bold">{textPrefix}{this.currentLoading.message} ({this.formattedTimeTicker})</StyledText>
        </View>
        <View style={styles.filler} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: PixelRatio.getPixelSizeForLayoutSize(10),
    flexDirection: 'row',
    paddingHorizontal: PixelRatio.getPixelSizeForLayoutSize(8),
    backgroundColor: '#00aaff',
    borderBottomColor: '#000e26',
    borderBottomWidth: 1,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginHorizontal: 8,
  },
  loadingText: {
    marginLeft: 5,
  },
  filler: {
    flex: 1,
  }
});

export default StatusBarCstm;
