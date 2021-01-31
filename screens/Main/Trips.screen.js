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
import { observable, action, computed } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';

/* App classes */
import Loading from '../../classes/Loading';

/* App components */
import { StyledText, StyledButton } from '../../components';

function TripItem(props) {
  const {
    tripId,
    onPress,
    startLocation, endLocation,
    startDate, endDate,
    countries, locations,
    parsing, finished
  } = props;

  const title = (!parsing) ? `Trip to ${endLocation}` : tripId;
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.trip}>
        {
          parsing &&
          <View style={{ ...styles.statusWrapper, ...styles.statusParsing }}>
            <StyledText size={10} weight="bold">AWAITING PARSING</StyledText>
          </View>
        }
        {
          !finished &&
          <View style={{ ...styles.statusWrapper, ...styles.statusProgress }}>
            <StyledText size={10} weight="bold">IN PROGRESS</StyledText>
          </View>
        }
        <View style={{ padding: 4 }}>
          <StyledText style={styles.tripTitle} weight="semibold">{title}</StyledText>
          <View style={styles.separator} />
          <StyledText>Trip start: {startDate}</StyledText>
          {finished && <StyledText>Trip end: {endDate}</StyledText>}
          {
            !parsing &&
            <>
              <View style={styles.separator} />
              <StyledText>Countries visited: {countries}</StyledText>
              <StyledText>Locations visited: {locations}</StyledText>
            </>
          }
          </View>
        </View>
    </TouchableOpacity>
  )
}

@observer class ScreenMainTrips extends React.PureComponent {

  @action.bound openTrip(tripId) {
    this.props.navigation.push('Screen.Trip', { screen: 'Trip.Tab.Details', params: { tripId }});
  }

  @action.bound loadPastTrips() {
    /* Add loaders to active-background loading queue */
    Loading.getQueue('background').add({
      id: 'FetchMedia',
      initialMessage: "Fetching your media",
      action: async (OnUpdate, OnFail) => {
        await store.TripStore.parseMedia();
      },
    });
    Loading.getQueue('background').add({
      id: 'ParseTrips',
      initialMessage: "Parsing your past trips",
      action: async (OnUpdate, OnFail) => {
        await store.TripStore.parseTrips();
      },
    });
  }

  @computed get trips() {
    const trips = store.TripStore.getAllTrips();
    return trips.map(trip => {
      const { start, end, countries } = trip.destination;
      const locations = trip.locations;

      const startDate = new Date(trip.startedAt);
      const [ startYear, startMonth, startDay ] = [ startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate() ];
      const [ startHours, startMinutes ] = [ startDate.getHours().toString(), startDate.getMinutes().toString() ];
      const startDateStr = `${startDay}/${startMonth}/${startYear} ${startHours.padStart(2, '0')}:${startMinutes.padStart(2, '0')}`;

      const endDate = new Date(trip.finishedAt);
      const [ endYear, endMonth, endDay ] = [ endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate() ];
      const [ endHours, endMinutes ] = [ endDate.getHours().toString(), endDate.getMinutes().toString() ];
      const endDateStr = `${endDay}/${endMonth}/${endYear} ${endHours.padStart(2, '0')}:${endMinutes.padStart(2, '0')}`;

      return {
        tripId: trip.tripId,
        onPress: () => this.openTrip(trip.tripId),
        startLocation: start,
        endLocation: end,
        startDate: startDateStr,
        endDate: endDateStr,
        countries: countries.join(', '),
        locations: Object.keys(locations).length,
        parsing: !trip.isParsed && trip.finishedAt,
        finished: trip.finishedAt,
      };
    })
  }

  // TODO: TPA-52
  renderItem = ({ item }) => {    
    return <TripItem {...item} />
  }

  render() {
    return (
      <View style={styles.content}>
        <FlatList
          data={this.trips.reverse()}
          renderItem={this.renderItem}
          keyExtractor={item => item.tripId}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <StyledText style={{ marginBottom: 10 }} weight="semibold">It looks like you have no trips</StyledText>
              <StyledText style={{ marginBottom: 5, marginHorizontal: '15%', textAlign: 'center' }}>Would you like to load any past trips we might find in your device?</StyledText>
              <StyledButton throttle={10} onPress={this.loadPastTrips}>Load past trips</StyledButton>
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
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000e26',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    overflow: 'hidden',
  },
  tripTitle: {
    textAlign: 'center',
  },
  separator: {
    marginVertical: 5,
  },
  statusWrapper: {
    padding: 4,
    borderBottomColor: '#000e26',
    borderBottomWidth: 1,
  },
  statusParsing: {
    backgroundColor: '#ff6347',
  },
  statusProgress: {
    backgroundColor: '#228b22',
  },
});

export default ScreenMainTrips;