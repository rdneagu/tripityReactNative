/* React packages */
import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

/* Expo packages */
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { Entypo, Ionicons, EvilIcons, Fontisto } from '@expo/vector-icons';

// MobX store
import store from './store';

/* React routes */
import ReactRoutes from './routes';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, Provider } from "mobx-react"

/* App library */
import TptyCipher from './lib/cipher';
import logger from './lib/log';
import TptyTasks from './lib/tasks';
import TptyTrip from './lib/trip';

/* App components */
import { OverlayLoading } from './components';

/* Initialize location and geofencing tasks */
TptyTasks.defineLocationTask(async ({ data, error }) => {
  if (error) {
    return logger.error(error.message);
  }

  if (data) {
    const { locations } = data;
    const lastLocation = locations[locations.length-1];
    if (lastLocation.timestamp + (60 * 1000) < Date.now()) {
      logger.warn('Timestamp of the location ping is behind current time');
      logger.warn(`Ping time: ${new Date(lastLocation.timestamp)}`);
      logger.warn(`Current time: ${new Date(Date.now())}`);
      return;
    }
    TptyTrip.OnLocationPing(lastLocation);
  }
});

TptyTasks.defineGeofencingTask(async ({ data: { eventType, region }, error }) => {
  if (error) {
    logger.error(error.message);
    return;
  }

  if (!store.UserStore.getLastLogged()) {
    await store.UserStore.stopHomeGeofencing();
    return;
  }

  switch (eventType) {
    case Location.GeofencingEventType.Enter: 
      return TptyTrip.OnRegionEnter(region);
    case Location.GeofencingEventType.Exit:
      return TptyTrip.OnRegionLeave(region);
  }
});

@observer
class App extends React.Component {
  @observable assetsReady = false;

  @action.bound
  async loadAssets() {
    // SplashScreen.preventAutoHideAsync();
    // Generate encryption key
    await TptyCipher.generateKey();
    // Load assets
    await Asset.loadAsync([
      require('./assets/images/tripity_bg.png'),
    ]);
    await Font.loadAsync({
      ...Ionicons.font,
      ...Entypo.font,
      ...EvilIcons.font,
      ...Fontisto.font,
      'Nunito-Light': require('./assets/fonts/Nunito-Light.ttf'),
      'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
      'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
      'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
      'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
    });
    this.assetsReady = true;
    // SplashScreen.hideAsync();
  }

  async componentDidMount() {
    try {
      await this.loadAssets();
    } catch (e) {
      logger.error(e);
    }
  }

  render() {
    if (!this.assetsReady) {
      return null;
    } else {
      return (
        <NavigationContainer ref={store.NavigationStore.navigationRef} onReady={store.OnApplicationReady} onStateChange={store.NavigationStore.OnStateChange}>
          <View style={styles.main}>
            <StatusBar hidden />
            <ImageBackground source={require('./assets/images/tripity_bg.png')} style={styles.background} />
            <Provider store={store}>
              <ReactRoutes />
            </Provider>
            <OverlayLoading />
          </View>
        </NavigationContainer>
      )
    }
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#00aaff',
  },
  background: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
});

export default App;
