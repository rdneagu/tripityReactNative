/* React packages */
import React from 'react';
import { 
  ActivityIndicator, 
  StyleSheet, FlatList, Text, View, 
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

/* Expo packages */
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from "expo-media-library";

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import * as sim from '../../lib/sim';
import logger from '../../lib/log';
import TptyTrip from '../../lib/trip';

/* App components */
import { Image, StyledButton, StyledText, IndeterminateLoading } from '../../components';

@inject('store')
@observer
class ScreenMainTrips extends React.Component {

  renderItem({ item }) {
    return  <View style={styles.trip}>
              <StyledText>Trip Id: {item.tripId}</StyledText>
            </View>
  }

  render() {
    return (
      <SafeAreaView style={styles.content}>
        <StyledText>Trips</StyledText>
        <FlatList data={this.props.store.UserStore.user.trips} renderItem={this.renderItem} keyExtractor={item => item.tripId} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trip: {
    padding: 5,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default ScreenMainTrips;