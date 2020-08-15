/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, TouchableWithoutFeedback,
  Animated, Easing,
} from 'react-native';
import PropTypes from 'prop-types';

const ANIMATION_TRANSLATE_Y = 12;

class NavigationBottomTab extends Component {

  constructor(props) {
    super(props);

    this.animation = {
      translateY: new Animated.Value((props.selected) ? -ANIMATION_TRANSLATE_Y : 0),
    };
  }

  componentDidMount() {
    this.animateIcon();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selected !== this.props.selected) {
      this.animateIcon(); 
    }
  }

  animateIcon = () => {
    const y = this.props.selected ? -ANIMATION_TRANSLATE_Y : 0;
    Animated.timing(this.animation.translateY, { 
      toValue: y,
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
  onLayout = (e) => {
    this.props.onLayout(this.props.tabIndex, e.nativeEvent.layout);
  }

  onPress = (e) => {
    this.props.onPress(this.props.tabIndex);
  }

  render() {
    const { icon } = this.props;

    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <Animated.View onLayout={this.onLayout} style={{ ...styles.tab, transform: [{ translateY: this.animation.translateY }] }}>
          {icon}
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }
}

NavigationBottomTab.propTypes = {
  tabIndex: PropTypes.number,
  selected: PropTypes.any,
  onLayout: PropTypes.any,
  onPress: PropTypes.any,
}

const styles = StyleSheet.create({
  tab: {
    flexGrow: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
})

export default NavigationBottomTab;
