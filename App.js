/* React packages */
import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

/* Expo packages */
import * as Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Entypo, Ionicons, EvilIcons, Fontisto } from '@expo/vector-icons';

/* React navigator */
import { ReactNavigator } from './navigator';

/* Community packages */
import _ from 'lodash';
import AWS from 'aws-sdk';
import { observable } from "mobx"
import { observer, Provider } from "mobx-react"

/* Tripity library */
import TptyLog from './lib/log';
import TptyTasks from './lib/tasks';

// Import mobx store
import store from './store';

/* Initialize location and geofencing tasks */
TptyTasks.defineLocationTask(({ data, error }) => {
  if (error) {
    return TptyLog.error(error.message);
  }
  if (data) {
    const { locations } = data;
    const date = new Date(locations[locations.length-1].timestamp);
    TptyLog.info(`${Constants.default.deviceName}: ${date}`);
  }
});

TptyTasks.defineGeofencingTask(({ data: { eventType, region }, error }) => {
  if (error) {
    return TptyLog.error(error.message);
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    TptyLog.info("You've entered region:", region);
    // Start location updates async, start trip
  } else if (eventType === Location.GeofencingEventType.Exit) {
    TptyLog.info("You've left region:", region);
    // Stop location updates async, finish trip
  }
});

/* Initialize AWS */
AWS.config.region = 'eu-west-2';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-2:90ab4a10-d197-4bea-bb99-a14427d1779d',
});

@observer
class App extends React.Component {
  @observable assetsLoading = true;

  async componentDidMount() {
    try {
      // Prevent splash screen to be hidden until hideAsync is called
      // SplashScreen.preventAutoHideAsync();

      await TptyTasks.startLocationUpdates();
      await TptyTasks.startGeofencing();
      await TptyTasks.listTasks();

      // Load fonts
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
    } catch (e) {
      TptyLog.warn(e);
    } finally {
      this.assetsLoading = false;
      // SplashScreen.hideAsync();
    }
  }

  render() {
    if (this.assetsLoading) {
      return null;
    } else {
      return (
        <NavigationContainer ref={store.NavigationStore.navigationRef} onReady={store.NavigationStore.OnReady} onStateChange={store.NavigationStore.OnStateChange}>
          <View style={styles.main}>
            <StatusBar hidden />
            <ImageBackground source={require('./assets/images/tripity_bg.png')} style={styles.background} />
            <Provider store={store}>
              <ReactNavigator />
            </Provider>
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
