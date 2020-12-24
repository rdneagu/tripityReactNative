/* React packages */
import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Animated, Easing } from 'react-native';
import Modal from 'react-native-modal';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons'; 

/* MobX store */
import store from '../store/_index';

/* Community packages */
import { observer } from "mobx-react"

/* App components */
import StyledText from './StyledText';
import StyledButton from './StyledButton';

/* App lib */
import { mergeExistingProps } from '../lib/util';

/**
 * Class definition for the Dialog component
 */
@observer
class Dialog extends Component {
  constructor() {
    super();
  }

  render() {
    const dialog = store.Dialog.activeDialog;

    if (!dialog) {
      return null;
    }

    let dialogStyle = { ...styles.dialog };
    let titleBarStyle = { ...styles.titleBar };
    if (dialog.alert) {
      dialogStyle = { ...dialogStyle, borderColor: '#ff6347' };
      titleBarStyle = { ...titleBarStyle, borderBottomColor: '#ff6347', backgroundColor: '#bf4a35' };
    }
    return (
      <View style={styles.dialogWrapper}>
        <View style={dialogStyle}>
          <View style={titleBarStyle}>
            <StyledText weight="bold">{dialog.title}</StyledText>
            {dialog.dismissable &&
              <TouchableOpacity style={styles.close} onPress={store.Dialog.hideDialog}>
                <Ionicons name="md-close" size={18} color="white" />
              </TouchableOpacity>
            }
          </View>
          <View style={styles.component}>
            {dialog.component}
          </View>
          <View style={styles.control}>
            {dialog.buttons.map((button, i) => <StyledButton key={i} style={styles.button} type="bordered" inversed {...button} />)}
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  dialogWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, .6)',
  },
  dialog: {
    marginHorizontal: 10,
    backgroundColor: '#000e26',
    borderColor: '#4169e1',
    borderRadius: 4,
  },
  titleBar: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#4169e1',
    backgroundColor: '#557df5',
  },
  close: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    right: 0,
    zIndex: 1,
    elevation: 1,
  },
  component: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    marginHorizontal: 4,
  }
});

export default Dialog;
