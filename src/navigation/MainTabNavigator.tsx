<<<<<<< HEAD
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native'; // Import Text component
=======
// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4

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
<<<<<<< HEAD
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle'; // A safe default icon
=======
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle'; // Um ícone padrão seguro
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4

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
<<<<<<< HEAD
        headerShown: false, // Hides the default header for the tabs
=======
        headerShown: false, // Esconde o cabeçalho padrão para as tabs
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
<<<<<<< HEAD
          title: 'Home', // Screen title (appears in header if headerShown is true for this screen)
          tabBarLabel: ({ color }) => <Text style={{ color }}>Home</Text>, // Explicitly wrapped in <Text>
=======
          title: 'Home', // Adiciona um título explícito para a tela
          tabBarLabel: 'Home', // Adiciona um rótulo explícito para a aba
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
        }}
      />
      <Tab.Screen
        name="Data Entry"
        component={DataEntryScreen}
        options={{
          title: 'Data Entry',
<<<<<<< HEAD
          tabBarLabel: ({ color }) => <Text style={{ color }}>Data Entry</Text>,
=======
          tabBarLabel: 'Data Entry',
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: 'Shop',
<<<<<<< HEAD
          tabBarLabel: ({ color }) => <Text style={{ color }}>Shop</Text>,
=======
          tabBarLabel: 'Shop',
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: 'Collection',
<<<<<<< HEAD
          tabBarLabel: ({ color }) => <Text style={{ color }}>Collection</Text>,
=======
          tabBarLabel: 'Collection',
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
        }}
      />
    </Tab.Navigator>
  );
};

<<<<<<< HEAD
export default MainTabNavigator;
=======
export default MainTabNavigator;
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
