/* Community packages */
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

class CScenarioValueError extends Error {
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
  static CScenarioValueError = CScenarioValueError;
  @observable simulator;
  @observable data = {};
  @observable result = {
    pings: [],
  };
  @observable startTimestamp = Date.now();
  @observable endTimestamp;

  constructor(sim, props) {
    if (props.name === null) {
      throw new CScenarioValueError('Scenario <name> is missing');
    }

    if (!props.pings.length) {
      throw new CScenarioValueError('Scenario <pings> are missing');
    }

    for (let i = 0; i < props.pings.length; i++) {
      const percentage = Math.round((i + 1) / props.pings.length * 100);
      sim.setStatus(undefined, `Verifying scenario pings [${percentage}%]`);

      const { latitude, longitude, altitude, timeOffset, photos } = props.pings[i];
      if (!Number.isFinite(latitude)) {
        throw new CScenarioValueError(`Ping (${i}) <latitude> is not a number. Found ${latitude}`);
      }
      if (!Number.isFinite(longitude)) {
        throw new CScenarioValueError(`Ping (${i}) <longitude> is not a number. Found ${longitude}`);
      }
      if (!Number.isFinite(altitude)) {
        props.pings[i].altitude = 0;
      }
      if (!Number.isFinite(timeOffset)) {
        props.pings[i].timeOffset = 15;
      }
      if (props.type === 'media' && (!Number.isFinite(photos) || photos < 1)) {
        props.pings[i].photos = 1;
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
    const props = Object.keys(this).filter(k => this[k]);
    return `{ Scenario: ${props.map(prop => {
      if (this[prop]) {
        return `${prop}=${this[prop].toString()}`;
      }
    }).join(', ')} }\n`;
  }
}

export default Scenario;