// src/navigation/HomeStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importa os ecrãs
import HomeScreen from '../screens/HomeScreen';
import RegisterPatientScreen from '../screens/RegisterPatientScreen'; // new screen

const HomeStack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeBase" // Nome interno para a tela base da pilha
        component={HomeScreen}
        options={{ headerShown: false }} // Não mostra cabeçalho duplicado se já tiver aba
      />
      <HomeStack.Screen
        name="RegisterPatient" // Nome da rota para este ecrã
        component={RegisterPatientScreen}
        options={{ title: 'Insert Patient' }} // Título no cabeçalho
      />
    </HomeStack.Navigator>
  );
};

export default HomeStackNavigator;