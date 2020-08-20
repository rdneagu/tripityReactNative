import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import TptyLog from './log';

const DISTANCE = 0.2; // km
const INTERVAL = 900; // seconds
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

  async startLocationUpdates(accuracy='High', interval=INTERVAL, distance=DISTANCE) {
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
        TptyLog.success('Tracking location in background');
        TptyLog.info(`Accuracy: ${accuracy} seconds`);
        TptyLog.info(`Interval: ${interval} seconds`);
      }
    } catch(e) {
      TptyLog.error(e);
    }
  }

  async stopLocationUpdates() {
    TptyLog.debug('Stopping location updates');
    const isTracking = await Location.hasStartedLocationUpdatesAsync(TASKS.LOCATION);
    if (isTracking) {
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

  async startGeofencing() {
    try {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        throw 'No permissions to track location in background';
      }
      const isTracking = await Location.hasStartedGeofencingAsync(TASKS.GEOFENCING);
      if (!isTracking) {
        const regions = [{
          latitude: 55.860916,
          longitude: -4.251433,
          radius: 20000,
        }];
        await Location.startGeofencingAsync(TASKS.GEOFENCING, regions);
        TptyLog.success('Geofencing service started in background');
        regions.forEach((region) => {
          TptyLog.info(`Geofencing ${region.latitude} lat, ${region.longitude} lon, ${region.radius} meter radius`);
        });
      }
    } catch(e) {
      TptyLog.error(e);
    }
  }

  async stopGeofencing() {
    const isTracking = await Location.hasStartedGeofencingAsync(TASKS.GEOFENCING);
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

    TptyLog.debug('Task list: ');
    TptyLog.debug(tasks);
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
              TptyLog.info(`Registering task: ${taskName}`);
              await BackgroundFetch.registerTaskAsync(taskName, {
                minimumInterval: INTERVAL,
                stopOnTerminate: false,
                startOnBoot: true,
              });

              tasks = await TaskManager.getRegisteredTasksAsync();
            } else {
              TptyLog.info(`Task ${taskName} already registered`);
            }

            TptyLog.debug('Task list:');
            TptyLog.debug(tasks);

            TptyLog.console(`Setting interval time to ${INTERVAL} seconds`);
            await BackgroundFetch.setMinimumIntervalAsync(INTERVAL);
          }
      }
    } catch(e) {
      TptyLog.error('Failed registering task, see error below');
      TptyLog.error(e);
    }
  }
}

export default new TptyTasks();
