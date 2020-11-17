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
import * as yaml from 'js-yaml';
import { v4 as uuid_v4 } from 'uuid';
import { observable, action } from "mobx"
import { observer, inject } from "mobx-react"

/* App library */
import AWS from '../../lib/aws';
import { getDistanceBetweenPoints, getTimeBetweenPoints } from '../../lib/location';
import logger from '../../lib/log';
import TptyTrip from '../../lib/trip';

/* App components */
import { Image, StyledButton, StyledText, IndeterminateLoading } from '../../components';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const SCENARIO_TYPE = {
  MIN: 0,
  MAX: 2,
  TYPE_COORDS: 0,
  TYPE_FULL: 1,
  TYPE_REAL: 2,
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
    data: null,
    sim: {
      initialTime: null,
      result: {},
    }
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

  /**
   * 
   */
  @action.bound
  async verifyIntegrity() {
    try {
      const scenario = this.scenario.data;
      if (!scenario) {
        throw 'Scenario is invalid';
      }
      if (scenario.name === null) {
        throw 'Scenario: Scenario name is missing';
      }      
      if (_.isNaN(scenario.type) || (scenario.type < SCENARIO_TYPE.MIN && scenario.type > SCENARIO_TYPE.MAX)) {
        throw `Scenario: <type> is not a number between 0 and 1. Found ${scenario.type}`;
      }
      if (!scenario.pings.length) {
        throw 'Scenario: No pings have been found';
      }

      if (scenario.type === SCENARIO_TYPE.TYPE_FULL) {
        throw `Full scenario simulation is not supported yet!`;
      }

      if (scenario.type !== SCENARIO_TYPE.TYPE_COORDS) {
        if (scenario.country === null) {
          throw 'Scenario: Home country is missing';
        }
        if (scenario.city === null) {
          throw 'Scenario: Home city is missing';
        }
        if (scenario.interval === null || _.isNaN(scenario.interval)) {
          throw `Scenario: <interval> is not a number. Found ${scenario.interval}`;
        }
      }

      for (let i = 0; i < scenario.pings.length; i++) {
        const percentage = Math.round((i + 1) / scenario.pings.length * 100);
        this.updateStatus(`Verifying scenario pings [${percentage}%]`);

        const { latitude, longitude, altitude, timeOffset } = scenario.pings[i];
        if (_.isNaN(latitude)) {
          throw `Ping ${i}: <latitude> is not a number. Found ${latitude}`;
        }
        if (_.isNaN(longitude)) {
          throw `Ping ${i}: <longitude> is not a number. Found ${longitude}`;
        }
        if (_.isNaN(altitude) && altitude !== null) {
          altitude = 0;
        }
        if (_.isNaN(timeOffset) && timeOffset !== null) {
          timeOffset = 15;
        }
        await delay(0);
      }
    } catch(err) {
      logger.error('Scenario integrity check failed!');
      throw err;
    }
  }

  /**
   * 
   */
  @action.bound
  async preScenario() {
    if (this.scenario.data.type === SCENARIO_TYPE.TYPE_COORDS) {
      this.scenario.sim.result = {
        pings: [],
      }
    } else {
      let previousTimestamp = this.scenario.sim.initialTime;
      const scenario = this.scenario.data;
      for (let i = 0; i < scenario.pings.length; i++) {
        const percentage = Math.round((i + 1) / scenario.pings.length * 100);
        this.updateStatus(`Preparing pings [${percentage}%]`);

        const timestampOffset = ((scenario.pings[i].timeOffset || 0) * 60 * 1000);
        const intervalAddition = (this.scenario.data.interval * 1000);
        const currentTimestamp = previousTimestamp + timestampOffset + intervalAddition;
        logger.debug(`Time for ping ${i}:`, new Date(currentTimestamp));
        previousTimestamp = currentTimestamp;

        scenario.pings[i] = {
          coords: {
            latitude,
            longitude,
            altitude,
          },
          timeOffset,
          expectedVenue,
          timestamp: currentTimestamp,
        }
        await delay(0);
      }
    }
  }

  /**
   * Copy of TptyTrip.OnRegionEnter refactored for simulation purposes
   */
  @action.bound
  sim_OnRegionEnter(region) {
    const scenario = this.scenario.data;
    const timestamp = scenario.pings[scenario.pings.length - 1].timestamp + (scenario.interval * 1000)
    if (scenario.type === SCENARIO_TYPE.TYPE_REAL) {
      return TptyTrip.OnRegionEnter(region, timestamp);
    }

    logger.debug('SIM: Entered region');
    const lastPing = {
      pingId: uuid_v4(),
      latitude: region.latitude,
      longitude: region.longitude,
      transport: true,
      altitude: 0,
      timestamp: timestamp,
      photos: [],
    }
    logger.debug('SIM: Ending trip');
    this.scenario.sim.result.pings.push(lastPing);
    this.scenario.sim.result.finishedAt = timestamp;
  }

  /**
   * Copy of TptyTrip.OnRegionLeave refactored for simulation purposes
   */
  @action.bound
  sim_OnRegionLeave(region) {
    const scenario = this.scenario.data;
    const timestamp = this.scenario.sim.initialTime;
    if (scenario.type === SCENARIO_TYPE.TYPE_REAL) {
      return TptyTrip.OnRegionLeave(region, timestamp);
    }

    logger.debug('SIM: Left region');
    const firstPing = {
      pingId: uuid_v4(),
      latitude: region.latitude,
      longitude: region.longitude,
      altitude: 0,
      timestamp: timestamp,
      photos: [],
    }
    logger.debug('SIM: Starting trip');
    this.scenario.sim.result = {
      tripId: uuid_v4(),
      startedAt: timestamp,
      pings: [ firstPing ],
    }
  }

  /**
   * Copy of TptyTrip.OnLocationPing refactored for simulation purposes
   */
  @action.bound
  sim_OnLocationPing(ping) {
    if (this.scenario.data.type === SCENARIO_TYPE.TYPE_REAL) {
      return TptyTrip.OnLocationPing(ping, ping.timestamp);
    }

    const currentPing = {
      pingId: uuid_v4(),
      latitude: ping.coords.latitude,
      longitude: ping.coords.longitude,
      altitude: ping.coords.altitude,
      timestamp: ping.timestamp,
      photos: [],
    }
    this.scenario.sim.result.pings.push(currentPing);
  }

  /**
   * 
   * @param {*} updateFn 
   */
  @action.bound
  async sim_parseTrips(updateFn) {
    if (this.scenario.data.type === SCENARIO_TYPE.TYPE_REAL) {
      return await TptyTrip.parseTrips(updateFn);
    }
    await this.sim_parsePings(this.scenario.sim.result, updateFn);
  }

  /**
   * 
   * @param {*} trip 
   * @param {*} updateFn 
   */
  @action.bound
  async sim_parsePings(trip, updateFn) {
    logger.info(`SIM: Current trip: id=${trip.tripId} | pings=${trip.pings.length}`);
    try {
      const pings = trip.pings;
      // Skip the last ping (return ping) as it is the home location set by user inserted automatically by the system
      for (let p = 0; p < pings.length; p++) {
        if (updateFn) {
          updateFn(trip, p);
        }
        const isFirstPing = (p === 0);
        const isLastPing = (p === pings.length - 1);

        const currentPing = pings[p];
        const previousPing = (!isFirstPing) ? pings[p-1] : null;
        if (!currentPing.parsed) {
          try {
            // If the current ping has no location set, set location from coordinates
            if (!currentPing.country) {
              const location = await Location.reverseGeocodeAsync({ latitude: currentPing.latitude, longitude: currentPing.longitude });
              currentPing.country = location[0].country;
              currentPing.city = location[0].city;
            }

            // If the current ping is the last ping and the trip is not finished yet, don't parse the ping
            if (isLastPing && !trip.finishedAt) {
              continue;
            }

            currentPing.distance = getDistanceBetweenPoints(previousPing, currentPing);
            currentPing.transport = (isLastPing || TptyTrip.isInFlight(currentPing));
            currentPing.parsed = true;

            // If this is the first ping or both previous and current pings are transport pings skip venue saving
            if (isFirstPing || (previousPing && currentPing.transport && previousPing.transport)) {
              // If this is the last ping and the trip is finished or is a transport ping, also merge the current ping with the previous ping
              if (previousPing && previousPing.transport) {
                logger.debug('SIM: Merging transport pings!');
                TptyTrip.mergePings(currentPing, previousPing);
                pings.splice(--p, 1);
              }
              continue;
            }

            if (TptyTrip.hasVisited(currentPing)) {
              logger.debug('SIM: Location visited! Invoking API to find the venue');
              const venueResponse = this.sim_fetchVenue(currentPing);

              logger.debug(`SIM: Venue ${venueResponse ? `found with name ${venueResponse.name}` : 'not found'}`);
              if (venueResponse) {
                if (previousPing.venue && previousPing.venue.venueId === venueResponse.venueId) {
                  // If the venue data is still the same as the previous one even if the user moved more than 200m
                  // or there is no venue at the current location (the user is most likely flying)
                  // Still merge the previous ping with the current one but keep the coords of the current one
                  logger.debug(`SIM: This ping is not within 200m of the previous one but at the same venue`);
                  TptyTrip.mergePings(currentPing, previousPing, { withCoords: true });
                  pings.splice(--p, 1);
                } else {
                  // Use the venue data
                  currentPing.venue = venueResponse;
                }
              }
              await delay(1500);
            }
          } catch(err) {
            currentPing.parsed = false;
            throw err;
          }
        }
      }
    } catch(err) {
      logger.error('SIM: sim_parsePings failed with err ->', err.message);
      logger.debug('SIM: Automatic retry in 5 seconds');
      await delay(5000);
      await this.sim_parsePings(trip, updateFn);
    }
  }

  @action.bound
  async sim_fetchVenue(ping, all=false) {
    return await AWS.invokeAPI(`/venues${all ? '/all' : ''}`, {
      params: {
        latitude: ping.latitude,
        longitude: ping.longitude,
        altitude: ping.altitude,
      }
    });
  }

  @action.bound
  async sim_sendPing(ping, i) {
    const pings = this.scenario.data.pings;
    const percentage = Math.round((i + 1) / pings.length * 100);
    this.updateStatus(`Sending pings [${percentage}%]`);
    if (this.scenario.data.type !== SCENARIO_TYPE.TYPE_COORDS) {
      await this.sim_OnLocationPing(ping);
      await delay(0);
    } else {
      try {
        const venues = await this.sim_fetchVenue(ping, true);
        this.scenario.sim.result.pings.push({
          key: i,
          latitude: ping.latitude,
          longitude: ping.longitude,
          venues,
          expectedVenue: ping.expectedVenue,
        })
        await delay(2500);
      } catch(err) {
        logger.error('SIM: sim_sendPing failed with err ->', err.message);
        logger.debug('SIM: Automatic retry in 5 seconds');
        await delay(5000);
        await this.sim_sendPing(ping, i);
      }
    }
  }

  @action.bound
  async postScenario() {
    this.scenario.success = true;
  }

  /**
   * 
   */
  @action.bound
  async runScenario(scenario) {
    this.scenario.data = yaml.safeLoad(scenario).scenario;
    this.scenario.sim.initialTime = Date.now();
    await this.verifyIntegrity();
    await this.preScenario();

    const sim_sendPings = async () => {
      const pings = this.scenario.data.pings;
      for (let i = 0; i < pings.length; i++) {
        await this.sim_sendPing(pings[i], i);
      }
    }

    if (this.scenario.data.type !== SCENARIO_TYPE.TYPE_COORDS) {
      const [ homeRegion ] = await Location.geocodeAsync(`${this.scenario.data.country}, ${this.scenario.data.city}`);
      if (!homeRegion) {
        this.failScenario(`Scenario type is set to ${this.scenario.data.type} but could not find a region with the parameters country=${this.scenario.data.country} city=${this.scenario.data.city}`);
      }
      await this.sim_OnRegionLeave(homeRegion);
      await sim_sendPings();
      await this.sim_OnRegionEnter(homeRegion);
      await this.sim_parseTrips((trip, p) => {
        const percentage = Math.round((p + 1) / trip.pings.length * 100);
        this.updateStatus(`Parsing trip [${percentage}%]`);
      });      
    } else {
      await sim_sendPings();
    }

    await this.postScenario();
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
      this.updateStatus('Loading scenario file [0%]');
      try {
        const scenario = await FileSystem.readAsStringAsync(document.uri);
        await this.runScenario(scenario);
        this.scenario.success = true;
      } catch(err) {
        logger.error('Simulator.screen.loadScenario >', err.message);
        this.scenario.failed = err?.message || err;
      }
    }
  }

  renderImage = ({ item }) => {
    return  <TouchableOpacity style={{ marginHorizontal: 5 }} onPress={() => this.clickity(item)}>
              <Image {...item } />
            </TouchableOpacity>
  }


  renderCoordsResult = ({ item }) => {
    const numOfVenues = 5;
    let result;
    if (item.venues) {
      result =  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <StyledText weight="bold">Top {numOfVenues} venues: </StyledText>
                  {item.venues.slice(0, numOfVenues).map((venue, i) => {
                    const closestMatch = venue.name.split(' ').find(s => item.expectedVenue.split(' ').find(e => e.toLowerCase().indexOf(s.toLowerCase()) !== -1));
                    return <StyledText weight={closestMatch ? 'bold' : null} color={closestMatch ? '#0f0' : '#ff6347'}>{venue.name}{(i !== numOfVenues - 1) ? `, `  : ''}</StyledText>
                  })}
                </View>
    } else {
      result =  <>
                  <StyledText weight="bold" color="#ff6347">No venue found at this location</StyledText>
                  <StyledText>Latitude: {item.latitude}</StyledText>
                  <StyledText>Longitude: {item.longitude}</StyledText>
                </>
    }
    return  <View style={styles.item}>
              {result}
              <StyledText><StyledText weight="bold">Expected venue:</StyledText> {item.expectedVenue}</StyledText>
            </View>
              
  }

  render() {
    let scenarioResult = null;
    if (this.scenario.sim.result?.pings) {
      if (this.scenario.data?.type === SCENARIO_TYPE.TYPE_COORDS) {
        scenarioResult =  <View style={{ height: 200, alignItems: 'center' }}>
                            <FlatList
                              contentContainerStyle={{ width: '100%' }}
                              data={this.scenario.sim.result.pings.slice()}
                              renderItem={this.renderCoordsResult}
                              keyExtractor={item => item.id}
                            />
                          </View>
      } else if (this.scenario.data?.type === SCENARIO_TYPE.TYPE_FULL) {
        scenarioResult = <StyledText color="#ff6347">Full scenario simulation not supported yet!</StyledText>
      } else if (this.scenario.data?.type === SCENARIO_TYPE.TYPE_REAL) {
        scenarioResult = <StyledText>Real scenario finished, check your trips tab!</StyledText>
      }
    }
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
                {(!this.scenario.currentStatus || this.scenario.success || this.scenario.failed) &&
                  <StyledButton onPress={this.loadScenario}>Load scenario</StyledButton>
                }
                {this.scenario.failed &&
                  <View style={{ backgroundColor: 'rgba(0, 0, 0, .6)', marginVertical: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}>
                    <StyledText color='#ff6347'>{this.scenario.failed}</StyledText>
                  </View>
                }
                {this.scenario.success &&
                  <>
                    <StyledText weight="bold" style={{ marginVertical: 10 }}>Scenario: {this.scenario.data.name}</StyledText>
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
