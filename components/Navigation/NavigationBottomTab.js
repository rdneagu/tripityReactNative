/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, TouchableWithoutFeedback,
  Animated, Easing,
} from 'react-native';

const ANIMATION_TRANSLATE_Y = 12;

class NavigationBottomTab extends Component {
  constructor(props) {
    super();

    this.animation = {
      translateY: new Animated.Value((props.isFocused) ? -ANIMATION_TRANSLATE_Y : 0),
    };
  }

  componentDidMount() {
    this.animateIcon();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused !== this.props.isFocused) {
      this.animateIcon(); 
    }
  }

  animateIcon = () => {
    const y = this.props.isFocused ? -ANIMATION_TRANSLATE_Y : 0;
    Animated.timing(this.animation.translateY, { 
      toValue: y,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }

  render() {
    const { onPress, onLayout, icon } = this.props;

    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <Animated.View onLayout={onLayout} style={{ ...styles.tab, transform: [{ translateY: this.animation.translateY }] }}>
          {icon}
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }
}

// NavigationBottomTab.propTypes = {
//   isFocused: PropTypes.any,
//   onLayout: PropTypes.any,
//   onPress: PropTypes.any,
//   icon: PropTypes.any,
// }

const styles = StyleSheet.create({
  tab: {
    flexGrow: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
})

export default NavigationBottomTab;
