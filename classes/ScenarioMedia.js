/* Expo packages */
import * as Location from 'expo-location';

/* MobX Store */
import store from '../store/_index';

/* Community packages */
import { action } from 'mobx';

/* App classes */
import Scenario from './Scenario';
import Loading from './Loading';

/* App library */
import logger from '../lib/log';

/**
 * Class definition for the ScenarioMedia
 */
class ScenarioMedia extends Scenario {
  constructor(sim, props) {
    super(sim, props);

    if (props.country === null) {
      throw new Scenario.CScenarioValueError('Scenario <country> is missing');
    }
    if (props.city === null) {
      throw new Scenario.CScenarioValueError('Scenario <city> is missing');
    }
  }

  @action.bound
  async preRun() {
    const pings = this.data.pings;
    const assets = [];
    let creationTime = this.startTimestamp;
    for (let i = 0; i < pings.length; i++) {
      const percentage = Math.round((i + 1) / pings.length * 100);
      this.simulator.setStatus(undefined, `Preparing assets [${percentage}%]`);

      const imageTimeOffset = (pings[i].timeOffset * 60 * 1000) / pings[i].photos;
      for (let p = 0; p < pings[i].photos; p++) {
        logger.debug(`simulator://${i}_${p}.jpg`);
        creationTime += imageTimeOffset;
        assets.push({
          uri: `simulator://${i}_${p}.jpg`,
          location: {
            latitude: this.data.pings[i].latitude,
            longitude: this.data.pings[i].longitude,
          },
          exif: {
            '{GPS}': {
              AltitudeRef: 0,
              Altitude: this.data.pings[i].altitude,
            },
          },
          creationTime,
        })
        logger.debug(`Time for asset ${i}_${p}:`, new Date(creationTime));
      }
      await Scenario.delay(0);
    }
    this.data.pings = assets;
  }

  @action.bound
  async postRun() {
    Loading.getQueue('background').add({
      id: 'ParseTrips',
      initialMessage: "Parsing your past trips",
      action: async (OnUpdate, OnFail) => {
        await store.TripStore.parseTrips();
      },
    });
    // store.UserStore.user.reset();
  }

  @action.bound
  async run() {
    await this.preRun();
    const [ homeRegion ] = await Location.geocodeAsync(`${this.data.country}, ${this.data.city}`);
    if (!homeRegion) {
      throw new Scenario.CScenarioError(`Scenario type is set to '${this.data.type}' but could not find a region at location '${this.data.country}, ${this.data.city}'`);
    }
    store.UserStore.user.setHomeCountry(this.data.country);
    store.UserStore.user.setHomeCity(this.data.city);
    Loading.getQueue('background').add({
      id: 'FetchMedia',
      initialMessage: "Fetching your media",
      action: async (OnUpdate, OnFail) => {
        await store.TripStore.parseMedia(this.data.pings);
      },
    });
    
    await this.postRun();
  }
}


export default ScenarioMedia;