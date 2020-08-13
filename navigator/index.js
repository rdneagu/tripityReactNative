/* React packages */
import React, { createRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

/* Expo packages */
import { Entypo } from '@expo/vector-icons';

/* Community packages */
import _ from 'lodash';

/* App components */
import { NavigationBottom } from '../components';

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

function RootStack() {
  const Stack = createStackNavigator();
  const options = {
    general: {
      initialRouteName: 'Screen.Main',
    }
  };
  return (
    <Stack.Navigator {...getStackOptions(options)}>
      <Stack.Screen name="Screen.Main" component={MainStack} />
      <Stack.Screen name="Screen.Auth" component={AuthStack} />
    </Stack.Navigator>
  )
}

import ScreenMainSplash from '../screens/Main/Splash.screen.js';
import ScreenMainItinerary from '../screens/Main/Itinerary.screen.js';
import ScreenMainGrabPhotos from '../screens/Main/GrabPhotos.screen.js';
function MainStack() {
  const Stack = createStackNavigator();
  const options = {
    general: {
      initialRouteName: 'Splash',
    }
  };
  const tabs = [
    {
      name: 'Itinerary',
      component: ScreenMainItinerary,
      icon: <Entypo name="aircraft" size={20} color="white" />
    },
    {
      name: 'GrabPhotos',
      component: ScreenMainGrabPhotos,
      icon: <Entypo name="aircraft" size={20} color="white" />
    },

  ]
  return (
    <>
      <Stack.Navigator {...getStackOptions(options)}>
        <Stack.Screen name='Splash' component={ScreenMainSplash} />
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
      <Stack.Screen name='Login' component={ScreenAuthLogin} />
      <Stack.Screen name='Register' component={ScreenAuthRegister} />
      <Stack.Screen name='Country' component={ScreenAuthCountry} />
      <Stack.Screen name='Permission' component={ScreenAuthPermissions} />
    </Stack.Navigator>
  )
}

export function ReactNavigator() {
  return (
    <RootStack />
  )
}
