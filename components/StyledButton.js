/* React packages */
import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Animated, Easing } from 'react-native';
import PropTypes from 'prop-types';

/* Expo packages */
import { LinearGradient } from 'expo-linear-gradient';

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer } from "mobx-react"

@observer
class StyledButton extends Component {
  @observable layout = { width: null, height: null }
  @observable pending = false;

  constructor(props) {
    super(props);
    this.animation = {
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      loading: new Animated.Value(0),
    };

    this.interpolated = {
      loading: this.animation.loading.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
      }),
    };
  }

  /**
   * Triggered when the button is pressed
   */
  @action.bound
  onPress() {
    if (typeof (this.props.onPress) !== 'function' || this.pending) return;

    this.pending = !!this.props.throttle;
    this.touchFxIn();
  }

  /**
   * Triggered when the layout is changed
   *
   * @param {Object} e  - Event properties
   */
  @action.bound
  onLayout(e) {
    this.layout.width = e.nativeEvent.layout.width;
    this.layout.height = e.nativeEvent.layout.height;
  }

  /**
   * Triggers the touch effect animation
   */
  @action.bound
  touchFxIn() {
    // Set the starting value of the properties
    this.animation.scale.setValue(0);
    this.animation.opacity.setValue(0);
    // Animation sequence
    Animated.parallel([
      Animated.timing(this.animation.scale, {
        toValue: (Math.round(this.layout.width / 10)),
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(this.animation.opacity, {
        toValue: .2,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start(this.touchFxOut);
  }

  @action.bound
  async touchFxOut() {
    Animated.timing(this.animation.opacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    await this.props.onPress();
    setTimeout(() => this.pending = false, this.props.throttle * 1000);
  }

  /**
   * Returns the button content as a React JSX component
   */
  @computed
  get buttonContent() {
    const text = (this.props.children) ? <Text style={styles.buttonText}>{this.props.children}</Text> : null;
    const icon = (this.props.icon) ? React.cloneElement(this.props.icon, { style: { ...styles.buttonIcon, ...this.props.icon.props.style } }) : null;

    const content = (this.pending)
      ? <ActivityIndicator size="small" color="#c6dafb" />
      : <>
          {this.props.inversed ? icon : text}
          {text && icon && <View style={{ marginHorizontal: 4 }} />}
          {this.props.inversed ? text : icon}
        </>

    const touchEffect = { ...styles.touchEffect, opacity: this.animation.opacity, transform: [{ scale: this.animation.scale }] };    
    return  <>
              {content}
              <View style={styles.touchEffectWrapper}>
                <Animated.View style={touchEffect} />
              </View>
            </>
  }

  /**
   * Returns the button as a React JSX component
   */
  @computed
  get button() {
    const { colors, type, fill } = this.props;
    const style = { ...styles.button, ...styles[type], ...this.props.style };

    switch (type) {
      case 'bordered':
        const fillStyle = (fill) ? { backgroundColor: colors[0] } : null;
        return  <View onLayout={this.onLayout} style={{ ...style, ...styles.borderedButton, ...fillStyle }}>{this.buttonContent}</View>
      default:
        return  <LinearGradient onLayout={this.onLayout} style={{ ...style }} colors={colors}>{this.buttonContent}</LinearGradient>
    }
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>{this.button}</View>
      </TouchableWithoutFeedback>
    );
  }
}

StyledButton.defaultProps = {
  colors: [ '#5390f6', '#4185f5' ],
  type: 'default',
  throttle: 0,
}

StyledButton.propTypes = {
  colors: PropTypes.array,
  type: PropTypes.string,
  icon: PropTypes.element,
  inversed: PropTypes.bool,
  style: PropTypes.any,
  children: PropTypes.any,
  throttle: PropTypes.number,
  onPress: PropTypes.any,
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderColor: '#7fadf7',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#c6dafb',
    fontFamily: 'Nunito-SemiBold',
  },
  buttonIcon: {
    color: '#c6dafb',
  },
  borderedButton: {
    borderRadius: 4,
  },
  touchEffectWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchEffect: {
    backgroundColor: '#c6dafb',
    width: 10,
    height: 10,
    borderRadius: 20,
  },
})

export default StyledButton;
