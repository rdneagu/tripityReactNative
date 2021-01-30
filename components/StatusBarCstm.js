/* React packages */
import React, { Component } from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import { UIActivityIndicator } from 'react-native-indicators';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons'; 

/* MobX store */
import store from '../store/_index';

/* Community packages */
import { observer } from "mobx-react"

/* App classes */
import Loading from '../classes/Loading';

/* App components */
import StyledText from './StyledText';
import StyledButton from './StyledButton';

/**
 * Class definition for the Dialog component
 */
@observer
class StatusBarCstm extends Component {
  constructor() {
    super();
  }

  render() {
    const current = Loading.getQueue('background').active;
    if (!current) {
      return null;
    }

    return (
      <View style={styles.wrapper}>
        <View style={styles.loading}>
          <UIActivityIndicator style={styles.loadingIndicator} size={18} color="white" />
          <StyledText style={styles.loadingText} weight="bold">{current.message}</StyledText>
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
