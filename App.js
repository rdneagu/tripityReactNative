/* React packages */
import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

/* Expo packages */
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Entypo, Ionicons, EvilIcons, Fontisto } from '@expo/vector-icons';

// MobX store
import store from './store';

/* React navigator */
import ReactNavigator from './navigator';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, Provider } from "mobx-react"

/* App library */
import TptyLog from './lib/log';
import TptyTasks from './lib/tasks';
import TptyTrip from './lib/trip';

/* Initialize location and geofencing tasks */
TptyTasks.defineLocationTask(({ data, error }) => {
  if (error) {
    return TptyLog.error(error.message);
  }
  if (data) {
    const { locations } = data;
    const lastLocation = locations[locations.length-1];
    if (lastLocation.timestamp + (60 * 1000) < Date.now()) {
      TptyLog.warn('Timestamp of the location ping is behind current time');
      TptyLog.warn(`Ping time: ${new Date(lastLocation.timestamp)}`);
      TptyLog.warn(`Current time: ${new Date(Date.now())}`);
      return;
    }
    // TptyTrip.OnLocationPing(lastLocation);
  }
});

TptyTasks.defineGeofencingTask(({ data: { eventType, region }, error }) => {
  if (error) {
    return TptyLog.error(error.message);
  }

  switch (eventType) {
    case Location.GeofencingEventType.Enter: 
      return TptyTrip.OnRegionEnter();
    case Location.GeofencingEventType.Exit:
      return TptyTrip.OnRegionLeave();
  }
});

@observer
class App extends React.Component {
  @observable assetsReady = false;

  @action.bound
  async loadAssets() {
    SplashScreen.preventAutoHideAsync();
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
    this.assetsReady = true;
    SplashScreen.hideAsync();
  }

  async componentDidMount() {
    try {
      await TptyTasks.stopLocationUpdates();
      await this.loadAssets();
    } catch (e) {
      TptyLog.error(e);
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
