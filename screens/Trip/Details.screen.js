/* React packages */
import React from 'react';
import { 
  StyleSheet, FlatList, View
} from 'react-native';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import Realm from '../../lib/realm';
import logger from '../../lib/log';

/* App components */
import { StyledText, NavigationHeader } from '../../components';

/**
 * Class definition for the Trip.Tab.Details screen
 * 
 * @prop {Object} tripId          - The tripId of the trip
 * 
 * @injects store
 * Is an @observer class
 */
@inject('store')
@observer
class ScreenTripDetails extends React.Component {
  @observable locations;

  constructor() {
    super();
  }

  async componentDidMount() {
    const { tripId } = this.props.route.params;
    console.log(tripId);
    if (tripId) {
      const trip = (await Realm.run(() => Realm.db.objects('Trip').filtered('tripId = $0', tripId)))[0]
      console.log(trip);
      this.locations = trip.pings.reduce((acc, ping) => {
        if (ping.venue) {
          if (!acc[ping.venue.name]) {
            acc[ping.venue.name] = {
              name: ping.venue.name,
              category: ping.venue.category,
              country: ping.country,
              timestamp: ping.timestamp,
              count: 0,
            };
          }
          acc[ping.venue.name].count++;
        }
        return acc;
      }, {})
    }
  }

  @action.bound
  renderItem({ item }) {
    return  <View style={styles.location}>
              <View style={styles.locationImage} />
              <View style={styles.locationDetails}>
                <StyledText style={styles.locationTitle} weight='semibold'>{item.name}</StyledText>
                <StyledText style={styles.locationTitle}>{item.country}</StyledText>
                <View style={styles.separator} />
                <StyledText>{item.category}</StyledText>
                <StyledText>Times visited: {item.count}</StyledText>
              </View>
            </View>
  }

  render() {
    return (
      <View style={styles.content}>
        <NavigationHeader icon={<Entypo name="location" size={18} color="white" />} back={() => this.props.navigation.replace('Screen.Main', 'Main.Tab.Trips')}>TRIP DETAILS</NavigationHeader>
        {this.locations && <FlatList data={_.orderBy(this.locations, ['count', 'timestamp'], ['desc', 'asc'])} renderItem={this.renderItem} keyExtractor={item => item.name} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  location: {
    flexDirection: 'row',
    padding: 5,
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000e26',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, .2)',
  },
  locationImage: {
    width: 100,
    height: 150,
    flexShrink: 0,
    flexGrow: 0,
    marginRight: 5,
    borderWidth: 1,
    borderColor: 'white',
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    textAlign: 'center',
  },
  separator: {
    marginVertical: 10,
  }
});

export default ScreenTripDetails;