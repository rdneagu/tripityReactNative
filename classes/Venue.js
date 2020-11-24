/* Community packages */
import { observable, action } from 'mobx';

/* App library */
import Realm from '../lib/realm';
import logger from '../lib/log';

class CVenueError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CVenueError';
  }
}

/**
 * Class definition for the Photo
 */
class Photo {
  @observable venueId;
  @observable name;
  @observable category;
  @observable contact = null;
  @observable location = null;
  @observable url = null;
  @observable description = null;
  @observable hours = null;

  constructor(props) {
    this.setProperties(props);
  }

  @action.bound
  setVenueId(venueId) {
    this.venueId = venueId || this.venueId;
  }

  @action.bound
  setName(name) {
    this.name = name || this.name;
  }

  @action.bound
  setCategory(category) {
    this.category = category || this.category;
  }

  @action.bound
  setContact(contact) {
    this.contact = JSON.parse(contact);
  }

  @action.bound
  setLocation(location) {
    this.location = JSON.parse(location);
  }

  @action.bound
  setURL(url) {
    this.url = url;
  }

  @action.bound
  setDescription(description) {
    this.description = JSON.parse(description);
  }

  @action.bound
  setHours(hours) {
    this.hours = JSON.parse(hours);
  }

  @action.bound
  setProperties(props) {
    try {
      this.setVenueId(props.venueId);
      this.setName(props.name);
      this.setCategory(props.category);
      this.setContact(props.contact);
      this.setLocation(props.location);
      this.setURL(props.url);
      this.setDescription(props.description);
      this.setHours(props.hours);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  @action.bound
  reset() {
    try {
      const result = Realm.toJSON(Realm.db.objectForPrimaryKey('Venue', this.venueId));
      if (!result) {
        throw new CVenueError(`Could not reset the Venue (${this.venueId})`);
      }
      this.setProperties(result);
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  async save() {
    try {
      await Realm.write(realm => realm.create('Venue', {
        venueId: this.venueId,
        name: this.name,
        category: this.category,
        contact: JSON.stringify(this.contact),
        location: JSON.stringify(this.location),
        url: this.url,
        description: JSON.stringify(this.description),
        hours: JSON.stringify(this.hours),
      }, 'all'));
    } catch(err) {
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
    }
  }

  // @override
  toString() {
    return `{ Venue: ${_.map(Object.getOwnPropertyNames(new Venue), prop => this[prop]).join(', ')} }\n`;
  }
}

export default Photo;