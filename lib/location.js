/**
 * Gets distance in kilometers between two points
 */
function getDistanceBetweenPoints(from, to) {
  if (!from || !to) {
    return null;
  }
  const lat1 = from.latitude;
  const lon1 = from.longitude;
  const lat2 = to.latitude;
  const lon2 = to.longitude;
  // φ is latitude
  // λ is longitude
  // R is earth’s radius (mean radius = 6,371km)
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance / 1000;
}

/**
 * Gets time taken between two points
 */
function getTimeBetweenPoints(from, to) {
  if (!from || !to) {
    return null;
  }
  const t1 = from.timestamp;
  const t2 = to.timestamp;

  return (t2 - t1) / 1000;
}

export { getDistanceBetweenPoints, getTimeBetweenPoints };