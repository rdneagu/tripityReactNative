/* React packages */
import React from 'react';
import { 
  StyleSheet, FlatList, View, 
  TouchableOpacity,
} from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* MobX Store */
import store from '../../store/_index';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
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
                <StyledText>Locations visited: {visitedLocations}</StyledText>
              </View>
            </TouchableOpacity>
  }  
}

@observer
class ScreenMainTrips extends React.PureComponent {
  @observable tripsList = [];

  constructor() {
    super();
    this.generateTripsList();
  }

  openTrip = (tripId) => {
    this.props.navigation.push('Screen.Trip', { screen: 'Trip.Tab.Details', params: { tripId }});
  }

  @action.bound
  generateTripsList() {
    const trips = store.TripStore.getAllTrips();

    this.tripsList = _.map(trips, (trip => {
      const pings = trip.pings;
      const destination = {
        counter: 0,
      }
      const visitedCountries = [];
      const startLocation = pings[0].country;
      const endLocation = pings.reduce((acc, ping) => {
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
  
      const visitedLocations = pings.reduce((acc, ping) => {
        if (ping.venue) {
          acc[ping.venue.name] = (acc[ping.venue.name] || 0) + 1;
        }
        return acc;
      }, {})
  
      const startDate = new Date(trip.startedAt);
      const [ startYear, startMonth, startDay ] = [ startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate() ];
      const [ startHours, startMinutes ] = [ startDate.getHours().toString(), startDate.getMinutes().toString() ];
  
      const endDate = new Date(trip.finishedAt);
      const [ endYear, endMonth, endDay ] = [ endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate() ];
      const [ endHours, endMinutes ] = [ endDate.getHours().toString(), endDate.getMinutes().toString() ];

      return {
        tripId: trip.tripId,
        startLocation,
        endLocation,
        startDate: `${startDay}/${startMonth}/${startYear} ${startHours.padStart(2, '0')}:${startMinutes.padStart(2, '0')}`,
        endDate: `${endDay}/${endMonth}/${endYear} ${endHours.padStart(2, '0')}:${endMinutes.padStart(2, '0')}`,
        visitedCountries,
        visitedLocations,
      }
    }));
  }

  // TODO: TPA-52
  renderItem = ({ item }) => {
    return  <TripItem 
              onPress={() => this.openTrip(item.tripId)}
              startLocation={item.startLocation}
              endLocation={item.endLocation}
              startDate={item.startDate}
              endDate={item.endDate}
              visitedCountries={item.visitedCountries.join(', ')}
              visitedLocations={Object.keys(item.visitedLocations).length}
            />
  }

  render() {
    return (
      <View style={styles.content}>
        <FlatList
          data={this.tripsList}
          renderItem={this.renderItem}
          keyExtractor={item => item.tripId}
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