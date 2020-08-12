// TODO: Pass existing date
/* React packages */
import React, { Component } from 'react';
import { StyleSheet, TouchableWithoutFeedback, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons';

/* Community packages */
import { observable, action, computed } from "mobx"
import { observer } from "mobx-react"

/* App components */
import StyledButton from '../StyledButton';

@observer
class _DateTimePicker extends Component {
  @observable visible = false;
  @observable selected = null;

  constructor(props) {
    super(props);
  }

  @computed
  get formattedDate() {
    return (this.selected) ? new Date(this.selected) : new Date();
  }

  @action.bound
  show() {
    this.visible = true;
  }

  @action.bound
  select() {
    const date = this.selected || Date.now();
    const [ year, month, day ] = new Date(date).toISOString().replace(/T/, '-').split('-');
    this.props.model(`${day}/${month}/${year}`);

    this.hide();
  }

  @action.bound
  hide() {
    this.visible = false;
  }

  render() {
    return (
      <>
        <TextInput style={this.props.style} value={this.props.value} editable={false} placeholder={this.props.placeholder} placeholderTextColor={this.props.placeholderTextColor} />
        <TouchableWithoutFeedback onPress={this.show}>
          <View style={styles.datePickerTouch}>
            <Modal isVisible={this.visible} style={{ margin: 0 }}>
              <View style={styles.datePickerInner}>
                <View style={styles.control}>
                  <StyledButton type="bordered" icon={<Ionicons name="md-close" />} onPress={this.hide}>Cancel</StyledButton>
                  <StyledButton type="bordered" fill icon={<Ionicons name="md-checkmark" />} onPress={this.select}>Select</StyledButton>
                </View>
                <DateTimePicker value={this.formattedDate} maximumDate={new Date(Date.now() + 1)} onChange={date => this.selected = date.nativeEvent.timestamp } />
              </View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </>
    );
  }
}

const styles = StyleSheet.create({
  datePickerTouch: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  datePickerInner: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: .4,
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  }
})

export default _DateTimePicker;
