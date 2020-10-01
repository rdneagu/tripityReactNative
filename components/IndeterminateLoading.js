/* React packages */
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Animated, Easing } from 'react-native';

/* App components */
import StyledText from './StyledText';

class IndeterminateLoading extends Component {
  constructor() {
    super();

    this.animation = {
      increase: {
        left: new Animated.Value(0),
        width: new Animated.Value(0),
      },
      decrease: {
        left: new Animated.Value(0),
        width: new Animated.Value(0),
      }
    };

    this.interpolated = {
      increase: {
        left: this.animation.increase.left.interpolate({
          inputRange: [0, 1],
          outputRange: ['-5%', '130%'],
        }),
        width: this.animation.increase.width.interpolate({
          inputRange: [0, 1],
          outputRange: ['5%', '100%'],
        })
      },
      decrease: {
        left: this.animation.decrease.left.interpolate({
          inputRange: [0, 1],
          outputRange: ['-100%', '110%'],
        }),
        width: this.animation.decrease.width.interpolate({
          inputRange: [0, 1],
          outputRange: ['100%', '10%'],
        })
      }
    }
  }

  componentDidMount() {
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.parallel([
            Animated.timing(this.animation.increase.left, { 
              toValue: 1,
              duration: 1200,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(this.animation.increase.width, { 
              toValue: 1,
              duration: 1200,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.delay(800),
            Animated.parallel([
              Animated.timing(this.animation.decrease.left, { 
                toValue: 1,
                duration: 600,
                easing: Easing.ease,
                useNativeDriver: false,
              }),
              Animated.timing(this.animation.decrease.width, { 
                toValue: 1,
                duration: 600,
                easing: Easing.ease,
                useNativeDriver: false,
              }),
            ]),
          ]),
        ]),
      ])
    ).start();
  }

  render() {
    return (
      <View style={styles.loadingWrapper}>
        <View style={styles.loadingBarWrapper}>
          <Animated.View style={{ ...styles.loadingBar, width: this.interpolated.increase.width, left: this.interpolated.increase.left }}></Animated.View>
          <Animated.View style={{ ...styles.loadingBar, width: this.interpolated.decrease.width, left: this.interpolated.decrease.left }}></Animated.View>
        </View>
        {this.props.children && <StyledText style={styles.loadingMsg}>{this.props.children}</StyledText>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  loadingWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBarWrapper: {
    width: '80%',
    height: 5,
    backgroundColor: 'rgba(74, 141, 248, 0.4)',
    overflow: 'hidden',
  },
  loadingBar: {
    position: 'absolute',
    height: 5,
    backgroundColor: 'rgb(74, 141, 248)',
  },
  loadingMsg: {
    textAlign: 'center',
  },
});

export default IndeterminateLoading;
