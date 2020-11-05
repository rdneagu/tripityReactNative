/* React packages */
import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Animated, Easing } from 'react-native';
import TextTicker from 'react-native-text-ticker';

/* Expo packages */
import { Entypo } from '@expo/vector-icons'; 

/* Community packages */
import { observable, computed } from "mobx"
import { observer } from "mobx-react"

/* App components */
import TextInput from './Input/TextInput';
import DateTimePicker from './Input/DateTimePicker';
import Select from './Input/Select';

export const INPUT_TYPE = {
  DATEPICKER: 1,
  SELECT: 2,
};

@observer
class Input extends Component {
  @observable offset = { left: null, top: null, width: null, height: null };

  constructor(props) {
    super(props);
    this.animation = {
      opacity: new Animated.Value(0),
    };
  }

  componentDidUpdate(prev) {
    if (prev.error !== this.props.error && this.props.error) {
      this.animation.opacity.setValue(0);
      Animated.timing(this.animation.opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }

  @computed get getInputByType() {
    const placeholder = this.props.placeholder || "Placeholder";

    const placeholderStyle = (!this.props.value ? styles.inputPlaceholder : null);
    const errorStyle = (this.props.error ? styles.inputFailed : null);
    const inputStyle = { ...styles.input, ...placeholderStyle, ...errorStyle }

    const commonProps = { style: inputStyle, value: this.props.value, model: this.props.model, placeholder: placeholder, placeholderTextColor: "#fff" };

    switch (this.props.type) {
      case INPUT_TYPE.DATEPICKER:
        return  <DateTimePicker {...commonProps} {...this.props.datePicker} />
      case INPUT_TYPE.SELECT:
        return  <Select {...commonProps} {...this.props.select} />
      default:
        return  <TextInput {...commonProps} secured={this.props.secured} onChangeText={this.props.model} />
    }
  }

  render() {
    const icon = (this.props.icon) ? React.cloneElement(this.props.icon, { style: { ...styles.labelIcon, ...this.props.icon.props.style } }) : null;
    const label = (this.props.label) ? <Text style={styles.label}>{this.props.label}</Text> : null;

    return (
      <View style={{ ...styles.inputOuter, ...this.props.outerStyle }}>
        <View style={{ ...styles.inputInner, ...this.props.innerStyle }}>
          {icon}
          {label}
          {this.getInputByType}
        </View>
        {this.props.error && <Animated.View style={{ ...styles.errorBox, opacity: this.animation.opacity }}>
          <Entypo style={{ ...styles.errorText, marginRight: 5 }} name='warning' />
          <TextTicker style={styles.errorText} duration={4000} animationType="bounce" scroll={false} easing={Easing.bezier(0.65, 0, 0.35, 1)} repeatSpacer={50} marqueeDelay={2000}>{this.props.error}</TextTicker>
        </Animated.View>}
      </View>
    );
  }
}

// Input.propTypes = {
//   outerStyle: PropTypes.object,
//   innerStyle: PropTypes.object,
//   label: PropTypes.string,
//   icon: PropTypes.element,
//   inversed: PropTypes.bool,
//   align: PropTypes.string,
//   verticalSpacing: PropTypes.string,
//   type: PropTypes.number,
//   placeholder: PropTypes.string,
//   secured: PropTypes.bool,
//   model: PropTypes.any,
//   value: PropTypes.string,
//   error: PropTypes.string,
//   datePicker: PropTypes.any,
//   select: PropTypes.any,
// }

const styles = StyleSheet.create({
  inputOuter: {
    width: '80%',
    marginVertical: 10,
  },
  inputInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    marginRight: 10,
    color: '#eee',
    fontFamily: 'Nunito-Black',
    fontSize: 10,
  },
  labelIcon: {
    marginRight: 10,
    color: '#eee',
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: 'Nunito-SemiBold',
    color: '#eee',
    textShadowColor: '#00aaff',
    textShadowRadius: 1,
    textAlign: 'right',
  },
  inputPlaceholder: {
    fontFamily: 'Nunito-Bold',
    opacity: .4,
  },
  errorBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6347',
    paddingHorizontal: 4,
    paddingRight: 8,
    overflow: 'hidden',
  },
  errorText: {
    color: '#fedfda',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
})

export default Input;
