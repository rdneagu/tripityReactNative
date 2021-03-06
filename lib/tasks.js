// Expo packages
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// App library
import logger from './log';

// Lib constants
const PING_DISTANCE = 0.2; // km
const PING_INTERVAL = 900; // seconds
const TASKS = {
  LOCATION: 'com.advisosolutions.tripity.rn.ios.location',
  GEOFENCING: 'com.advisosolutions.tripity.rn.ios.geofencing',
}

class TptyTasks {
  defineTask(taskName, task) {
    TaskManager.defineTask(taskName, task);
  }

  defineLocationTask(task) {
    this.defineTask(TASKS.LOCATION, task);
  }

  async startLocationUpdates(accuracy='High', interval=PING_INTERVAL, distance=PING_DISTANCE) {
    try {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        throw 'No permissions to track location in background';
      }
      const isTracking = await Location.hasStartedLocationUpdatesAsync(TASKS.LOCATION);
      if (!isTracking) {
        await Location.startLocationUpdatesAsync(TASKS.LOCATION, {
          accuracy: Location.Accuracy[accuracy],
          timeInterval: interval * 1000,
          distanceInterval: distance * 1000,
          deferredUpdatesInterval: interval * 1000,
        });
        logger.success('Tracking location in background');
        logger.info(`Accuracy: ${accuracy} seconds`);
        logger.info(`Interval: ${interval} seconds`);
      }
    } catch(err) {
      logger.error('TptyTasks.startLocationUpdates >', err?.message || err);
    }
  }

  async stopLocationUpdates() {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(TASKS.LOCATION);
    if (isTracking) {
      logger.debug('Stopping location updates');
      await Location.stopLocationUpdatesAsync(TASKS.LOCATION);
    }
  }

  async restartLocationUpdates(accuracy, interval) {
    await this.stopLocationUpdates();
    await this.startLocationUpdates(accuracy, interval);
  }

  defineGeofencingTask(task) {
    this.defineTask(TASKS.GEOFENCING, task);
  }

  async isGeofencingStarted() {
    return await Location.hasStartedGeofencingAsync(TASKS.GEOFENCING);
  }

  async startGeofencing(regions) {
    try {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        throw 'No permissions to track location in background';
      }

      const isTracking = await this.isGeofencingStarted();
      if (!isTracking) {
        await Location.startGeofencingAsync(TASKS.GEOFENCING, regions);
        logger.success('Geofencing service started in background');
        regions.forEach((region) => {
          logger.info(`Geofence: ${region.latitude} lat, ${region.longitude} lon, ${region.radius} meter radius`);
        });
      }
    } catch(err) {
      logger.error('TptyTasks.startGeofencing >', err?.message || err);
    }
  }

  async stopGeofencing() {
    const isTracking = await this.isGeofencingStarted();
    if (isTracking) {
      await Location.stopGeofencingAsync(TASKS.GEOFENCING);
    }
  }

  async restartGeofencing(regions) {
    await this.stopGeofencing();
    await this.startGeofencing(regions);
  }

  async listTasks() {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    logger.debug('Task list:');
    tasks.forEach(t => logger.debug(t));
  }

  async registerFetchTask(taskName, task) {
    try {
      await TaskManager.unregisterAllTasksAsync();
      TaskManager.defineTask(taskName, task);

      const status = await BackgroundFetch.getStatusAsync();
      switch (status) {
        case BackgroundFetch.Status.Restricted:
        case BackgroundFetch.Status.Denied:
            throw "Background execution is not allowed";

        default: {
            let tasks = await TaskManager.getRegisteredTasksAsync();
            if (tasks.find(f => f.taskName === taskName) == null) {
              logger.info(`Registering task: ${taskName}`);
              await BackgroundFetch.registerTaskAsync(taskName, {
                minimumInterval: INTERVAL,
                stopOnTerminate: false,
                startOnBoot: true,
              });

              tasks = await TaskManager.getRegisteredTasksAsync();
            } else {
              logger.info(`Task ${taskName} already registered`);
            }

            logger.debug('Task list:');
            tasks.forEach(t => logger.debug(t));

            logger.console(`Setting interval time to ${INTERVAL} seconds`);
            await BackgroundFetch.setMinimumIntervalAsync(INTERVAL);
          }
      }
    } catch(err) {
      logger.error('TptyTasks.registerFetchTask >', err?.message || err);
    }
  }
}

export default new TptyTasks();
