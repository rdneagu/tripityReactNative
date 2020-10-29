/* React packages */
import React from 'react';
import { StyleSheet, View } from 'react-native';

/* Expo packages */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import * as sim from '../../lib/sim';
import logger from '../../lib/log';
import TptyTrip from '../../lib/trip';

/* App components */
import { StyledButton, StyledText, IndeterminateLoading } from '../../components';

@inject('store')
@observer
class ScreenMainSimulator extends React.Component {
  @observable scenario = {
    currentStatus: null,
  }

  /**
   * 
   */
  async loadScenario() {
    const scenario = await DocumentPicker.getDocumentAsync();
    if (scenario.type === 'success') {
      this.scenario.currentStatus = 'Loading scenario';
      this.scenario.content = await FileSystem.readAsStringAsync(scenario.uri);

      console.log(this.scenario.content);
    }
  }

  render() {
    return (
      <View style={styles.content}>
        {store.User.isAdmin()
          ? <View style={{ alignItems: 'center' }}>
              {this.scenario.currentStatus
                ? <View>
                    <StyledText>Status</StyledText>
                    <IndeterminateLoading>{this.scenario.currentStatus}</IndeterminateLoading>
                  </View>
                : <StyledButton onPress={this.loadScenario}>Load scenario</StyledButton>
              }
            </View>
          : <StyledText>You cannot access this feature if you're not an Administrator</StyledText>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});

export default ScreenMainSimulator;