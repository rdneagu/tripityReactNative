/* React packages */
import React, { Component } from 'react';
import { StyleSheet, Text } from 'react-native';

/**
 * Class definition for the StyledText component
 * 
 * @prop {Object?} style         - Extra styling
 * @prop {String?} color         - Text color in hex format, defaults to #eee
 * @prop {String?} weight        - Text weight (light, regular=default, semibold, bold)
 * @prop {Number?} size          - Text size, defaults to 14
 */
class StyledText extends Component {
  constructor(props) {
    super(props);
  }

  getFontWeight = () => {
    switch (this.props.weight) {
      case 'light': return 'Nunito-Light';
      case 'semibold': return 'Nunito-SemiBold';
      case 'bold': return 'Nunito-Bold';
      default: return 'Nunito-Regular';
    }
  }

  render() {
    const fontFamily = this.getFontWeight();
    const { style, size, color, children } = this.props;
    return (
      <Text style={{ ...styles.text, fontFamily, fontSize: size, color, ...style }}>{children}</Text>
    );
  }
}

StyledText.defaultProps = {
  color: '#eee',
  size: 14,
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Nunito-Regular',
  },
})

export default StyledText;
