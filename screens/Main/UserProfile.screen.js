/* React packages */
import React from 'react';
import { 
  StyleSheet, View
} from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';

/* App components */
import { StyledText, StyledButton } from '../../components';

/**
 * Class definition for the Main.Tab.UserProfile screen
 * 
 * @injects store
 * Is an @observer class
 */
@inject('store')
@observer
class ScreenMainUserProfile extends React.Component {
  @observable locations;

  constructor() {
    super();
  }

  deleteUser = () => {
    if (this.props.store.UserStore.user) {
      this.props.store.UserStore.deleteUser();
    }
  }

  changeHomeLocation = () => {
    if (this.props.store.UserStore.user) {
      this.props.store.UserStore.changeStep(2);
    }
  }

  render() {
    return (
      <View style={styles.content}>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <StyledText>Delete your user. This action cannot be undone!</StyledText>
          <StyledButton style={{ marginTop: 5 }} colors={[ '#CC3014', '#B31700' ]} onPress={this.deleteUser}>Delete your user</StyledButton>
        </View>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <StyledText>Change your home location</StyledText>
          <StyledButton style={{ marginTop: 5 }} onPress={this.changeHomeLocation}>Change home location</StyledButton>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});

export default ScreenMainUserProfile;