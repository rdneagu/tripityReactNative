import _ from 'lodash';

import logger from './log';

const form = {
  clean(form, clear=false) {
    _.forEach(form, (field) => {
      if (clear) {
        delete field.value;
      }
      delete field.error;
    });
  },

  async submit(form, fn) {
    this.clean(form);

    // Reduce the input fields to { 'fieldName': 'fieldValue' } to prepare it
    const data = _.reduce(form, (acc, field, key) => {
      acc[key] = field.value;
      return acc;
    }, {});

    try {
      return await fn(data);
    } catch(err) {
      if (err.response.status === 477) {
        _.forEach(err.response.data, (error, field) => {
          form[field].error = error[0];
        });
      } else {
        logger.error('form.submit >', err.response.data);
      }
    } 
  },
}

export default form;