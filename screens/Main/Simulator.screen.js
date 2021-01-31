/* React packages */
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, SafeAreaView, Dimensions } from 'react-native';

/* Expo packages */
import * as MediaLibrary from "expo-media-library";

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';
import AWS from '../../lib/aws';

/* App classes */
import Loading from '../../classes/Loading';
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
  @observable loading = {
    photos: false,
  }

  /**
   * 
   */
  @action.bound
  async getPhotosAsync() {
    this.loading.photos = true;
    Loading.getQueue('background').add({
      id: 'FetchPhotos',
      initialMessage: "Fetching your device photos",
      action: async (OnUpdate, OnFail) => {
        this.images = await this.props.store.TripStore.getAllPhotos();
        this.loading.photos = false;
      },
    });
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
    const venues = await AWS.invokeAPI('/venues/all', {
      params: {
        latitude,
        longitude,
        altitude: 0,
      }
    });

    this.props.store.Dialog.showDialog({
      title: 'Closest venues for image',
      component: <VenueDialog venues={venues} latitude={latitude} longitude={longitude} />,
      onCancel: false,
      onConfirm: {
        text: 'Close',
      },
    });
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
        {(true || this.props.store.UserStore.user?.isAdmin)  // TODO: CHANGE ON PRODUCTION
        ?
          <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1, margin: 10 }}>
              {this.images.length ? <StyledText style={{ marginBottom: 10, alignSelf: 'center' }} weight="semibold">Loaded photos</StyledText> : null}
              <FlatList
                contentContainerStyle={{ width: '100%', alignItems: 'center' }}
                data={this.images.slice()}
                renderItem={this.renderImage}
                numColumns={3}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <View style={{ width: '100%', alignItems: 'center', paddingVertical: 10 }}>
                    {this.loading.photos 
                    ?
                      <View style={{ width: '100%' }}>
                        <IndeterminateLoading>Loading photos</IndeterminateLoading>
                      </View>
                    :
                      <>
                        <StyledText style={{ marginBottom: 10 }} weight="semibold">Tap on Grab Photos to retrieve all the photos</StyledText>
                        <StyledButton style={{ marginVertical: 20 }} onPress={this.getPhotosAsync}>Grab Photos</StyledButton>
                      </>
                    }
                    
                  </View>
                }
              />
            </View>
          </View>
        :
          <StyledText>You cannot access this feature if you're not an Administrator</StyledText>
        }
      </View>
    );
  }
}

class VenueDialog extends React.PureComponent {
  renderVenueItem = ({ item, index }) => {
    const bgColor = (index % 2) == 0 ? '#383838' : 'transparent';
    return (
      <View style={{ paddingVertical: 2, backgroundColor: bgColor, marginVertical: 5 }}>
        <StyledText>Venue: {item.name}</StyledText>
        <StyledText>Country: ({item.location.cc}) {item.location.country}</StyledText>
        <StyledText>City: {item.location.city}</StyledText>
        <StyledText>Distance: {(item.location.distance / 1000).toFixed(2)}km</StyledText>
        <StyledText color="#5390f6" weight="bold" size={20} style={{ position: 'absolute', right: 5, top: 20 }}>{index + 1}</StyledText>
      </View>
    )
  }

  render() {
    return (
      <View style={{ maxHeight: Dimensions.get('window').height - 300 }}>
        <StyledText color="#5390f6" weight="bold" style={{ marginTop: 10, textAlign: 'center' }}>Latitude: {this.props.latitude}</StyledText>
        <StyledText color="#5390f6" weight="bold" style={{ marginBottom: 10, textAlign: 'center' }}>Longitude: {this.props.longitude}</StyledText>
        <FlatList
          data={this.props.venues}
          renderItem={this.renderVenueItem}
          keyExtractor={item => (item.id + 1).toString()}
          ListEmptyComponent={
            <View style={{ alignItems: 'center' }}>
              <StyledText style={{ marginBottom: 10 }} weight="semibold">No venues found</StyledText>
            </View>
          }
        />
      </View>
    )
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
