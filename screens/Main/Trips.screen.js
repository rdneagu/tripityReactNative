/* React packages */
import React from 'react';
import { 
  StyleSheet, FlatList, View, 
  SafeAreaView,
} from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App components */
import { StyledText, NavigationHeader } from '../../components';

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
        <NavigationHeader icon={<Entypo name="map" size={18} color="white" />}>YOUR TRIPS</NavigationHeader>
        <FlatList data={this.props.store.User.user.trips} renderItem={this.renderItem} keyExtractor={item => item.tripId} />
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