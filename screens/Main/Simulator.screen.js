/* React packages */
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, SafeAreaView } from 'react-native';

/* Expo packages */
import * as MediaLibrary from "expo-media-library";

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';

/* App classes */
import Simulator from '../../classes/Simulator';

/* App components */
import { Image, StyledButton, StyledText, IndeterminateLoading } from '../../components';

/**
 * Class definition for the Simulator screen
 */
@inject('store')
@observer
class ScreenMainSimulator extends React.Component {
  @observable images = [];
  @observable simulator = new Simulator();

  constructor() {
    super();
  }

  /**
   * 
   */
  @action.bound
  async getPhotosAsync() {
    const images = [];
    const photos = await MediaLibrary.getAssetsAsync({ sortBy: MediaLibrary.SortBy.creationTime, first: 100 });
    for (let i = 0; i < photos.assets.length; i++) {
      const meta = await MediaLibrary.getAssetInfoAsync(photos.assets[i]);
      images.push({
        id: photos.assets[i].id,
        src: meta.localUri,
        location: meta.location,
      });
    }
    this.images = images;
  }

  @action.bound
  async loadScenario() {
    await this.simulator.run();
  }

  /**
   *
   */
  @action.bound
  async clickity(image) {
    if (!image.location) return;

    const { latitude, longitude } = image.location;
    const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${latitude},${longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
    // const [ venue ] = _.sortBy(venueRequest.data.response.venues, (v) => v.location.distance);
    const [ venue ] = venueRequest.data.response.venues;
    alert(`Closest venue for clicked image: \n${venue.name}\n\nCity: ${venue.location.city}\nCountry: (${venue.location.cc}) ${venue.location.country}`)
  }

  renderImage = ({ item }) => {
    return  <TouchableOpacity style={{ marginHorizontal: 5 }} onPress={() => this.clickity(item)}>
              <Image {...item } />
            </TouchableOpacity>
  }


  renderCoordsResult = ({ item }) => {
    const numOfVenues = 5;
    const result = (item.venues) 
      ?
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StyledText weight="bold">Top {numOfVenues} venues: </StyledText>
          {item.venues.slice(0, numOfVenues).map((venue, i) => {
            const closestMatch = venue.name.split(' ').find(s => item.expectedVenue.split(' ').find(e => e.toLowerCase().indexOf(s.toLowerCase()) !== -1));
            return <StyledText weight={closestMatch ? 'bold' : null} color={closestMatch ? '#0f0' : '#ff6347'}>{venue.name}{(i !== numOfVenues - 1) ? `, `  : ''}</StyledText>
          })}
        </View>
      :
        <>
          <StyledText weight="bold" color="#ff6347">No venue found at this location</StyledText>
          <StyledText>Latitude: {item.latitude}</StyledText>
          <StyledText>Longitude: {item.longitude}</StyledText>
        </>
  
    return (
      <View style={styles.item}>
        {result}
        <StyledText><StyledText weight="bold">Expected venue:</StyledText> {item.expectedVenue}</StyledText>
      </View>
    )
              
  }

  render() {
    let scenarioResult = null;
    if (this.simulator.scenario?.data) {
      if (this.simulator.scenario.type === 'coords') {
        scenarioResult =  <View style={{ height: 200, alignItems: 'center' }}>
                            <FlatList
                              contentContainerStyle={{ width: '100%' }}
                              data={this.simulator.scenario.result.pings}
                              renderItem={this.renderCoordsResult}
                              keyExtractor={item => item.key}
                            />
                          </View>
      } else if (this.simulator.scenario.type === 'full') {
        scenarioResult = <StyledText color="#ff6347">Full scenario simulation not supported yet!</StyledText>
      } else if (this.simulator.scenario.type === 'real') {
        scenarioResult = <StyledText>Real scenario finished, check your trips tab!</StyledText>
      }
    }
    return (
      <View style={styles.content}>
        {this.props.store.UserStore.user.isAdmin
          ? <View style={{ flex: 1 }}>
              <View style={{ margin: 10, alignItems: 'center' }}>
                <StyledText style={{ marginVertical: 10 }} weight='bold'>Scenario</StyledText>
                {this.simulator.status === Simulator.STATUS_TYPES.PENDING 
                  ?
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <IndeterminateLoading>{this.simulator.statusMsg}</IndeterminateLoading>
                    </View>
                  :
                    <StyledButton onPress={this.loadScenario}>Load scenario</StyledButton>
                }
                {this.simulator.status === Simulator.STATUS_TYPES.FAIL &&
                  <View style={{ backgroundColor: 'rgba(0, 0, 0, .6)', marginVertical: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}>
                    <StyledText color='#ff6347'>{this.simulator.statusMsg}</StyledText>
                  </View>
                }
                {this.simulator.status === Simulator.STATUS_TYPES.SUCCESS &&
                  <>
                    <StyledText weight="bold" style={{ marginVertical: 10 }}>Scenario: {this.simulator.scenario.name}</StyledText>
                    {scenarioResult}
                  </>
                }
              </View>
              <View style={{ flex: 1, margin: 10, alignItems: 'center' }}>
                {this.images.length ? <StyledText style={{ marginBottom: 10 }} weight="semibold">Loaded photos</StyledText> : null}
                <FlatList
                  contentContainerStyle={{ width: '100%', alignItems: 'center' }}
                  data={this.images.slice()}
                  renderItem={this.renderImage}
                  numColumns={3}
                  keyExtractor={item => item.id}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                      <StyledText style={{ marginBottom: 10 }} weight="semibold">Tap on Grab Photos to retrieve all the photos</StyledText>
                      <StyledButton style={{ marginVertical: 20 }} onPress={this.getPhotosAsync}>Grab Photos</StyledButton>
                    </View>
                  }
                />
              </View>
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
  item: {
    padding: 5,
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000e26',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, .2)',
  }
});

export default ScreenMainSimulator;
