/* Community packages */
import { observable, action, computed } from 'mobx';

/* App library */
import logger from '../lib/log';

export const LOADING_STATES = {
  FAILED: -1,
  PENDING: 0,
  FINISHED: 1,
}

class LoadingQueue {
  @observable queue = [];
  
  @action.bound
  exists(id) {
    for (let i = 0; i < this.queue.length; i++) {
      if (id === this.queue[i].id) {
        return true;
      }
    }
    return false;
  }

  @action.bound
  add({ id, initialMessage, action, tryLimit=-1 }={}) {
    if (this.exists(id)) {
      logger.error(`Multiple loader instances are forbidden! Constraint failed for '${id}'`);
      return;
    }

    this.queue.push({
      id,
      message: initialMessage,
      tryLimit,
      tryTimes: 0,
      run: async () => {
        try {
          this.active.startTz = Date.now();
          this.active.tryTimes++;
          this.active.message = initialMessage;
          this.active.state = LOADING_STATES.PENDING;
          await action(this.update, this.fail);
          this.success(initialMessage);
        } catch (e) {
          this.fail(e);
        }
      },
    })

    if (this.queue.length === 1) {
      this.next();
    }
  }

  @action.bound
  next() {
    if (this.queue.length) {
      this.active.run();
    }
  }

  @action.bound
  update(message) {
    this.active.message = message;
  }

  @action.bound
  fail(e) {
    logger.error(e);
    this.active.state = LOADING_STATES.FAILED;
    this.active.message = e?.message || e;
    if (this.active.tryLimit === 0 || this.active.tryTimes < this.active.tryLimit) {
      setTimeout(this.active.run.bind(this), 5000);
    } else {
      setTimeout(this.finish.bind(this), 3000);
    }
  }

  @action.bound
  success(message) {
    this.active.message = message || this.active.message;
    this.active.state = LOADING_STATES.FINISHED;
    this.finish();
  }

  @action.bound
  finish() {
    setTimeout(() => {
      this.queue.shift();
      this.next();
    }, 2000);
  }

  @computed
  get active() {
    if (this.queue.length) {
      return this.queue[0];
    }
    return null;
  }
}

export default LoadingQueue;
