/* React packages */
import React, { Component } from 'react';
import { StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

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
    const font = this.getFontWeight();
    const size = this.props.size;
    return (
      <Text style={{ ...styles.text, fontFamily: font, fontSize: size, ...this.props.style }}>{this.props.children}</Text>
    );
  }
}

StyledText.propTypes = {
  style: PropTypes.any,
  weight: PropTypes.string,
  size: PropTypes.number,
}

StyledText.defaultProps = {
  size: 14,
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Nunito-Regular',
    color: '#eee',
  },
})

export default StyledText;
