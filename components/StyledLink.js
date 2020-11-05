/* React packages */
import React, { Component } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Animated, Easing } from 'react-native';

/* Community packages */
import { observer } from "mobx-react"
import { action } from "mobx"

@observer
class StyledLink extends Component {
  constructor(props) {
    super(props);

    this.animation = {
      textShadowRadius: new Animated.Value(1),
      color: new Animated.Value(0),
    };

    this.interpolated = {
      color: this.animation.color.interpolate({
        inputRange: [0, 1],
        outputRange: ['#b2d8ff', '#99ddff']
      }),
    };
  }

  /**
   * Triggers the click function passed from parent
   */
  @action.bound
  onPress() {
    if (typeof (this.props.onPress) !== 'function') return;
    this.touchFx();

    this.props.onPress();
  }

  /**
   * Triggers the touch effect animation
   */
  @action.bound
  touchFx() {
    // Set the starting value of the properties
    this.animation.textShadowRadius.setValue(1);
    this.animation.color.setValue(0);
    // Animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(this.animation.textShadowRadius, {
          toValue: 2,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(this.animation.color, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ]),
      Animated.parallel([
        Animated.timing(this.animation.textShadowRadius, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(this.animation.color, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        })
      ])
    ]).start();
  }

  render() {
    const touchEffect = { ...styles.link, ...this.props.style, color: this.interpolated.color, textShadowRadius: this.animation.textShadowRadius };

    return (
      <TouchableWithoutFeedback onPressIn={this.onPress}>
        <Animated.Text style={touchEffect}>{this.props.children}</Animated.Text>
      </TouchableWithoutFeedback>
    );
  }
}

// StyledLink.propTypes = {
//   style: PropTypes.any,
//   children: PropTypes.any,
//   onPress: PropTypes.any,
// }

const styles = StyleSheet.create({
  link: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    textShadowColor: '#00aaff',
    textShadowRadius: 1,
  },
})

export default StyledLink;
