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
  @observable photoId;
  @observable uri;
  @observable s3;
  @observable thumbnail;

  constructor(props) {
    this.setProperties(props);
  }

  @action.bound
  setPhotoId(photoId) {
    this.photoId = photoId || this.photoId;
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
      this.setPhotoId(props.photoId);
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
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('Photo', this.photoId));
      if (!result) {
        throw new CPhotoError(`Could not reset the Photo (${this.photoId})`);
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
        photoId: this.photoId,
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
    return `{ Photo: ${_.map(Object.getOwnPropertyNames(new Photo), prop => this[prop]).join(', ')} }\n`;
  }
}

export default Photo;