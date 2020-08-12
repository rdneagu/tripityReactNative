import _ from 'lodash';

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
    } catch(e) {
      if (typeof(e) !== 'object')
        return alert(e);
  
      _.forEach(e.form, (error, field) => {
        form[field].error = error[0];
      });
    } 
  },
}

export default form;