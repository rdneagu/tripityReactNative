/* React packages */
import React, { Component } from 'react';
import {
  StyleSheet, View,
} from 'react-native';
import PropTypes from 'prop-types';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons';

/* App components */
import StyledText from '../StyledText';
import StyledButton from '../StyledButton';

class NavigationHeader extends Component {
  render() {
    const { icon, back } = this.props;
    console.log(back);
    return (
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          {/* {back && <StyledButton style={styles.back} type="bordered" icon={<Ionicons name="ios-arrow-back" size={24} />} onPress={back()} />} */}
          {icon}
          <StyledText style={styles.text} weight='semibold'>{this.props.children}</StyledText>
        </View>
      </View>
    )
  }
}

NavigationHeader.propTypes = {
  text: PropTypes.string,
  icon: PropTypes.any,
  back: PropTypes.any,
}

const styles = StyleSheet.create({
  header: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 14, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#4169e1',
    borderBottomWidth: 4,
    height: 60,
  },
  headerTitle: {
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
