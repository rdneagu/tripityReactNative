/* Expo packages */
import * as Location from 'expo-location';

/* MobX Store */
import store from '../store/_index';

/* Community packages */
import _ from 'lodash';
import { action } from 'mobx';

/* App classes */
import Scenario from './Scenario';

/* App library */
import logger from '../lib/log';

/**
 * Class definition for the ScenarioReal
 */
class ScenarioReal extends Scenario {
  constructor(sim, props) {
    super(sim, props);

    if (props.country === null) {
      throw new Scenario.CScenarioError('Scenario <country> is missing');
    }
    if (props.city === null) {
      throw new Scenario.CScenarioError('Scenario <city> is missing');
    }
    if (props.interval === null || _.isNaN(props.interval)) {
      throw new Scenario.CScenarioError(`Scenario <interval> is not a number. Found ${props.interval}`);
    }
  }

  @action.bound
  async preRun() {
    const pings = this.data.pings;
    const previousTimestamp = this.startTimestamp;
    for (let i = 0; i < pings.length; i++) {
      const percentage = Math.round((i + 1) / pings.length * 100);
      this.simulator.setStatus(undefined, `Preparing pings [${percentage}%]`);

      const timestampOffset = ((pings[i].timeOffset || 0) * 60 * 1000);
      const intervalAddition = (this.data.interval * 1000);
      const currentTimestamp = previousTimestamp + timestampOffset + intervalAddition;
      logger.debug(`Time for ping ${i}:`, new Date(currentTimestamp));
      previousTimestamp = currentTimestamp;

      this.data.pings[i] = {
        coords: {
          latitude,
          longitude,
          altitude,
        },
        timeOffset,
        expectedVenue,
        timestamp: currentTimestamp,
      }
      await Scenario.delay(0);
    }
  }

  @action.bound
  async postRun() {
    await store.TripStore.parseTrips((trip, p) => {
      const percentage = Math.round((p + 1) / trip.pings.length * 100);
      this.simulator.setStatus(undefined, `Parsing trip [${percentage}%]`);
    });
  }

  async sendPing(ping) {
    await store.TripStore.OnLocationPing(ping, ping.timestamp);
    await Scenario.delay(0);
  }

  @action.bound
  async run() {
    await this.preRun();
    const [ homeRegion ] = await Location.geocodeAsync(`${this.data.country}, ${this.data.city}`);
    if (!homeRegion) {
      throw new Scenario.CScenarioError(`Scenario type is set to '${this.data.type}' but could not find a region at location '${this.data.country}, ${this.data.city}'`);
    }
    await store.TripStore.OnRegionLeave(homeRegion, this.firstScenarioPing.timestamp - (this.data.interval * 1000));
    await this._run();
    await store.TripStore.OnRegionEnter(homeRegion, this.lastScenarioPing.timestamp + (this.data.interval * 1000));
    await this.postRun();
  }
}

export default ScenarioReal;