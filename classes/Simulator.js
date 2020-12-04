/* Expo packages */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

/* Community packages */
import * as yaml from 'js-yaml';
import { observable, action } from 'mobx';

/* App classes */
import Scenario from './Scenario';
import ScenarioCoords from './ScenarioCoords';
import ScenarioReal from './ScenarioReal';

/* App library */
import logger from '../lib/log';
import ScenarioMedia from './ScenarioMedia';

class CSimulatorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CSimulatorError';
  }
}

/**
 * Class definition for the Simulator
 */
class Simulator {
  static SCENARIO_TYPES = {
    'coords': ScenarioCoords,
    'real': ScenarioReal,
    'media': ScenarioMedia,
  }
  static STATUS_TYPES = {
    FAIL: -1,
    IDLE: 0,
    PENDING: 1,
    SUCCESS: 2,
  }

  @observable scenario;
  @observable status = Simulator.STATUS_TYPES.IDLE;
  @observable statusMsg = '';

  /**
   * Loads and attempts to create a scenario
   * 
   * @returns {Scenario}    - The created scenario
   */
  @action.bound
  async loadScenario() {
    const document = await DocumentPicker.getDocumentAsync();
    if (document.type === 'success') {
      this.setStatus(Simulator.STATUS_TYPES.PENDING, `Loading scenario: ${document.name} [0%]`);
      try {
        const result = await FileSystem.readAsStringAsync(document.uri);
        const ymlScenario = yaml.safeLoad(result);

        if (!ymlScenario) {
          throw new CSimulatorError(`Scenario "${document.name}" failed to load, please check the file contents`);
        }
        
        if (!Simulator.SCENARIO_TYPES[ymlScenario.type]) {
          const typesNum = Object.keys(Simulator.SCENARIO_TYPES);
          throw new CSimulatorError(`Scenario <type> must be a value from set {${typesNum.join(', ')}}. Found ${ymlScenario.type}`);
        }
        const scenario = new Simulator.SCENARIO_TYPES[ymlScenario.type](this, ymlScenario);
        this.scenario = scenario;
      } catch(err) {
        logger.error(`${err.name}: ${err.message}`);
        if (!err instanceof Scenario.CScenarioValueError) {
          logger.error(err.stack);
        }
        throw err;
      }
    }
  }

  @action.bound
  setScenario(scenario) {
    this.scenario = scenario;
  }

  @action.bound
  setStatus(code, msg) {
    this.status = code || this.status;
    this.statusMsg = msg;
  }

  @action.bound
  async run() {
    try {
      await this.loadScenario();
      await this.scenario.run();
      this.setStatus(Simulator.STATUS_TYPES.SUCCESS, "Simulator finished successfully!");
    } catch(err) {
      this.setStatus(Simulator.STATUS_TYPES.FAIL, err.message);
    }
  }
}

export default Simulator;