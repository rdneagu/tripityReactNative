/* React packages */
import React from 'react';
import { Dimensions, StyleSheet, ImageBackground, SafeAreaView, View, FlatList, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
enableScreens();

/* Expo packages */
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { Entypo, Ionicons, EvilIcons, Fontisto, FontAwesome } from '@expo/vector-icons';

// MobX store
import store from './store/_index';

/* React routes */
import ReactRoutes from './routes';

/* Community packages */
import _ from 'lodash';
import { observable, action } from "mobx"
import { observer, Provider } from "mobx-react"

/* App library */
import TptyCipher from './lib/cipher';
import TptyTasks from './lib/tasks';
import logger from './lib/log';

/* App components */
import { OverlayLoading, Dialog, StyledText } from './components';

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
    store.TripStore.OnLocationPing(lastLocation);
  }
});

TptyTasks.defineGeofencingTask(async ({ data: { eventType, region }, error }) => {
  if (error) {
    logger.error('TptyTasks.defineGeofencingTask >', error.message);
    return;
  }

  if (!store.UserStore.getLastLogged()) {
    await store.UserStore.stopHomeGeofencing();
    return;
  }

  switch (eventType) {
    case Location.GeofencingEventType.Enter: 
      return store.TripStore.OnRegionEnter(region);
    case Location.GeofencingEventType.Exit:
      return store.TripStore.OnRegionLeave(region);
  }
});

@observer
class App extends React.Component {
  @observable assetsReady = false;

  @action.bound
  async loadAssets() {
    logger.info('App > Loading assets');
    SplashScreen.preventAutoHideAsync();
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
      ...FontAwesome.font,
      'Nunito-Light': require('./assets/fonts/Nunito-Light.ttf'),
      'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
      'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
      'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
      'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
      'FiraMono-Regular': require('./assets/fonts/FiraMono-Regular.ttf'),
      'FiraMono-Medium': require('./assets/fonts/FiraMono-Medium.ttf'),
      'FiraMono-Bold': require('./assets/fonts/FiraMono-Bold.ttf'),
    });
    this.assetsReady = true;
    logger.success('App > Assets loaded');
    SplashScreen.hideAsync();
  }

  async componentDidMount() {
    try {
      await this.loadAssets();
    } catch (err) {
      logger.error('App.componentDidMount >', err?.message || err);
    }
  }

  showLogs = () => {
    store.Dialog.showDialog({
      title: 'Logs',
      component: <Logs />,
      onCancel: {
        text: 'Clear',
        fn: () => logger.clear(),
      },
      onConfirm: {
        text: 'Close',
      },
    })
  }

  render() {
    if (!this.assetsReady) {
      return null;
    } else {
      return (
        <NavigationContainer ref={store.Navigation.navigationRef} onReady={store.OnApplicationReady} onStateChange={store.Navigation.OnStateChange}>
          <SafeAreaView style={styles.main}>
            <StatusBar hidden />
            <ImageBackground source={require('./assets/images/tripity_bg.png')} style={styles.background} />
            <Provider store={store}>
              <ReactRoutes />
            </Provider>
            <OverlayLoading />
            <Dialog />
            <TouchableOpacity style={styles.bug} onPress={this.showLogs}>
              <Ionicons name="ios-bug" size={20} color='white' />
            </TouchableOpacity>
          </SafeAreaView>
        </NavigationContainer>
      )
    }
  }
}

class Logs extends React.PureComponent {
  renderLogItem = ({ item }) => {
    const bgColor = (item.id % 2) == 0 ? '#383838' : 'transparent';
    return (
      <View style={{ paddingVertical: 2 }}>
        <Text style={{ fontFamily: 'FiraMono-Regular', fontSize: 12, color: item.color, backgroundColor: bgColor }}>{item.id + 1} {item.msg}</Text>
      </View>
    )
  }

  render() {
    return (
      <View style={{ maxHeight: Dimensions.get('window').height - 300 }}>
        <FlatList
          data={logger.logs.toJS()}
          renderItem={this.renderLogItem}
          keyExtractor={item => (item.id + 1).toString()}
          ListEmptyComponent={
            <View style={{ alignItems: 'center' }}>
              <StyledText style={{ marginBottom: 10 }} weight="semibold">No logs found</StyledText>
            </View>
          }
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  bug: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});

export default App;
