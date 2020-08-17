/* React packages */
import React from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, FlatList, Text, View, TouchableOpacity } from 'react-native';

/* Expo packages */
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from "expo-media-library";

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import TptyLog from '../../lib/log';
import TptyTrip from '../../lib/trip';

/* App components */
import { Image, StyledButton, StyledText, IndeterminateLoading } from '../../components';

@inject('store')
@observer
class ScreenMainGrabPhotos extends React.Component {
  @observable parsing = {
    finished: false,
    photo: null,
    trip: null,
  }

  async componentDidMount() {
    try {
      await TptyTrip.parseMedia(this.updateParsing);
      TptyLog.success('Finished parsing');
      this.parsing.finished = true;
    } catch(e) {
      TptyLog.error(e);
    }
  }

  @action.bound
  updateParsing(photo, trip) {
    this.parsing.photo = photo;
    this.parsing.trip = trip;
  }

  @action.bound
  async getPhotosAsync() {
    this.images = [];
    const photos = await MediaLibrary.getAssetsAsync({ sortBy: MediaLibrary.SortBy.creationTime, first: 100 });
    for (let i = 0; i < photos.assets.length; i++) {
      const meta = await MediaLibrary.getAssetInfoAsync(photos.assets[i]);
      this.images.push({
        src: meta.localUri,
        location: meta.location,
      })
    }
  }

  @action.bound
  async clickity(image) {
    if (!image.location) return;

    const { latitude, longitude } = image.location;
    const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${latitude},${longitude}&v=20200608&client_id=UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX&client_secret=ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ`);
    // const [ venue ] = _.sortBy(venueRequest.data.response.venues, (v) => v.location.distance);
    const [ venue ] = venueRequest.data.response.venues;
    alert(`Closest venue for clicked image: \n${venue.name}\n\nCity: ${venue.location.city}\nCountry: (${venue.location.cc}) ${venue.location.country}`)
    console.log(venue);
  }

  render() {
    const { photo, trip } = this.parsing;
    return (
      <View style={styles.content}>
        {!this.parsing.finished && 
          <>
            {photo && <StyledText>Parsing photo: {photo.filename}</StyledText>}
            {trip && <View>
              <StyledText>In trip</StyledText>
              <StyledText>From: {trip.pings[0].country}</StyledText>
              <StyledText>To: {trip.pings[trip.pings.length-1].country}</StyledText> 
            </View>}
            <IndeterminateLoading />
          </>
        }
        {this.parsing.finished && 
          <>
            <StyledText>Finished parsing</StyledText>
            <StyledText>Number of trips detected: {this.props.store.UserStore.user.trips.length}</StyledText>
          </>
        }
        {/* <StyledButton style={{ marginVertical: 20 }} onPress={this.getPhotosAsync}>Grab Photos</StyledButton> */}
        {/* {this.images.length > 0 && <FlatList
          style={{ width: '100%' }}
          contentContainerStyle={{ alignItems: 'center' }}
          data={this.images}
          renderItem={({ item }) => <TouchableOpacity onPress={() => this.clickity(item)}><Image {...item } /></TouchableOpacity>}
          keyExtractor={item => item.src}
        />} */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabPhotosButton: {
    backgroundColor: '#ff0000',
    padding: 5,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 2,
  },
});

export default ScreenMainGrabPhotos;