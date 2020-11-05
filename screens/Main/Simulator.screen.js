/* React packages */
import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, SafeAreaView } from 'react-native';

/* Expo packages */
import * as MediaLibrary from "expo-media-library";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

/* Community packages */
import _ from 'lodash';
import axios from 'axios';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import logger from '../../lib/log';
import TptyTrip from '../../lib/trip';

/* App components */
import { Image, StyledButton, StyledText, IndeterminateLoading } from '../../components';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Class definition for the Simulator screen
 */
@inject('store')
@observer
class ScreenMainSimulator extends React.Component {
  @observable images = [];
  @observable scenario = {
    currentStatus: null,
    failed: null,
    success: false,
    parsed: {},
  }

  constructor() {
    super();
  }

  /**
   * 
   * @param {*} status 
   */
  @action.bound
  updateStatus(status) {
    this.scenario.currentStatus = status;
  }

  /**
   * 
   * @param {*} reason 
   */
  @action.bound
  failScenario(reason) {
    this.scenario.failed = reason;
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

  renderImage = ({ item }) => {
    return  <TouchableOpacity style={{ marginHorizontal: 5 }} onPress={() => this.clickity(item)}>
              <Image {...item } />
            </TouchableOpacity>
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
    console.log(venue);
  }

  /**
   * 
   * @param {*} scenario 
   */
  @action.bound
  async parseScenario(content) {
    const scenarioLines = content.split('\n');
    const scenario = {
      name: null,
      country: null,
      city: null,
      pings: [],
    };
    for (let i = 0; i < scenarioLines.length; i++) {
      const line = scenarioLines[i];
      if (!line.length) {
        if (scenario.name === null) {
          throw 'Parsing error: Scenario name is missing';
        }
        if (scenario.country === null) {
          throw 'Parsing error: Home country is missing';
        }
        if (scenario.city === null) {
          throw 'Parsing error: Home city is missing';
        }
        if (!scenario.pings.length) {
          throw 'Parsing error: No pings have been found in the file';
        }
      }

      const [ key, value ] = line.split(':');
      if (key === 'Ping') {
        const percentage = Math.round((i + 1) / scenarioLines.length * 100);
        this.updateStatus(`Loading pings [${percentage}%]`);

        const coords = value.split(',');
        if (coords.length < 4) {
          throw `Line ${i} failed, values missing from the ping`;
        }

        let latitude = Number.parseFloat(coords[0]);
        let longitude = Number.parseFloat(coords[1]);
        let altitude = Number.parseFloat(coords[2]);
        let timeOffset = Number.parseInt(coords[3]);
        if (_.isNaN(latitude)) {
          throw `Line ${i} failed: <latitude> is not a number`;
        }
        if (_.isNaN(longitude)) {
          throw `Line ${i} failed: <longitude> is not a number`;
        }
        if (_.isNaN(altitude) && altitude !== 'null') {
          altitude = 0;
        }
        if (_.isNaN(timeOffset) && timeOffset !== 'null') {
          timeOffset = 15;
        }

        scenario.pings.push({
          coords: {
            latitude,
            longitude,
            altitude,
          },
          timeOffset,
        });
        await delay(0);
        continue;
      }
      scenario[key.toLowerCase().trim()] = value.trim();
    }
    this.scenario.parsed = scenario;
  }

  /**
   * 
   * @param {*} initialTime 
   * @param {*} interval 
   */
  @action.bound
  async prepareScenario(initialTime, interval) {
    let previousTimestamp = initialTime;
    const pings = this.scenario.parsed.pings;
    for (let i = 0; i < pings.length; i++) {
      const percentage = Math.round((i + 1) / pings.length * 100);
      this.updateStatus(`Preparing pings [${percentage}%]`);

      const timestampOffset = ((pings[i].timeOffset || 0) * 60 * 1000);
      const intervalAddition = (interval * 1000);
      const currentTimestamp = previousTimestamp + timestampOffset + intervalAddition;
      logger.debug(`Time for ping ${i}:`, new Date(currentTimestamp));
      previousTimestamp = currentTimestamp;

      this.scenario.parsed.pings[i] = {
        ...pings[i],
        timestamp: currentTimestamp,
      };
      await delay(0);
    }
  }

  /**
   * 
   * @param {*} initialTime 
   * @param {*} interval 
   */
  @action.bound
  async runScenario(initialTime, interval) {
    const [ homeRegion ] = await Location.geocodeAsync(`${this.scenario.parsed.country}, ${this.scenario.parsed.city}`);
    if (!homeRegion) {
      this.failScenario(`Could not find a region with the parameters country=${this.scenario.parsed.country} city=${this.scenario.parsed.city}`);
    }
    await TptyTrip.OnRegionLeave(homeRegion, initialTime);
    const pings = this.scenario.parsed.pings;
    for (let i = 0; i < pings.length; i++) {
      const percentage = Math.round((i + 1) / pings.length * 100);
      this.updateStatus(`Sending pings [${percentage}%]`);
      await TptyTrip.OnLocationPing(pings[i], pings[i].timestamp);
      await delay(0);
    }
    await TptyTrip.OnRegionEnter(homeRegion, pings[pings.length - 1].timestamp + (interval * 1000));
  }

  /**
   * 
   */
  @action.bound
  async loadScenario() {
    const document = await DocumentPicker.getDocumentAsync();
    if (document.type === 'success') {
      this.scenario.failed = null;
      this.scenario.success = false;
      this.scenario.parsed = {};
      this.updateStatus('Loading scenario file [0%]');
      try {
        const content = await FileSystem.readAsStringAsync(document.uri);
        await this.parseScenario(content);

        const initialTime = Date.now();
        const interval = (15 * 60) + 1;
        await this.prepareScenario(initialTime, interval);
        await this.runScenario(initialTime, interval);
        await TptyTrip.parseTrips((trip, currentPing) => {
          const percentage = Math.round((currentPing + 1) / trip.pings.length * 100);
          this.updateStatus(`Parsing trip [${percentage}%]`);
        });
        this.scenario.success = true;
      } catch(err) {
        logger.error(err);
        this.scenario.failed = err?.message || err;
      }
    }
  }

  render() {
    return (
      <View style={styles.content}>
        {this.props.store.User.isAdmin()
          ? <View style={{ flex: 1 }}>
              <View style={{ margin: 10, alignItems: 'center' }}>
                <StyledText style={{ marginVertical: 10 }} weight='bold'>Scenario</StyledText>
                {this.scenario.currentStatus && !this.scenario.failed && !this.scenario.success &&
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <IndeterminateLoading>{this.scenario.currentStatus}</IndeterminateLoading>
                  </View>
                }
                {!this.scenario.currentStatus &&
                  <StyledButton onPress={this.loadScenario}>Load scenario</StyledButton>
                }
                {this.scenario.failed &&
                  <View style={{ backgroundColor: 'rgba(0, 0, 0, .6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}>
                    <StyledText color='#ff6347'>{this.scenario.failed}</StyledText>
                  </View>
                }
                {this.scenario.success &&
                  <StyledText>Trip successfully parsed, check your trips tab!</StyledText>
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
});

export default ScreenMainSimulator;
