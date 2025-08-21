import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native'; // Import Text component

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import DataEntryScreen from '../screens/DataEntryScreen';
import ShopScreen from '../screens/ShopScreen';
import CollectionScreen from '../screens/CollectionScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle'; // A safe default icon

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
        headerShown: false, // Hides the default header for the tabs
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home', // Screen title (appears in header if headerShown is true for this screen)
          tabBarLabel: ({ color }) => <Text style={{ color }}>Home</Text>, // Explicitly wrapped in <Text>
        }}
      />
      <Tab.Screen
        name="Data Entry"
        component={DataEntryScreen}
        options={{
          title: 'Data Entry',
          tabBarLabel: ({ color }) => <Text style={{ color }}>Data Entry</Text>,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: 'Shop',
          tabBarLabel: ({ color }) => <Text style={{ color }}>Shop</Text>,
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: 'Collection',
          tabBarLabel: ({ color }) => <Text style={{ color }}>Collection</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
