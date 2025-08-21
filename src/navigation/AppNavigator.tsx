// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

export type MainTabParamList = {
  Home: undefined;
  'Data Entry': undefined;
  Shop: undefined;
  Collection: undefined;
};

export type AppStackParamList = {
  MainTabs: {
    screen?: keyof MainTabParamList;
    params?: any;
  } | undefined;
  Profile: undefined;
  Achievements: { isDailyBonusClaimable?: boolean };
};

const AppStack = createStackNavigator<AppStackParamList>();

const AppNavigator = ({ initialRouteName }: { initialRouteName: keyof AppStackParamList }) => {
  return (
    <AppStack.Navigator initialRouteName={initialRouteName}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
<<<<<<< HEAD
          headerShown: false,
=======
          headerShown: false, // <-- This is the key change!
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
        }}
      />
      <AppStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          headerShown: false,
        }}
      />
    </AppStack.Navigator>
  );
};

export default AppNavigator;