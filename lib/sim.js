import * as Location from 'expo-location';

/* Community packages */
import { v4 as uuid_v4 } from 'uuid';

/* App library */
import TptyTrip from './trip';
import logger from './log';

const INTERVAL = 900 + 1;


/**
 * Name: <scenario_name>
 * Country: <country_name>
 * City: <city_name>
 * Ping: <latitude>,<longitude>,<altitude>,<time_offset(in minutes)>
 * Ping: <latitude>,<longitude>,<altitude>,<time_offset(in minutes)>
 * Ping: <latitude>,<longitude>,<altitude>,<time_offset(in minutes)>
 * Ping: <latitude>,<longitude>,<altitude>,<time_offset(in minutes)>
 */

/**
 * Case 1: Set Home Country to United Kingdom, London
 */
const tripCase = [
  { 
    homeCountry: 'United Kingdom',
    homeCity: 'London',
    pings: [
      { coords: { latitude: 50.482253, longitude: -1.462365, altitude: 3000 } },
      { coords: { latitude: 47.350282, longitude: -3.846398, altitude: 4000 } },
      { coords: { latitude: 43.105309, longitude: -4.472619, altitude: 5000 } },
      { coords: { latitude: 40.497810, longitude: -3.568886 } },
      { coords: { latitude: 40.631867, longitude: -3.159473 } },
      { coords: { latitude: 40.592773, longitude: -3.099392 } },
      { coords: { latitude: 40.567204, longitude: -3.065847 } },
      { coords: { latitude: 40.559379, longitude: -2.900144 }, timestampOffset: 30 },
      { coords: { latitude: 40.509802, longitude: -2.785474 } },
      { coords: { latitude: 40.370792, longitude: -2.450391 } },
      { coords: { latitude: 40.133921, longitude: -2.244398 } },
      { coords: { latitude: 40.074837, longitude: -2.135098 } },
      { coords: { latitude: 39.680191, longitude: -1.921371 }, timestampOffset: 15 },
      { coords: { latitude: 39.546891, longitude: -1.510757 } },
      { coords: { latitude: 39.504520, longitude: -1.107010 } },
      { coords: { latitude: 39.469744, longitude: -0.424913 } },
      { coords: { latitude: 39.457882, longitude: -0.346175 } },
      { coords: { latitude: 39.491630, longitude: -0.474142 }, timestampOffset: 345 },
      { coords: { latitude: 40.774866, longitude: 4.400616, altitude: 3000 }, timestampOffset: 30 },
      { coords: { latitude: 41.354693, longitude: 8.795147, altitude: 4000 } },
      { coords: { latitude: 41.952513, longitude: 12.504395 } },
      { coords: { latitude: 41.945706, longitude: 12.521754 } },
      { coords: { latitude: 41.752291, longitude: 12.708956 }, timestampOffset: 45 },
      { coords: { latitude: 41.765272, longitude: 12.955370 } },
      { coords: { latitude: 41.661864, longitude: 13.224496 }, timestampOffset: 60 },
      { coords: { latitude: 41.548910, longitude: 13.462076 } },
      { coords: { latitude: 41.458404, longitude: 13.796472 } },
      { coords: { latitude: 41.374985, longitude: 14.009332 } },
      { coords: { latitude: 41.189164, longitude: 14.156696 } },
      { coords: { latitude: 40.866375, longitude: 14.296949 } },
      { coords: { latitude: 40.882738, longitude: 14.291067 }, timestampOffset: 300 },
      { coords: { latitude: 40.088526, longitude: 16.846821, altitude: 3000 }, timestampOffset: 30 },
      { coords: { latitude: 39.234327, longitude: 19.472554, altitude: 4000 } },
      { coords: { latitude: 37.936535, longitude: 23.946474 } },
      { coords: { latitude: 37.980658, longitude: 23.908687 } },
      { coords: { latitude: 37.981394, longitude: 23.909271 } },
      { coords: { latitude: 37.982436, longitude: 23.921529 } },
      { coords: { latitude: 37.978172, longitude: 23.918233 }, timestampOffset: 225 },
      { coords: { latitude: 37.995667, longitude: 23.869599 }, timestampOffset: 30 },
      { coords: { latitude: 38.011358, longitude: 23.810891 } },
      { coords: { latitude: 37.993638, longitude: 23.775872 } },
      { coords: { latitude: 37.968454, longitude: 23.728515 }, timestampOffset: 30 },
      { coords: { latitude: 37.971499, longitude: 23.725725 } },
      { coords: { latitude: 37.973377, longitude: 23.717979 }, timestampOffset: 15 },
      { coords: { latitude: 37.957181, longitude: 23.701322 }, timestampOffset: 15 },
      { coords: { latitude: 38.011678, longitude: 23.665481 }, timestampOffset: 15 },
      { coords: { latitude: 38.011885, longitude: 23.665036 } },
      { coords: { latitude: 38.011518, longitude: 23.664634 } },
      { coords: { latitude: 38.020191, longitude: 23.643531 } },
      { coords: { latitude: 38.014263, longitude: 23.636123 }, timestampOffset: 195 },
      { coords: { latitude: 38.029120, longitude: 23.597832 }, timestampOffset: 15 },
      { coords: { latitude: 38.035846, longitude: 23.593798 } },
      { coords: { latitude: 38.056462, longitude: 23.549424 } },
      { coords: { latitude: 38.306897, longitude: 21.678476, altitude: 3000 }, timestampOffset: 15 },
      { coords: { latitude: 38.800908, longitude: 19.937143, altitude: 4000 } },
      { coords: { latitude: 40.755306, longitude: 13.056955, altitude: 5000 } },
      { coords: { latitude: 44.941217, longitude: 6.333323, altitude: 4000 } },
      { coords: { latitude: 48.813860, longitude: 1.499338, altitude: 3000 } },
    ]
  },
];

const generateTimeWithOffset = (initialTime, pings) => {
  let previousTimestamp = initialTime;
  return pings.map((ping, i) => {
    const timestampOffset = ((ping.timestampOffset || 0) * 60 * 1000);
    const intervalAddition = (INTERVAL * 1000);
    const currentTimestamp = previousTimestamp + timestampOffset + intervalAddition;
    logger.debug(`Time for ping ${i}:`, new Date(currentTimestamp));
    previousTimestamp = currentTimestamp;

    return {
      ...ping,
      altitude: 0,
      timestamp: currentTimestamp,
    };
  });
}

const prepareMediaPings = (pings) => {
  try {
    return pings.reduce((acc=[], value) => {
      const asset = {
        ...value,
        id: uuid_v4(),
        exif: {
          '{GPS}': {
            AltitudeRef: 0,
            Altitude: value.altitude,
          },
        },
      };
      acc.push(asset);
      if (value.timestampOffset) {
        let nOfPhotos = (value.timestampOffset / ((INTERVAL - 1) / 60)) + 1;
        for (let i = 0; i < nOfPhotos; i++) {
          acc.push({
            ...asset,
            id: uuid_v4(),
            timestamp: value.timestamp + ((i + 1) * 1000),
          });
        }
      }
      return acc;
    }, []);
  } catch(err) {
    logger.error('Runtime error @ prepareMediaPings').error(`[${err.name}] ${err.message}`);
  }
}

export const runMedia = async () => {
  try {
    logger.info('Running media simulator');
    for (let i = 0; i < tripCase.length; i++) {
      const trip = tripCase[i];

      const initialTime = Date.now();
      const assets = prepareMediaPings(generateTimeWithOffset(initialTime, trip.pings));
      logger.debug(assets);

      const [ homeRegion ] = await Location.geocodeAsync(`${trip.homeCountry}, ${trip.homeCity}`);
      logger.debug('Home Region:', homeRegion);

      await TptyTrip._sim_parseMedia(assets);
    }
    logger.success('Simulator finished successfully');
  } catch(err) {
    logger.error('runMedia failed').error(`[${err.name}] ${err.message}`);
  }
}

export const runPings = async () => {
  try {
    logger.info('Running simulator');
    for (let i = 0; i < tripCase.length; i++) {
      const trip = tripCase[i];

      const initialTime = Date.now();
      trip.pings = generateTimeWithOffset(initialTime, trip.pings);

      const [ homeRegion ] = await Location.geocodeAsync(`${trip.homeCountry}, ${trip.homeCity}`);
      logger.debug('Home Region:', homeRegion);
      await TptyTrip.OnRegionLeave(homeRegion, initialTime);
      for (let j = 0; j < trip.pings.length; j++) {
        await TptyTrip.OnLocationPing(trip.pings[j], trip.pings[j].timestamp);
      }
      await TptyTrip.OnRegionEnter(homeRegion, trip.pings[trip.pings.length - 1].timestamp + (INTERVAL * 1000));
    }
    logger.success('Simulator finished successfully');
  } catch(err) {
    logger.error('Simulator failed with error ->', err);
  }
}
