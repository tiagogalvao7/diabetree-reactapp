// App.tsx
import React, { useState, useEffect } from 'react'; // FIXED: Added 'from' keyword
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import AppNavigator, { AppStackParamList } from './src/navigation/AppNavigator';

const App = () => {
  // Set initial state directly to 'MainTabs' as a string, no longer null or dependent on AsyncStorage
  const [initialRouteName, setInitialRouteName] = useState<keyof AppStackParamList>('MainTabs'); 

  useEffect(() => {
    // This useEffect is now optional if 'MainTabs' is always the initial route.
    // If you plan to reintroduce registration later, you'd bring back the AsyncStorage logic here.
    // For now, we're assuming MainTabs is the default start.
    const initializeApp = async () => {
        // You can keep this part if you want to perform other async initializations here
        // For example, pre-load some assets or check other app-specific flags.
        // If not, this useEffect can be removed.
        // For demonstration, let's just make sure it sets the state.
        setInitialRouteName('MainTabs'); 
    };
    initializeApp();
  }, []);

  // Removed the loading state condition, as initialRouteName is set immediately.
  // If you had other asynchronous setup, you might keep a separate `isLoading` state.

  return (
    <NavigationContainer>
      <AppNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;