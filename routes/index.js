/* React packages */
import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/* Expo packages */
import { Entypo, Ionicons } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';

/* App components */
import { NavigationBottom, NavigationBottomNovo } from '../components';

/* App library */
import store from '../store';

const slideOutIn = ({ current, next, layouts }) => {
  return {
    cardStyle: {
      left: -1, // -1 is required to remove the left gap
      width: layouts.screen.width + 1, // +1 is required to remove the gap between screens during transition
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
        {
          translateX: next
            ? next.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -layouts.screen.width],
              })
            : 1,
        },
      ],
    },
    // overlayStyle: {
    //   opacity: current.progress.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: [0, 0.5],
    //   }),
    // },
  };
};

const getStackOptions = (options = {}) => {
  return {
    headerMode: 'none',
    screenOptions: {
      cardStyleInterpolator: slideOutIn,
      cardStyle: { backgroundColor: 'transparent' },
      gestureEnabled: false,
      ...options.screenOptions,
    },
    ...options.general,
  }
}

import ScreenSplash from '../screens/Splash.screen.js';
class RootStack extends Component {
  #initialRoute = 'Screen.Splash';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenSplash,
    });
    store.Navigation.addScreen({
      name: 'Screen.Main',
      component: MainStack,
    });
    store.Navigation.addScreen({
      name: 'Screen.Auth',
      component: AuthStack,
    });
    store.Navigation.addScreen({
      name: 'Screen.Trip',
      component: TripStack,
    });
  }

  render() {
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
      }
    };

    const screens = store.Navigation.getScreens('Screen');
    return (
      <Stack.Navigator {...getStackOptions(options)}>
        {screens.map((screen, i) => <Stack.Screen key={i} name={screen.name} component={screen.component} />)}
      </Stack.Navigator>
    )
  }
}

import ScreenMainTrips from '../screens/Main/Trips.screen.js';
import ScreenMainGrabPhotos from '../screens/Main/GrabPhotos.screen.js';
class MainStack extends Component {
  #initialRoute = 'Main.Tab.Trips';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenMainTrips,
      header: 'YOUR TRIPS',
      icon: <Entypo name="map" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Main.Tab.GrabPhotos',
      component: ScreenMainGrabPhotos,
      header: 'SIMULATOR',
      icon: <Ionicons name="md-photos" size={18} color="white" />,
      isTab: true,
    });
  }

  render() {
    const Tab = createBottomTabNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
        sceneContainerStyle: { backgroundColor: 'transparent' },
      }
    }

    const tabs = store.Navigation.getScreens('Main', true);
    console.log(this.props.navigation.dangerouslyGetState());
    return (
      <Tab.Navigator {...getStackOptions(options)} tabBar={props => <NavigationBottomNovo {...props} />}>
        {tabs.map((tab, i) => <Tab.Screen key={i} name={tab.name} component={tab.component} options={{
          tabBarIcon: tab.icon,
          parent: 'Screen.Main',
        }} />)}
      </Tab.Navigator>
    )
  }
}

import ScreenTripDetails from '../screens/Trip/Details.screen.js';
import ScreenTripItinerary from '../screens/Trip/Itinerary.screen.js';
class TripStack extends Component {
  #initialRoute = 'Trip.Tab.Details';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenTripDetails,
      header: 'TRIP DETAILS',
      icon: <Entypo name="location" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Trip.Tab.Itinerary',
      component: ScreenTripItinerary,
      header: 'TRIP ITINERARY',
      icon: <Entypo name="map" size={18} color="white" />,
      isTab: true,
    });
  }

  render() {
    const Tab = createBottomTabNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
        sceneContainerStyle: { backgroundColor: 'transparent' },
      }
    }

    const tabs = store.Navigation.getScreens('Trip', true);
    return (
      <Tab.Navigator {...getStackOptions(options)} tabBar={props => <NavigationBottomNovo {...props} />}>
        {tabs.map((tab, i) => <Tab.Screen key={i} name={tab.name} component={tab.component} options={{
          tabBarIcon: tab.icon,
          parent: 'Screen.Trip',
        }} />)}
      </Tab.Navigator>
    )
  }
}

import ScreenAuthLogin from '../screens/Auth/Login.screen.js';
import ScreenAuthRegister from '../screens/Auth/Register.screen.js';
import ScreenAuthCountry from '../screens/Auth/Country.screen.js';
import ScreenAuthPermissions from '../screens/Auth/Permissions.screen.js';
class AuthStack extends Component {
  #initialRoute = 'Auth.Login';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenAuthLogin,
      condition: () => !store.User.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Register',
      component: ScreenAuthRegister,
      condition: () => !store.User.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Country',
      component: ScreenAuthCountry,
      condition: () => !!store.User.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Permissions',
      component: ScreenAuthPermissions,
      condition: () => !!store.User.user,
    });
  }

  render() {
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
      }
    };

    const screens = store.Navigation.getScreens('Auth');
    return (
      <Stack.Navigator {...getStackOptions(options)}>
        {screens.map((screen, i) => <Stack.Screen key={i} name={screen.name} component={screen.component} />)}
      </Stack.Navigator>
    )
  }
}

export default function ReactNavigator() {
  return (
    <RootStack />
  )
}
