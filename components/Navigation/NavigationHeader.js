/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, View,
  TouchableOpacity,
} from 'react-native';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons';

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';

/* App components */
import StyledText from '../StyledText';

/**
 * Class definition for the NavigationHeader component
 * 
 * @prop {Array} tabs                 - List of tabs
 * 
 * @injects store
 * Is an @observer class
 */
@inject('store')
@observer
class NavigationHeader extends Component {
  @observable tabs = [];

  constructor(props) {
    super();
    this.tabs = props.tabs;
  }

  @computed
  get selectedTab() {
    const { Navigation } = this.props.store;
    return this.tabs.find(tab => tab.name === Navigation.currentRoute.name);
  }

  render() {
    const { Navigation } = this.props.store;
    if (!this.selectedTab) {
      return null;
    }

    return (
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          {this.selectedTab.icon}
          <StyledText style={styles.text} weight='bold'>{this.selectedTab.title}</StyledText>
        </View>
        {Navigation.canGoBack() &&
          <TouchableOpacity style={styles.back} onPress={Navigation.goBack}>
            <Ionicons name="ios-arrow-back" size={40} color='white' />
          </TouchableOpacity>
        }
      </View>
    )
  }
}

// NavigationHeader.propTypes = {
//   text: PropTypes.string,
//   icon: PropTypes.any,
// }

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 14, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#4169e1',
    borderBottomWidth: 4,
    height: 60,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 10,
  },
  text: {
    color: '#c4cace',
    marginLeft: 10,
  },
})

export default NavigationHeader;
