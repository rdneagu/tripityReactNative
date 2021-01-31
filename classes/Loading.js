/* Community packages */
import { observable, action, computed } from 'mobx';

/* App classes */
import LoadingQueue from './LoadingQueue';

/* App library */
import logger from '../lib/log';

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
