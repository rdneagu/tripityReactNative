/* React packages */
import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

/* Expo packages */
import { Entypo, Ionicons } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';

/* App components */
import { NavigationBottom } from '../components';

/* App library */
import store from '../store';

const slideOutIn = ({ current, next, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, -1],
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
  constructor() {
    super();

    store.Navigation.addScreen({
      name: 'Screen.Splash',
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
  }

  render() {
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: 'Screen.Splash',
      }
    };

    return (
      <Stack.Navigator {...getStackOptions(options)}>
        <Stack.Screen name="Screen.Splash" component={ScreenSplash} />
        <Stack.Screen name="Screen.Main" component={MainStack} />
        <Stack.Screen name="Screen.Auth" component={AuthStack} />
      </Stack.Navigator>
    )
  }
}

import ScreenMainTrips from '../screens/Main/Trips.screen.js';
import ScreenMainItinerary from '../screens/Main/Itinerary.screen.js';
import ScreenMainGrabPhotos from '../screens/Main/GrabPhotos.screen.js';
class MainStack extends Component {
  constructor() {
    super();

    store.Navigation.addScreen({
      name: 'Main.Tab.Trips',
      component: ScreenMainTrips,
      header: 'YOUR TRIPS',
      icon: <Entypo name="map" size={18} color="white" />,
      isTab: true,
    });
    store.Navigation.addScreen({
      name: 'Main.Tab.Itinerary',
      component: ScreenMainItinerary,
      header: 'ITINERARY',
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
    const Stack = createStackNavigator();
    const options = {
      general: {
        initialRouteName: 'Trips',
      }
    }

    const tabs = store.Navigation.getScreens('Main', true);
    return (
      <>
        <Stack.Navigator {...getStackOptions(options)}>
          {tabs.map((tab, i) => <Stack.Screen key={i} name={tab.name} component={tab.component} />)}
        </Stack.Navigator>
        <NavigationBottom tabs={tabs} />
      </>
    )
  }
}

import ScreenAuthLogin from '../screens/Auth/Login.screen.js';
import ScreenAuthRegister from '../screens/Auth/Register.screen.js';
import ScreenAuthCountry from '../screens/Auth/Country.screen.js';
import ScreenAuthPermissions from '../screens/Auth/Permissions.screen.js';
class AuthStack extends Component {
  constructor() {
    super();

    store.Navigation.addScreen({
      name: 'Auth.Login',
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
        initialRouteName: 'Login',
      }
    };

    return (
      <Stack.Navigator {...getStackOptions(options)}>
        {!store.User.user && <Stack.Screen name='Login' component={ScreenAuthLogin} />}
        {!store.User.user && <Stack.Screen name='Register' component={ScreenAuthRegister} />}
        <Stack.Screen name='Country' component={ScreenAuthCountry} />
        <Stack.Screen name='Permissions' component={ScreenAuthPermissions} />
      </Stack.Navigator>
    )
  }
}

export default function ReactNavigator() {
  return (
    <RootStack />
  )
}
