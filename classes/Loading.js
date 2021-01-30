/* Community packages */
import { observable, action, computed } from 'mobx';

/* App classes */
import LoadingQueue from './LoadingQueue';

/* App library */
import logger from '../lib/log';

const LOADING_STATUS = {
  FAILED: -1,
  PENDING: 0,
  FINISHED: 1,
}

const DEFAULT_MESSAGE = 'Loading';
const FAILED_MESSAGE = 'Loading has failed, cannot continue';

class Loading {
  @observable queue = {
    foreground: new LoadingQueue(),
    background: new LoadingQueue(),
  };

  getQueue(type) {
    return this.queue[type];
  }
}

export default new Loading();
