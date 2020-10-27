/* React packages */
import React from 'react';
import { 
  StyleSheet, FlatList, View, 
  TouchableOpacity,
} from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import Realm from '../../lib/realm';
import TptyTrip from '../../lib/trip';
import logger from '../../lib/log';

/* App components */
import { StyledText, StyledButton } from '../../components';

class TripItem extends React.PureComponent {
  

  render() {
    const { onPress, startLocation, endLocation, startDate, endDate, visitedCountries, visitedLocations } = this.props;
    return  <TouchableOpacity onPress={onPress}>
              <View style={styles.trip}>
                <StyledText style={styles.tripTitle} weight='semibold'>{startLocation} to {endLocation}</StyledText>
                <View style={styles.separator} />
                <StyledText>Trip start: {startDate}</StyledText>
                <StyledText>Trip end: {endDate}</StyledText>
                <View style={styles.separator} />
                <StyledText>Countries visited: {visitedCountries}</StyledText>
                <StyledText>Locations visited: {Object.keys(visitedLocations).length}</StyledText>
              </View>
            </TouchableOpacity>
  }  
}

@inject('store')
@observer
class ScreenMainTrips extends React.PureComponent {

  constructor() {
    super();
  }

  openTrip = (tripId) => {
    this.props.navigation.push('Screen.Trip', { screen: 'Trip.Tab.Details', params: { tripId }});
  }

  // TODO: TPA-52
  renderItem = ({ item }) => {
    const destination = {
      counter: 0,
    }
    const visitedCountries = [];
    const tripStartLocation = item.pings[0].country;
    const tripEndLocation = item.pings.reduce((acc, ping) => {
      if (ping.country) {
        if (destination.name !== ping.country) {
          destination.name = ping.country;
          destination.counter = 0;
        }
        destination.counter++;
        if (destination.counter > 4 && acc !== destination.name) {
          visitedCountries.push(destination.name);
          acc = destination.name;
        }
      }
      return acc;
    }, undefined);

    const visitedLocations = item.pings.reduce((acc, ping) => {
      if (ping.venue) {
        acc[ping.venue.name] = (acc[ping.venue.name] || 0) + 1;
      }
      return acc;
    }, {})

    const tripStartDate = new Date(item.pings[0].timestamp);
    const [ startYear, startMonth, startDay ] = [ tripStartDate.getFullYear(), tripStartDate.getMonth() + 1, tripStartDate.getDate() ];
    const [ startHours, startMinutes ] = [ tripStartDate.getHours().toString(), tripStartDate.getMinutes().toString() ];

    const tripEndDate = new Date(item.pings[item.pings.length-1].timestamp);
    const [ endYear, endMonth, endDay ] = [ tripEndDate.getFullYear(), tripEndDate.getMonth() + 1, tripEndDate.getDate() ];
    const [ endHours, endMinutes ] = [ tripEndDate.getHours().toString(), tripEndDate.getMinutes().toString() ];
  
    return  <TripItem 
                onPress={() => this.openTrip(item.tripId)}
                startLocation={tripStartLocation}
                endLocation={tripEndLocation}
                startDate={`${startDay}/${startMonth}/${startYear} ${startHours.padStart(2, '0')}:${startMinutes.padStart(2, '0')}`}
                endDate={`${endDay}/${endMonth}/${endYear} ${endHours.padStart(2, '0')}:${endMinutes.padStart(2, '0')}`}
                visitedCountries={visitedCountries.join(', ')}
                visitedLocations={visitedLocations}
            />
  }

  keyExtractor = (item) => item.tripId;

  render() {
    const trips = Realm.toJSON(TptyTrip.getAllTrips());
    return (
      <View style={styles.content}>
        <FlatList
          data={trips}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <StyledText style={{ marginBottom: 10 }} weight="semibold">It looks like you have no trips</StyledText>
              <StyledText style={{ marginBottom: 5, marginHorizontal: '15%', textAlign: 'center' }}>Would you like to load any past trips we might find in your device?</StyledText>
              <StyledButton>Load past trips</StyledButton>
            </View>
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  trip: {
    padding: 5,
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000e26',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, .2)',
  },
  tripTitle: {
    textAlign: 'center',
  },
  separator: {
    marginVertical: 5,
  }
});

export default ScreenMainTrips;