// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import DataEntryScreen from '../screens/DataEntryScreen';
import ShopScreen from '../screens/ShopScreen';
<<<<<<< HEAD
import CollectionScreen from '../screens/CollectionScreen';
=======
import CollectionScreen from '../screens/CollectionScreen'; // Ensure this is imported
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle'; // Default icon

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Data Entry') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Collection') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // We will manage headers in the AppNavigator
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Data Entry" component={DataEntryScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;