/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, View,
  Animated, Easing,
} from 'react-native';
import PropTypes from 'prop-types';

/* Community packages */
import _ from 'lodash';
import { observable, action, reaction } from "mobx"
import { observer, inject } from "mobx-react"

/* App components */
import NavigationBottomTab from './NavigationBottomTab';

@inject('store')
@observer
class NavigationBottom extends Component {
  @observable tabs = [];
  @observable current = -1;

  constructor(props) {
    super(props);

    console.log(this.props.navigation.dangerouslyGetState());

    this.animation = {
      left: new Animated.Value(-82),
    };
  }

  // componentDidMount() {
  //   const { Navigation } = this.props.store;

  //   this.tabs = this.props.tabs;
  //   this._reaction = reaction(() => Navigation.currentScreen, this.animateThumb);
  // }

  // // componentWillUnmount() {
  // //   this._reaction.dispose();
  // // }

  // @action
  // computeThumbPosition(tabIndex) {
  //   console.log(tabIndex);
  //   console.log(this.tabs[tabIndex].width);
  //   return (tabIndex !== -1) ? (this.tabs[tabIndex].x + (this.tabs[tabIndex].width / 2)) - 20 : -82;
  // }

  // @action.bound
  // animateThumb(screen) {
  //   const tabIndex = _.findIndex(this.tabs, (tab) => tab.name === screen);
  //   const position = this.computeThumbPosition(tabIndex);
  //   Animated.timing(this.animation.left, { 
  //     toValue: position,
  //     duration: 200,
  //     easing: Easing.ease,
  //     useNativeDriver: false,
  //   }).start();

  //   if (tabIndex !== -1) {
  //     this.tabs[tabIndex].selected = true;
  //     if (this.current !== -1) {
  //       this.tabs[this.current].selected = false;
  //     }
  //   }
  //   this.current = tabIndex;
  // }

  // @action.bound
  // isTabSelected(tab) {
  //   const { Navigation } = this.props.store;
  //   console.log(tab.name);
  //   return (tab.name === Navigation.currentScreen);
  // }

  /**
   * Triggered when the layout is changed
   *
   * @param {Object} e  - Event properties
   */
  @action.bound
  onLayout(index, layout) {
    console.log('layout');
    // this.tabs[tabIndex].x = layout.x;
    // this.tabs[tabIndex].width = layout.width;

    // if (this.isTabSelected(this.tabs[tabIndex])) {
    //   const position = this.computeThumbPosition(tabIndex);
    //   this.animation.left.setValue(position);
    //   this.current = tabIndex;
    //   this.tabs[tabIndex].selected = true;
    // }
  }

  @action.bound
  isTabSelected(index) {
    const { state } = this.props;
    return (state.index === index);
  }

  @action.bound
  onPress(index, route) {
    const { state, navigation, descriptors } = this.props;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    const params = state.routes[state.index].params;
    if (!this.isTabSelected(index) && !event.defaultPrevented) {
      navigation.navigate(descriptors[route.key].options.parent, { screen: route.name, params });
    }
  }

  @action.bound
  renderTabs() {
    const { state, descriptors } = this.props;
    return state.routes.map((route, index) => {
      const { options } = descriptors[route.key];

      const onPress = () => this.onPress(index, route);
      const onLayout = (e) => this.onLayout(index, e.nativeEvent.layout);
      return <NavigationBottomTab key={index} icon={options.tabBarIcon} isFocused={this.isTabSelected(index)} onPress={onPress} onLayout={onLayout} />
    })
  }

  render() {
    return (
      <View style={{ width: '100%', paddingVertical: 8, backgroundColor: '#000e26', overflow: 'hidden' }}>
        {/* <Animated.View style={{ ...styles.marker, left: this.animation.left }}>
          <View style={styles.markerLeft}>
            <View style={styles.markerLeftRound} />
          </View>
          <View style={styles.markerMiddle} />
          <View style={styles.markerRight}>
            <View style={styles.markerRightRound} />
          </View>
        </Animated.View> */}
        <View style={{ position: 'absolute', height: 8, width: '100%', backgroundColor: '#4169e1' }} />
        <View style={{ flexDirection: 'row' }}>
          {this.renderTabs()}
        </View>
      </View>
    )

    // const { Navigation } = this.props.store;

    // if (!Navigation.navigationRefReady) {
    //   return null;
    // } else {
    //   return (
    //     <View style={{ width: '100%', paddingVertical: 8, backgroundColor: '#000e26', overflow: 'hidden' }}>
    //       <Animated.View style={{ ...styles.marker, left: this.animation.left }}>
    //         <View style={styles.markerLeft}>
    //           <View style={styles.markerLeftRound} />
    //         </View>
    //         <View style={styles.markerMiddle} />
    //         <View style={styles.markerRight}>
    //           <View style={styles.markerRightRound} />
    //         </View>
    //       </Animated.View>
    //       <View style={{ position: 'absolute', height: 8, width: '100%', backgroundColor: '#4169e1' }} />
    //       <View style={{ flexDirection: 'row' }}>
    //         {this.tabs.map((tab, i) => <NavigationBottomTab key={i} tabIndex={i} onPress={this.onPress} onLayout={this.onLayout} {...tab} />)}
    //       </View>
    //     </View>
    //   )
    // }
  }
}

NavigationBottom.propTypes = {
  stack: PropTypes.string,
  tabs: PropTypes.array,
  navigation: PropTypes.any,
  navigationRefReady: PropTypes.any,
}

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
