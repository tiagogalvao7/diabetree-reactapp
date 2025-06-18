// src/screens/DataEntryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import * as Haptics from 'expo-haptics'; // For haptic feedback

interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string;
}

const USER_COINS_KEY = '@user_coins';
const LAST_COIN_EARN_TIMESTAMP_KEY = '@last_coin_earn_timestamp';

// Target definitions for glucose levels
const TARGET_MIN = 70;
const TARGET_MAX = 180;

const DataEntryScreen = () => {
  const [glucoseValue, setGlucoseValue] = useState('');
  const [recentReadings, setRecentReadings] = useState<GlucoseReading[]>([]);
  const navigation = useNavigation();

  // Use useFocusEffect to reload readings whenever the screen focuses
  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [])
  );

  const loadReadings = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@glucose_readings');
      const readings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      // Sort from most recent to oldest
      readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentReadings(readings);
    } catch (e) {
      console.error("Failed to load glucose readings from AsyncStorage:", e);
      Alert.alert("Error", "Could not load past readings.");
    }
  };

  const saveReading = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic feedback on save

    const value = parseFloat(glucoseValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number for glucose.");
      return;
    }
    // Reasonable range validation
    if (value < 10 || value > 600) {
      Alert.alert("Unusual Value", "The entered value seems unusual. Are you sure it's correct?", [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => confirmSaveReading(value) }
      ]);
      return;
    }

    confirmSaveReading(value);
  };

  const confirmSaveReading = async (value: number) => {
    const newReading: GlucoseReading = {
      id: Date.now().toString(),
      value: value,
      timestamp: new Date().toISOString(),
    };

    try {
      const jsonValue = await AsyncStorage.getItem('@glucose_readings');
      const existingReadings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      const updatedReadings = [...existingReadings, newReading];

      await AsyncStorage.setItem('@glucose_readings', JSON.stringify(updatedReadings));
      setGlucoseValue(''); // Clear the input

      let alertMessage = "Reading recorded!";
      
      // --- Logic for Earning Coins with Time Rule ---
      if (newReading.value >= TARGET_MIN && newReading.value <= TARGET_MAX) {
        const storedLastCoinTimestamp = await AsyncStorage.getItem(LAST_COIN_EARN_TIMESTAMP_KEY);
        const lastCoinTimestamp = storedLastCoinTimestamp ? parseInt(storedLastCoinTimestamp, 10) : 0;
        const currentTime = new Date().getTime();
        const TEN_MINUTES_IN_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (currentTime - lastCoinTimestamp >= TEN_MINUTES_IN_MS) {
          const storedCoins = await AsyncStorage.getItem(USER_COINS_KEY);
          let currentCoins = storedCoins != null ? parseInt(storedCoins, 10) : 0;
          currentCoins += 1; // Add 1 coin
          await AsyncStorage.setItem(USER_COINS_KEY, currentCoins.toString());
          await AsyncStorage.setItem(LAST_COIN_EARN_TIMESTAMP_KEY, currentTime.toString()); // Update timestamp
          alertMessage = 'Reading recorded! You win 1 coin for an on-target reading! 💰';
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success feedback
        } else {
          const timeRemainingSeconds = Math.ceil((TEN_MINUTES_IN_MS - (currentTime - lastCoinTimestamp)) / 1000);
          const minutesRemaining = Math.ceil(timeRemainingSeconds / 60);
          alertMessage = `Reading recorded! To earn coins, wait ${minutesRemaining} more minutes between on-target readings.`;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Warning feedback
        }
      } else {
        alertMessage = 'Reading recorded! Keep monitoring your levels.';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Warning feedback
      }

      Alert.alert("Success", alertMessage, [
        { text: "OK", onPress: () => {
          loadReadings(); // Reload readings
          navigation.goBack(); // Go back to the previous screen (HomeScreen)
        }}
      ]);

    } catch (e) {
      console.error("Failed to save reading or add coins:", e);
      Alert.alert("Error", "Could not record the reading.");
    }
  };

  const deleteReading = async (idToDelete: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this reading?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const jsonValue = await AsyncStorage.getItem('@glucose_readings');
              const existingReadings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];
              const updatedReadings = existingReadings.filter(reading => reading.id !== idToDelete);
              await AsyncStorage.setItem('@glucose_readings', JSON.stringify(updatedReadings));
              loadReadings(); // Reload the list after deletion
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Reading deleted.");
            } catch (e) {
              console.error("Failed to delete reading:", e);
              Alert.alert("Error", "Could not delete the reading.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const clearAllReadings = async () => {
    Alert.alert(
      "Confirm Total Clear",
      "Are you sure you want to erase ALL glucose readings? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All Data",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@glucose_readings');
              await AsyncStorage.setItem(USER_COINS_KEY, '0'); // Reset coins
              await AsyncStorage.removeItem(LAST_COIN_EARN_TIMESTAMP_KEY); // Reset last coin timestamp
              setGlucoseValue('');
              setRecentReadings([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Clear Complete", "All readings and coins have been erased.");
            } catch (e) {
              console.error("Failed to delete all readings:", e);
              Alert.alert("Error", "Could not delete all readings.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const getReadingStyle = (value: number) => {
    if (value < TARGET_MIN) {
      return styles.readingLow;
    } else if (value > TARGET_MAX) {
      return styles.readingHigh;
    } else {
      return styles.readingTarget;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Record Glucose</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter glucose value (mg/dL)"
          keyboardType="numeric"
          value={glucoseValue}
          onChangeText={setGlucoseValue}
          returnKeyType="done" // Adds "Done" button to the keyboard
          onSubmitEditing={saveReading} // Allows saving by pressing "Done"
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveReading}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Reading</Text>
        </TouchableOpacity>

        <Text style={styles.recentReadingsTitle}>Recent Readings:</Text>
        {recentReadings.length === 0 ? (
          <Text style={styles.noReadingsText}>No readings yet. Enter some data!</Text>
        ) : (
          recentReadings.slice(0, 7).map((reading) => ( // Display the last 7 readings
            <View key={reading.id} style={[styles.readingItem, getReadingStyle(reading.value)]}>
              <Text style={styles.readingText}>
                {new Date(reading.timestamp).toLocaleString('en-US', { // Changed to 'en-US' locale
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })}:
                <Text style={styles.readingValueText}> {reading.value} mg/dL</Text>
              </Text>
              <TouchableOpacity onPress={() => deleteReading(reading.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {recentReadings.length > 0 && (
          <View style={styles.clearButtonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearAllReadings}>
              <Ionicons name="remove-circle-outline" size={24} color="#fff" />
              <Text style={styles.clearButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#E0F2F7', // Light blue background for the entire screen
  },
  container: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#fff', // White background for the main card
    padding: 20,
    borderRadius: 15, // More rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // More prominent shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    height: 55, // Slightly taller
    borderColor: '#a0d8e6', // Light blue border
    borderWidth: 2, // Slightly thicker border
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    backgroundColor: '#f8f8f8', // Slightly grey background for the input
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745', // Green
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recentReadingsTitle: {
    fontSize: 22, // More prominent readings title
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#555',
  },
  noReadingsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // More vertical padding
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
    borderLeftWidth: 5, // Color indicator
    backgroundColor: '#f0faff', // Light background for each item
  },
  readingText: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Allows text to take necessary space
  },
  readingValueText: {
    fontWeight: 'bold', // Value in bold
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  // Styles for the reading color indicator
  readingLow: {
    borderLeftColor: '#ffc107', // Yellow for low
  },
  readingTarget: {
    borderLeftColor: '#28a745', // Green for target
  },
  readingHigh: {
    borderLeftColor: '#dc3545', // Red for high
  },
  clearButtonContainer: {
    marginTop: 25, // More spacing
    width: '100%',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545', // Red
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: '100%',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default DataEntryScreen;