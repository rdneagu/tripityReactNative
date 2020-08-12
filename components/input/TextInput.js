/* React packages */
import React, { Component } from 'react';
import { StyleSheet, TextInput, TouchableWithoutFeedback } from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons'; 

/* Community packages */
import { observable, action } from "mobx"
import { observer } from "mobx-react"

@observer
class _TextInput extends Component {
  @observable hidden;

  constructor(props) {
    super(props);
    this.hidden = this.props.secured;
  }

  @action.bound
  toggleHidden() {
    this.hidden = !this.hidden;
  }

  @action.bound
  onChangeText(text) {
    this.props.model(text);
  }

  render() {
    return (
      <>
        <TextInput style={this.props.style} value={this.props.value} secureTextEntry={this.hidden} onChangeText={this.onChangeText} placeholder={this.props.placeholder} placeholderTextColor={this.props.placeholderTextColor} />
        {this.props.secured && <TouchableWithoutFeedback onPress={this.toggleHidden}>
          <Entypo name={!this.hidden ? 'eye' : 'eye-with-line'} style={styles.secureIcon} />
        </TouchableWithoutFeedback>}
      </>
    );
  }
}

const styles = StyleSheet.create({
  secureIcon: {
    marginLeft: 10,
    color: '#eee',
    fontSize: 18,
  },
})

export default _TextInput;
