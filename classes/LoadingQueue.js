/* Community packages */
import { observable, action, computed } from 'mobx';

/* App library */
import logger from '../lib/log';

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
  add({ id, message, action, retryLimit=-1 }={}) {
    if (this.exists(id)) {
      logger.error(`Multiple loader instances are forbidden! Constraint failed for '${id}'`);
      return;
    }

    this.queue.push({
      id,
      message,
      retryLimit,
      retryTimes: 0,
      run: async () => {
        try {
          await action(this.update, this.fail);
          this.finish();
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
      this.queue[0].run();
    }
  }

  @action.bound
  update(message) {
    this.active.message = message;
  }

  @action.bound
  fail(e) {
    logger.error(e);
    this.active.fail = e?.message || e;
    this.active.retryTimes++;
    if (this.active.retryLimit === 0 && this.active.retryTimes <= this.active.retryLimit) {
      setTimeout(() => this.next(), 5000);
    } else {
      this.finish();
    }
  }

  @action.bound
  finish() {
    this.active.message = `Success: ${this.active.message}`;
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
