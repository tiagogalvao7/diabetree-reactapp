// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native'; // Import ParamListBase for base typing

import MainTabNavigator from './MainTabNavigator'; // Your main Tab Navigator
import ProfileScreen from '../screens/ProfileScreen'; // The Profile screen
import AchievementsScreen from '../screens/AchievementsScreen'; // Importe a tela de Achievements

// ** CRITICAL STEP: Define MainTabParamList **
// This must EXACTLY match the `name` of the `Tab.Screen` in MainTabNavigator.tsx
export type MainTabParamList = {
  Home: undefined; // Home receives no direct parameters when navigating to it via tab
  'Data Entry': undefined; // Data Entry also does not
  Shop: undefined;
  Collection: undefined;
};

// Define AppStackParamList for type safety
export type AppStackParamList = {
  MainTabs: {
    screen?: keyof MainTabParamList; // The name of the screen within MainTabs (e.g., 'Data Entry')
    params?: any; // Any parameters that the inner screen needs
  } | undefined; // Or 'undefined' if we don't pass parameters (it will go to the first tab by default)
  Profile: undefined; // The profile screen has no parameters
  Achievements: { isDailyBonusClaimable?: boolean }; // Adicione a rota Achievements aqui
};

const AppStack = createStackNavigator<AppStackParamList>();

// No change needed here, as `initialRouteName` is now passed from App.tsx
const AppNavigator = ({ initialRouteName }: { initialRouteName: keyof AppStackParamList }) => {
  return (
    <AppStack.Navigator initialRouteName={initialRouteName}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Your Profile', // Title for the profile screen header
          headerShown: true, // Ensures the header is visible for the profile screen
        }}
      />
      {/* Adicione a tela de Achievements ao AppStack */}
      <AppStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: 'Your Achievements', // Título para o cabeçalho da tela de Achievements
          headerShown: true, // Garante que o cabeçalho esteja visível
        }}
      />
    </AppStack.Navigator>
  );
};

export default AppNavigator;