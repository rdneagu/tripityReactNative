/* React packages */
import React from 'react';
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

import ScreenMainSplash from '../screens/Splash.screen.js';
function RootStack() {
  const Stack = createStackNavigator();
  const options = {
    general: {
      initialRouteName: 'Screen.Splash',
    }
  };
  return (
    <Stack.Navigator {...getStackOptions(options)}>
      <Stack.Screen name="Screen.Splash" component={ScreenMainSplash} />
      <Stack.Screen name="Screen.Main" component={MainStack} />
      <Stack.Screen name="Screen.Auth" component={AuthStack} />
    </Stack.Navigator>
  )
}

import ScreenMainItinerary from '../screens/Main/Itinerary.screen.js';
import ScreenMainGrabPhotos from '../screens/Main/GrabPhotos.screen.js';
function MainStack() {
  const Stack = createStackNavigator();
  const options = {
    general: {
      initialRouteName: 'Itinerary',
    }
  };
  const tabs = [
    {
      name: 'Itinerary',
      component: ScreenMainItinerary,
      icon: <Entypo name="map" size={18} color="white" />
    },
    {
      name: 'GrabPhotos',
      component: ScreenMainGrabPhotos,
      icon: <Ionicons name="md-photos" size={18} color="white" />
    },

  ]
  return (
    <>
      <Stack.Navigator {...getStackOptions(options)}>
        {tabs.map((tab, i) => <Stack.Screen key={i} name={tab.name} component={tab.component} />)}
      </Stack.Navigator>
      <NavigationBottom tabs={tabs} />
    </>
  )
}

import ScreenAuthLogin from '../screens/Auth/Login.screen.js';
import ScreenAuthRegister from '../screens/Auth/Register.screen.js';
import ScreenAuthCountry from '../screens/Auth/Country.screen.js';
import ScreenAuthPermissions from '../screens/Auth/Permissions.screen.js';
function AuthStack() {
  const Stack = createStackNavigator();
  const options = {
    general: {
      initialRouteName: 'Login',
    }
  };
  return (
    <Stack.Navigator {...getStackOptions(options)}>
      {!store.UserStore.user && <Stack.Screen name='Login' component={ScreenAuthLogin} />}
      {!store.UserStore.user && <Stack.Screen name='Register' component={ScreenAuthRegister} />}
      <Stack.Screen name='Country' component={ScreenAuthCountry} />
      <Stack.Screen name='Permission' component={ScreenAuthPermissions} />
    </Stack.Navigator>
  )
}

export default function ReactNavigator() {
  return (
    <RootStack />
  )
}
