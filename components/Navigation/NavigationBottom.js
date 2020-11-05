/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, View,
  Animated, Easing,
} from 'react-native';

/* Community packages */
import _ from 'lodash';
import { observable, action, computed, reaction } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';

/* App components */
import NavigationBottomTab from './NavigationBottomTab';

/**
 * Class definition for the NavigationBottom component
 * 
 * @prop {Array} tabs                 - List of tabs
 * 
 * @injects store
 * Is an @observer class
 */
@inject('store')
@observer
class NavigationBottom extends Component {
  @observable tabs = [];
  @observable current = -1;

  constructor(props) {
    super();

    this.tabs = props.tabs;
    this.animation = {
      left: new Animated.Value(-82),
    };
  }

  componentDidMount() {
    reaction(() => this.props.store.Navigation.currentRoute, (route) => this.animateThumb(this.findIndex(route.name)));
  }

  @action.bound
  computeThumbPosition(tabIndex) {
    const validTab = (tabIndex !== -1 && this.tabs[tabIndex] && this.tabs[tabIndex].x !== undefined);
    return (validTab) ? (this.tabs[tabIndex].x + (this.tabs[tabIndex].width / 2)) - 20 : -82;
  }

  @action.bound
  animateThumb(tabIndex) {
    const position = this.computeThumbPosition(tabIndex);
    Animated.timing(this.animation.left, { 
      toValue: position,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }

  /**
   * Triggered when the layout is changed
   *
   * @param {Object} e  - Event properties
   */
  @action.bound
  onLayout(tabIndex, layout) {
    this.tabs[tabIndex].x = layout.x;
    this.tabs[tabIndex].width = layout.width;

    if (this.selectedIndex === tabIndex) {
      const position = this.computeThumbPosition(tabIndex);
      this.animation.left.setValue(position);
    }
  }

  @action.bound
  findIndex(name) {
    return this.tabs.findIndex(tab => tab.name === name);
  }

  @computed
  get selectedIndex() {
    const { Navigation } = this.props.store;
    return this.findIndex(Navigation.currentRoute.name);
  }

  @action.bound
  onPress(tabIndex) {
    const { Navigation } = this.props.store;
    const params = Navigation.currentRoute.params;
    if (this.selectedIndex !== tabIndex) {
      Navigation.push(this.tabs[tabIndex].name, { params });
    }
  }

  @computed
  get renderTabs() {
    return this.tabs.map((tab, index) => {
      const onPress = () => this.onPress(index);
      const onLayout = (e) => this.onLayout(index, e.nativeEvent.layout);
      return <NavigationBottomTab key={index} icon={tab.icon} isFocused={this.selectedIndex === index} onPress={onPress} onLayout={onLayout} />
    })
  }

  render() {
    return (
      <View style={{ width: '100%', paddingVertical: 8, backgroundColor: '#000e26', overflow: 'hidden' }}>
        <Animated.View style={{ ...styles.marker, transform: [{ translateX: this.animation.left }] }}>
          <View style={styles.markerLeft}>
            <View style={styles.markerLeftRound} />
          </View>
          <View style={styles.markerMiddle} />
          <View style={styles.markerRight}>
            <View style={styles.markerRightRound} />
          </View>
        </Animated.View>
        <View style={{ position: 'absolute', height: 8, width: '100%', backgroundColor: '#4169e1' }} />
        <View style={{ flexDirection: 'row' }}>
          {this.renderTabs}
        </View>
      </View>
    )
  }
}

// NavigationBottom.propTypes = {
//   stack: PropTypes.string,
//   tabs: PropTypes.array,
//   navigation: PropTypes.any,
//   navigationRefReady: PropTypes.any,
// }

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    flexDirection: 'row',
    top: 0,
  },
  markerMiddle: {
    height: 40,
    width: 40,
    backgroundColor: '#4169e1',
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
  },
  markerRight: {
    position: 'absolute',
    height: 28,
    width: 80,
    backgroundColor: '#4169e1',
    left: 39,
  },
  markerRightRound: {
    position: 'absolute',
    height: 41,
    width: 80,
    backgroundColor: '#000e26',
    borderTopLeftRadius: 50,
    top: 8,
  },
  markerLeft: {
    position: 'absolute',
    height: 28,
    width: 80,
    backgroundColor: '#4169e1',
    right: 39,
  },
  markerLeftRound: {
    position: 'absolute',
    height: 41,
    width: 80,
    backgroundColor: '#000e26',
    borderTopRightRadius: 50,
    top: 8,
  }
})

export default NavigationBottom;
