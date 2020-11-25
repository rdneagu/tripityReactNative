/* Community packages */
import _ from 'lodash';
import { observable, action, computed } from 'mobx';

/* App library */
import AWS from '../lib/aws';
import logger from '../lib/log';

class CScenarioError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CScenarioError';
  }
}

/**
 * Class definition for the Scenario
 */
class Scenario {
  static CScenarioError = CScenarioError;
  @observable simulator;
  @observable data = {};
  @observable result = {
    pings: [],
  };
  @observable startTimestamp = Date.now();
  @observable endTimestamp;

  constructor(sim, props) {
    if (props.name === null) {
      throw new CScenarioError('Scenario <name> is missing');
    }

    if (!props.pings.length) {
      throw new CScenarioError('Scenario <pings> are missing');
    }

    for (let i = 0; i < props.pings.length; i++) {
      const percentage = Math.round((i + 1) / props.pings.length * 100);
      sim.setStatus(undefined, `Verifying scenario pings [${percentage}%]`);

      const { latitude, longitude, altitude, timeOffset } = props.pings[i];
      if (_.isNaN(latitude)) {
        throw new CScenarioError(`Ping (${i}) <latitude> is not a number. Found ${latitude}`);
      }
      if (_.isNaN(longitude)) {
        throw new CScenarioError(`Ping (${i}) <longitude> is not a number. Found ${longitude}`);
      }
      if (_.isNaN(altitude) && altitude !== null) {
        props.pings[i].altitude = 0;
      }
      if (_.isNaN(timeOffset) && timeOffset !== null) {
        props.pings[i].timeOffset = 15;
      }
    }

    this.simulator = sim;
    this.startTimestamp = Date.now();
    this.data = props;
  }

  @computed
  get name() {
    return this.data.name;
  }

  @computed
  get type() {
    return this.data.type;
  }

  @computed
  get lastScenarioPing() {
    return this.data.pings[this.data.pings.length - 1];
  }

  @computed
  get firstScenarioPing() {
    return this.data.pings[0];
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchVenue(ping, all=false) {
    return await AWS.invokeAPI(`/venues${all ? '/all' : ''}`, {
      params: {
        latitude: ping.latitude,
        longitude: ping.longitude,
        altitude: ping.altitude,
      }
    });
  }

  async _sendPing(ping, p) {
    const percentage = Math.round((p + 1) / this.data.pings.length * 100);
    this.simulator.setStatus(undefined, `Sending pings [${percentage}%]`);
    try {
      await this.sendPing(ping);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
      logger.debug('Automatic retry in 5 seconds');
      await Scenario.delay(5000);
      await this._sendPing(ping, p);
    }
  }

  async _run() {
    const pings = this.data.pings;
    for (let i = 0; i < pings.length; i++) {
      await this._sendPing(pings[i], i);
    }
  }

  // @override
  toString() {
    return `{ Scenario: ${Object.getOwnPropertyNames(new Scenario).map(prop => this[prop]).join(', ')} }\n`;
  }
}

export default Scenario;