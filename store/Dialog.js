/* React packages */
import React from 'react';

/* Expo packages */
import { Ionicons } from '@expo/vector-icons'; 

/* Community packages */
import { observable, action, computed } from 'mobx';

/* App library */
import logger from '../lib/log';

/**
 * Class definition for the Dialog store
 * 
 * @var {Array<Object>} dialogs       - The list of dialogs in FILO order
 */
class Dialog {
  @observable dialogs = [];

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.dialogs = [];
  }

  /**
   * The default functionality of a button press function
   * 
   * @param {function} fn       - Function to run before hiding the dialog
   * 
   * Function is @bound
   */
  @action.bound
  async onPress(fn) {
    // Run the specified function if there is one
    if (typeof(fn) === 'function') {
      await fn();
    }
    // Hide the dialog after finishing the function above
    this.hideDialog();
  }

  /**
   * Prepares the dialog object and pushes it to the list of dialogs to be shown
   * 
   * @param {String} title            - The title of the dialog
   * @param {React} component         - The body of the dialog
   * @param {Boolean?} dismissable    - Whether the dialog can be dismissed, defaults to true
   * @param {Object?} onCancel        - Whether the default cancel button should be shown, defaults to true
   *      @param {String?} text               - Button text, defaults to 'Cancel'
   *      @param {Function?} fn               - Function to run when the button is pressed
   * @param {Object?} onConfirm       - Whether the default confirm button should be shown, defaults to true
   *      @param {String?} text               - Button text, defaults to 'Confirm'
   *      @param {Function?} fn               - Function to run when the button is pressed
   * @param {Array<Object>?} buttons  - Custom buttons to be shown, accepts the same props as StyledButton
   * 
   * Function is @bound
   */
  @action.bound
  showDialog({ title, component, dismissable=true, onCancel=true, onConfirm=true, buttons=[] }) {
    if (dismissable && onCancel) {
      const text = onCancel?.text || 'Cancel';
      const fn = () => this.onPress(onCancel?.fn || true);

      buttons.unshift({
        icon: <Ionicons name="md-close" />,
        text,
        onPress: fn,
      })
    }

    if (onConfirm) {
      const text = onConfirm?.text || 'Confirm';
      const fn = () => this.onPress(onConfirm?.fn || true);

      buttons.push({
        text: text,
        icon: <Ionicons name="md-checkmark" />,
        fill: true,
        onPress: fn,
      })
    }

    this.dialogs.push({
      title,
      component,
      dismissable: dismissable,
      buttons,
    });
    logger.info(`Dialog ${title} is now on screen`);
  }

  /**
   * Hides the active dialog (last dialog in the list)
   * 
   * Function is @bound
   */
  @action.bound
  hideDialog() {
    this.dialogs.pop();
  }

  /**
   * Gets the active dialog (last dialog shown) or null if no dialogs are in the list
   */
  @computed
  get activeDialog() {
    if (!this.dialogs.length) {
      return null;
    }
    return this.dialogs[this.dialogs.length - 1];
  }
}

export default Dialog;
