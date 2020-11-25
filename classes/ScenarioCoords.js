/* Community packages */
import { action } from 'mobx';

/* App classes */
import Scenario from './Scenario';

/* App library */
import logger from '../lib/log';

/**
 * Class definition for the ScenarioCoords
 */
class ScenarioCoords extends Scenario {
  constructor(sim, props) {
    super(sim, props);
  }

  @action.bound
  async sendPing(ping) {
    const venues = await this.fetchVenue(ping, true);
    this.result.pings.push({
      key: this.result.pings.length,
      latitude: ping.latitude,
      longitude: ping.longitude,
      venues,
      expectedVenue: ping.expectedVenue,
    })
    await Scenario.delay(2500);
  }

  @action.bound
  async run() {
    await this._run();
  }
}

export default ScenarioCoords;