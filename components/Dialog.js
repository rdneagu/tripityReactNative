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
    return (
      <Modal isVisible={!!dialog} style={{ margin: 0 }} animationIn="fadeIn" animationOut="fadeOut">
        <View style={styles.dialogWrapper}>
          <View style={styles.dialog}>
            <View style={styles.titleBar}>
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
      </Modal>
    )
  }
}

const styles = StyleSheet.create({
  dialogWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  dialog: {
    marginHorizontal: 10,
    backgroundColor: '#000e26',
    borderWidth: 1,
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
