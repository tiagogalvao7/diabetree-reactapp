// src/screens/ShopScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShopScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diabetree Shop</Text>
      <Text>Explore products and services here!</Text>
      {/* We'll add shop content and logic later */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f2ff', // A light blue background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ShopScreen;