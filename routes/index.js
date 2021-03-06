/* React packages */
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

/* Expo packages */
import { Entypo, Ionicons, FontAwesome } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';

/* App components */
import { NavigationBottom, NavigationHeader } from '../components';

/* App library */
import store from '../store/_index';

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
      cardStyle: { backgroundColor: 'transparent', flex: 1 },
      gestureEnabled: false,
      ...options.screenOptions,
    },
    ...options.general,
  }
}

import ScreenSplash from '../screens/Splash.screen.js';
class RootStack extends PureComponent {
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
import ScreenMainSimulator from '../screens/Main/Simulator.screen.js';
import ScreenMainUserProfile from '../screens/Main/UserProfile.screen.js';
class MainStack extends PureComponent {
  #initialRoute = 'Main.Tab.Trips';

  constructor() {
    super();
    
    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenMainTrips,
      title: 'YOUR TRIPS',
      icon: <Entypo name="map" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Main.Tab.Simulator',
      component: ScreenMainSimulator,
      title: 'SIMULATOR',
      icon: <Ionicons name="ios-play" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Main.Tab.UserProfile',
      component: ScreenMainUserProfile,
      title: 'USER PROFILE',
      icon: <FontAwesome name="user" size={18} color="white" />,
      isTab: true,
      condition: () => store.UserStore.user,
    });
  }

  render() {
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
      }
    }

    const tabs = store.Navigation.getScreens('Main', true);
    return (
      <View style={{ flex: 1 }}>
        <NavigationHeader
          tabs={tabs.map(tab => ({
            name: tab.name,
            title: tab.title,
            icon: tab.icon,
          }))}
        />
        <Stack.Navigator {...getStackOptions(options)}>
          {tabs.map((tab, i) => <Stack.Screen key={i} name={tab.name} component={tab.component} />)}
        </Stack.Navigator>
        <NavigationBottom
          tabs={tabs.map(tab => ({
            name: tab.name,
            icon: tab.icon,
          }))}
        />
      </View>
    )
  }
}

import ScreenTripDetails from '../screens/Trip/Details.screen.js';
import ScreenTripItinerary from '../screens/Trip/Itinerary.screen.js';
class TripStack extends PureComponent {
  #initialRoute = 'Trip.Tab.Details';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenTripDetails,
      title: 'TRIP DETAILS',
      icon: <Entypo name="location" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Trip.Tab.Itinerary',
      component: ScreenTripItinerary,
      title: 'TRIP ITINERARY',
      icon: <Entypo name="map" size={18} color="white" />,
      isTab: true,
    });
  }

  render() {
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: this.#initialRoute,
        sceneContainerStyle: { backgroundColor: 'transparent' },
      }
    }

    const tabs = store.Navigation.getScreens('Trip', true);
    return (
      <View style={{ flex: 1 }}>
        <NavigationHeader
          tabs={tabs.map(tab => ({
            name: tab.name,
            title: tab.title,
            icon: tab.icon,
          }))}
        />
        <Stack.Navigator {...getStackOptions(options)}>
          {tabs.map((tab, i) => <Stack.Screen key={i} name={tab.name} component={tab.component} />)}
        </Stack.Navigator>
        <NavigationBottom
          tabs={tabs.map(tab => ({
            name: tab.name,
            icon: tab.icon,
            parent: 'Screen.Trip',
          }))}
        />
      </View>
    )
  }
}

import ScreenAuthLogin from '../screens/Auth/Login.screen.js';
import ScreenAuthRegister from '../screens/Auth/Register.screen.js';
import ScreenAuthCountry from '../screens/Auth/Country.screen.js';
import ScreenAuthPermissions from '../screens/Auth/Permissions.screen.js';
class AuthStack extends PureComponent {
  #initialRoute = 'Auth.Login';

  constructor() {
    super();

    store.Navigation.addScreen({
      name: this.#initialRoute,
      component: ScreenAuthLogin,
      condition: () => !store.UserStore.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Register',
      component: ScreenAuthRegister,
      condition: () => !store.UserStore.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Country',
      component: ScreenAuthCountry,
      condition: () => !!store.UserStore.user,
    });
    store.Navigation.addScreen({
      name: 'Auth.Permissions',
      component: ScreenAuthPermissions,
      condition: () => !!store.UserStore.user,
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
