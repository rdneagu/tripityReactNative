/* Community packages */
import { observable, action } from 'mobx';

/* App library */
import Realm from '../lib/realm';
import logger from '../lib/log';

class CPhotoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CPhotoError';
  }
}

/**
 * Class definition for the Photo
 */
class Photo {
  @observable id;
  @observable hash;
  @observable uri;
  @observable s3;
  @observable thumbnail;

  constructor(props) {
    this.setProperties(props);
  }

  @action.bound
  setId(id) {
    this.id = id || this.id;
  }

  @action.bound
  setHash(hash) {
    this.hash = hash || this.hash;
  }

  @action.bound
  setURI(uri) {
    this.uri = uri || this.uri;
  }

  @action.bound
  setS3(s3) {
    this.s3 = s3 || this.s3;
  }

  @action.bound
  setThumbnail(thumbnail) {
    this.thumbnail = thumbnail || this.thumbnail;
  }

  @action.bound
  setProperties(props) {
    try {
      this.setId(props.id);
      this.setHash(props.hash);
      this.setURI(props.uri);
      this.setS3(props.s3);
      this.setThumbnail(props.thumbnail);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  @action.bound
  reset() {
    try {
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('Photo', this.hash));
      if (!result) {
        throw new CPhotoError(`Could not reset the Photo (${this.hash})`);
      }
      this.setProperties(result);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async save() {
    try {
      await Realm.write(realm => realm.create('Photo', {
        id: this.id,
        hash: this.hash,
        uri: this.uri,
        s3: this.s3,
        thumbnail: this.thumbnail,
      }, 'all'));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  // @override
  toString() {
    const props = Object.keys(this).filter(k => this[k]);
    return `{ Photo: ${props.map(prop => {
      if (this[prop]) {
        return `${prop}=${this[prop].toString()}`;
      }
    }).join(', ')} }\n`;
  }
}

export default Photo;