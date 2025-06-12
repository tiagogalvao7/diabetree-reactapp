// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importa os teus ecrãs e navegadores
import DataEntryScreen from '../screens/DataEntryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeStackNavigator from './HomeStackNavigator'; // Importa o novo Stack Navigator
import ShopScreen from '../screens/ShopScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') { // O nome da rota da Tab continua a ser 'Home'
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Insert Data') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Shop') { // Add icon logic for Shop tab
            iconName = focused ? 'basket' : 'basket-outline';
          }
          // @ts-ignore
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // O cabeçalho será gerido pelo Stack Navigator
      })}
    >
      <Tab.Screen
        name="Home" // O nome da Tab continua a ser "Home"
        component={HomeStackNavigator} // Agora renderiza o Stack Navigator
      />
      <Tab.Screen name="Insert Data" component={DataEntryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;