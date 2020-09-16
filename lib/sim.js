import * as Location from 'expo-location';

import TptyTrip from './trip';
import logger from './log';

const INTERVAL = 900 + 1;

/**
 * Case 1: Set Home Country to United Kingdom, London
 */
const tripCase = [
  { 
    homeCountry: 'United Kingdom',
    homeCity: 'London',
    pings: [
      { latitude: 50.482253, longitude: -1.462365 },
      { latitude: 47.350282, longitude: -3.846398 },
      { latitude: 43.105309, longitude: -4.472619 },
      { latitude: 40.497810, longitude: -3.568886 },
      { latitude: 40.631867, longitude: -3.159473 },
      { latitude: 40.592773, longitude: -3.099392 },
      { latitude: 40.567204, longitude: -3.065847 },
      { latitude: 40.559379, longitude: -2.900144, timestampOffset: 30 },
      { latitude: 40.509802, longitude: -2.785474 },
      { latitude: 40.370792, longitude: -2.450391 },
      { latitude: 40.133921, longitude: -2.244398 },
      { latitude: 40.074837, longitude: -2.135098 },
      { latitude: 39.680191, longitude: -1.921371, timestampOffset: 15 },
      { latitude: 39.546891, longitude: -1.510757 },
      { latitude: 39.504520, longitude: -1.107010 },
      { latitude: 39.469744, longitude: -0.424913 },
      { latitude: 39.457882, longitude: -0.346175 },
      { latitude: 39.491630, longitude: -0.474142, timestampOffset: 345 },
      { latitude: 40.774866, longitude: 4.400616, timestampOffset: 30 },
      { latitude: 41.354693, longitude: 8.795147 },
      { latitude: 41.952513, longitude: 12.504395 },
      { latitude: 41.945706, longitude: 12.521754 },
      { latitude: 41.752291, longitude: 12.708956, timestampOffset: 45 },
      { latitude: 41.765272, longitude: 12.955370 },
      { latitude: 41.661864, longitude: 13.224496, timestampOffset: 60 },
      { latitude: 41.548910, longitude: 13.462076 },
      { latitude: 41.458404, longitude: 13.796472 },
      { latitude: 41.374985, longitude: 14.009332 },
      { latitude: 41.189164, longitude: 14.156696 },
      { latitude: 40.866375, longitude: 14.296949 },
      { latitude: 40.882738, longitude: 14.291067, timestampOffset: 300 },
      { latitude: 40.088526, longitude: 16.846821, timestampOffset: 30 },
      { latitude: 39.234327, longitude: 19.472554 },
      { latitude: 37.936535, longitude: 23.946474 },
      { latitude: 37.980658, longitude: 23.908687 },
      { latitude: 37.981394, longitude: 23.909271 },
      { latitude: 37.982436, longitude: 23.921529 },
      { latitude: 37.978172, longitude: 23.918233, timestampOffset: 225 },
      { latitude: 37.995667, longitude: 23.869599, timestampOffset: 30 },
      { latitude: 38.011358, longitude: 23.810891 },
      { latitude: 37.993638, longitude: 23.775872 },
      { latitude: 37.968454, longitude: 23.728515, timestampOffset: 30 },
      { latitude: 37.971499, longitude: 23.725725 },
      { latitude: 37.973377, longitude: 23.717979, timestampOffset: 15 },
      { latitude: 37.957181, longitude: 23.701322, timestampOffset: 15 },
      { latitude: 38.011678, longitude: 23.665481, timestampOffset: 15 },
      { latitude: 38.011885, longitude: 23.665036 },
      { latitude: 38.011518, longitude: 23.664634 },
      { latitude: 38.020191, longitude: 23.643531 },
      { latitude: 38.014263, longitude: 23.636123, timestampOffset: 195 },
      { latitude: 38.029120, longitude: 23.597832, timestampOffset: 15 },
      { latitude: 38.035846, longitude: 23.593798 },
      { latitude: 38.056462, longitude: 23.549424 },
      { latitude: 38.306897, longitude: 21.678476, timestampOffset: 15 },
      { latitude: 38.800908, longitude: 19.937143 },
      { latitude: 40.755306, longitude: 13.056955 },
      { latitude: 44.941217, longitude: 6.333323 },
      { latitude: 48.813860, longitude: 1.499338 },
    ]
  },
];

const generateTime = (initialTime, pings) => {
  let previousTimestamp = initialTime;
  for (let i = 0; i < pings.length; i++) {
    const timestampOffset = ((pings[i].timestampOffset || 0) * 60 * 1000 || 0);
    const intervalAddition = (INTERVAL * 1000);
    const currentTimestamp = previousTimestamp + timestampOffset + intervalAddition;
    pings[i].timestamp = currentTimestamp;
    logger.debug(`Time for ping ${i}:`, new Date(currentTimestamp));
    previousTimestamp = currentTimestamp;
  }
}

export const run = async () => {
  try {
    logger.info('Running simulator');
    for (let i = 0; i < tripCase.length; i++) {
      const trip = tripCase[i];

      const initialTime = Date.now();
      generateTime(initialTime, trip.pings);

      const [ homeRegion ] = await Location.geocodeAsync(`${trip.homeCountry}, ${trip.homeCity}`);
      logger.debug('Home Region:', homeRegion);
      await TptyTrip.OnRegionLeave(homeRegion, initialTime);
      for (let j = 0; j < trip.pings.length; j++) {
        const ping = { 
          coords: {
            latitude: trip.pings[j].latitude,
            longitude: trip.pings[j].longitude,
          },
          timestamp: trip.pings[j].timestamp,
        };
        await TptyTrip.OnLocationPing(ping, ping.timestamp);
      }
      await TptyTrip.OnRegionEnter(homeRegion, trip.pings[trip.pings.length - 1].timestamp + (INTERVAL * 1000));
    }
    logger.success('Simulator finished successfully');
  } catch(err) {
    logger.error('Simulator failed with error ->', err);
  }
}
