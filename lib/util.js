/**
 * Merges existing props from an object into another object, it mutates the object
 */
function mergeExistingProps(mergeObject, withObject) {
  for (const key of Object.keys(withObject)) {
    if (mergeObject.hasOwnProperty(key)) {
      mergeObject[key] = withObject[key];
    }
  }
}

export default {
  mergeExistingProps
};