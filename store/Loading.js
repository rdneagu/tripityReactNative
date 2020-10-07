/* Community packages */
import { observable, action, computed } from 'mobx';

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
  @observable loaders = [];
  @observable message = DEFAULT_MESSAGE;
  @observable status = LOADING_STATUS.FINISHED;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  createLoader(run, options={}) {
    const { message, failMessage, obligatory } = options;

    const loader = { run, message, failMessage, obligatory };
    this.addLoader([ loader ]);
  }
  
  @action.bound
  addLoader(loaders=[]) {
    if (this.status === LOADING_STATUS.FAILED) {
      logger.debug('Cannot add more loaders if an obligatory loading failed');
      return;
    }

    if (!loaders.length) {
      logger.debug('There must be at least a loader getting added');
      return;
    }
    
    logger.debug('Adding loaders:', loaders);
    for (let loader of loaders) {
      this.loaders.push(loader);
    }

    for (let i = 0; i < this.loaders.length - 1; i++) {
      if (!this.loaders[i].next) {
        this.loaders[i].next = this.loaders[i + 1];
      }
    }

    // If there are no loaders running, run the first one in the list
    if (this.status !== LOADING_STATUS.PENDING) {
      this.status = LOADING_STATUS.PENDING;

      this.runLoader(this.loaders[0]);
    }    
  }

  @action.bound
  async runLoader(loader) {
    // Attempt to run the loader, fail the loading if an obligatory loader threw an error
    try {
      this.message = loader.message || DEFAULT_MESSAGE;
      await loader.run();
      this.finishLoader();
    } catch(e) {
      if (loader.obligatory) {
        this.status = LOADING_STATUS.FAILED;
        this.message = `${loader.failMessage || FAILED_MESSAGE}: ${e.message}`;
        logger.error('An obligatory loader failed!').error(loader);
      }
    }

    // Run the next in queue loader if there is any left and an obligatory loader hasn't failed yet
    if (this.status !== LOADING_STATUS.FAILED) {
      if (loader.next) {
        logger.debug('Running next loader');
        await this.runLoader(loader.next);
      }

      // Change the loading status to finished
      this.status = LOADING_STATUS.FINISHED;
    }    
  }

  @action.bound
  finishLoader() {
    logger.debug('Loader finished');
    this.loaders.shift();
  }

  @computed
  get isVisible() {
    return this.loaders.length;
  }

  @computed
  get currentLoader() {
    if (this.loaders.length) {
      return this.loaders[0];
    }
    return null;
  }

  @computed
  get hasFailed() {
    return (this.status === LOADING_STATUS.FAILED);
  }
}

export default Loading;
