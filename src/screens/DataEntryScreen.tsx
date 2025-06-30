// src/screens/DataEntryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import GlucoseReading interface and keys from utils/missions for consistency
import { GlucoseReading, USER_COINS_KEY, GLUCOSE_READINGS_KEY, ACHIEVEMENTS_KEY } from '../utils/missions';

const LAST_COIN_EARN_TIMESTAMP_KEY = '@last_coin_earn_timestamp';
const API_BASE_URL = 'http://192.168.2.214:3000'; // Make sure this is your correct IP

// Target definitions for glucose levels
const TARGET_MIN = 70;
const TARGET_MAX = 180;

const DataEntryScreen = () => {
  const [glucoseValue, setGlucoseValue] = useState('');
  const [recentReadings, setRecentReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(false); // New loading state
  const [apiError, setApiError] = useState(''); // New API error state

  // New states for context fields
  const [mealContext, setMealContext] = useState('');
  const [activityContext, setActivityContext] = useState('');
  const [notes, setNotes] = useState('');

  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadReadings();
      // Clear context fields when screen gains focus, assuming new entry
      setMealContext('');
      setActivityContext('');
      setNotes('');
    }, [])
  );

  const loadReadings = async () => {
    setLoading(true); // Set loading to true when fetching
    setApiError(''); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/glucoseReadings`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        setApiError("Connection Error: Could not fetch glucose readings. Please check your local API connection.");
        setRecentReadings([]);
        return;
      }
      const data: GlucoseReading[] = await response.json();

      // Sort from most recent to oldest
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentReadings(data);

    } catch (e) {
      console.error("Failed to load glucose readings from API:", e);
      setApiError("Error: Could not load past readings from API. Ensure json-server is running.");
      setRecentReadings([]);
    } finally {
      setLoading(false); // Set loading to false after fetch attempt
    }
  };

  const saveReading = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const value = parseFloat(glucoseValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number for glucose.");
      return;
    }
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
      // Add new context fields to the reading object
      mealContext: mealContext || undefined, // Use undefined if empty to not send null string
      activityContext: activityContext || undefined,
      notes: notes || undefined,
    };

    setLoading(true); // Show loading when saving
    setApiError(''); // Clear errors
    try {
      const response = await fetch(`${API_BASE_URL}/glucoseReadings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReading),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        Alert.alert("Save Error", `Could not save reading to the API: ${response.statusText}`);
        return;
      }

      setGlucoseValue(''); // Clear the input
      setMealContext(''); // Clear context fields after saving
      setActivityContext('');
      setNotes('');

      let alertMessage = "Reading recorded!";

      // --- Logic for Earning Coins with Time Rule ---
      if (newReading.value >= TARGET_MIN && newReading.value <= TARGET_MAX) {
        const storedLastCoinTimestamp = await AsyncStorage.getItem(LAST_COIN_EARN_TIMESTAMP_KEY);
        const lastCoinTimestamp = storedLastCoinTimestamp ? parseInt(storedLastCoinTimestamp, 10) : 0;
        const currentTime = new Date().getTime();
        const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

        if (currentTime - lastCoinTimestamp >= TEN_MINUTES_IN_MS) {
          const storedCoins = await AsyncStorage.getItem(USER_COINS_KEY);
          let currentCoins = storedCoins != null ? parseInt(storedCoins, 10) : 0;
          currentCoins += 1; // Add 1 coin
          await AsyncStorage.setItem(USER_COINS_KEY, currentCoins.toString());
          await AsyncStorage.setItem(LAST_COIN_EARN_TIMESTAMP_KEY, currentTime.toString());
          alertMessage = 'Reading recorded! You win 1 coin for an on-target reading! 💰';
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          const timeRemainingSeconds = Math.ceil((TEN_MINUTES_IN_MS - (currentTime - lastCoinTimestamp)) / 1000);
          const minutesRemaining = Math.ceil(timeRemainingSeconds / 60);
          alertMessage = `Reading recorded! To earn coins, wait ${minutesRemaining} more minutes between on-target readings.`;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        alertMessage = 'Reading recorded! Keep monitoring your levels.';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      Alert.alert("Success", alertMessage, [
        {
          text: "OK", onPress: () => {
            loadReadings(); // Reload readings from API
            navigation.goBack(); // Go back to the previous screen (HomeScreen)
          }
        }
      ]);

    } catch (e) {
      console.error("Failed to save reading or add coins:", e);
      Alert.alert("Error", "Could not record the reading.");
    } finally {
      setLoading(false); // Hide loading after save attempt
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
            setLoading(true); // Show loading when deleting
            setApiError(''); // Clear errors
            try {
              const response = await fetch(`${API_BASE_URL}/glucoseReadings/${idToDelete}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
                Alert.alert("Delete Error", `Could not delete reading from the API: ${response.statusText}`);
                return;
              }

              loadReadings();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Reading deleted.");
            } catch (e) {
              console.error("Failed to delete reading:", e);
              Alert.alert("Error", "Could not delete the reading.");
            } finally {
              setLoading(false); // Hide loading after delete attempt
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
            setLoading(true); // Show loading when clearing all
            setApiError(''); // Clear errors
            try {
              const allReadingsResponse = await fetch(`${API_BASE_URL}/glucoseReadings`);
              if (!allReadingsResponse.ok) {
                throw new Error(`Failed to fetch readings for deletion: ${allReadingsResponse.status}`);
              }
              const allReadings: GlucoseReading[] = await allReadingsResponse.json();

              const deletePromises = allReadings.map(reading =>
                fetch(`${API_BASE_URL}/glucoseReadings/${reading.id}`, { method: 'DELETE' })
              );
              await Promise.all(deletePromises);

              await AsyncStorage.setItem(USER_COINS_KEY, '0');
              await AsyncStorage.removeItem(LAST_COIN_EARN_TIMESTAMP_KEY);
              // Also clear achievements or daily mission state if you want a full reset
              await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);

              setGlucoseValue('');
              setRecentReadings([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Clear Complete", "All readings and coins have been erased.");
            } catch (e) {
              console.error("Failed to delete all readings:", e);
              Alert.alert("Error", "Could not delete all readings.");
            } finally {
              setLoading(false); // Hide loading after clear all attempt
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

  // Helper to format date/time
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short', // e.g., 'Jul'
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleString('en-US', options);
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
          onChangeText={(text) => {
            // Optional: Live feedback on value range as typed
            setGlucoseValue(text);
          }}
          returnKeyType="done"
          onSubmitEditing={saveReading}
        />

        {/* Dynamic Range Indicator (simplified example) */}
        {glucoseValue && !isNaN(parseFloat(glucoseValue)) && (
          <View style={styles.rangeIndicatorContainer}>
            <Text style={[styles.rangeIndicatorText, getReadingStyle(parseFloat(glucoseValue))]}>
              {parseFloat(glucoseValue) < TARGET_MIN ? 'Low' :
                parseFloat(glucoseValue) > TARGET_MAX ? 'High' : 'In Target'}
            </Text>
          </View>
        )}

        {/* --- NEW: Context Input Fields --- */}
        <Text style={styles.sectionTitle}>Add Context (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., After Breakfast, Before Exercise"
          value={mealContext}
          onChangeText={setMealContext}
        />
        <TextInput
          style={styles.input}
          placeholder="e.g., 30 min walk, Feeling tired"
          value={activityContext}
          onChangeText={setActivityContext}
        />
        <TextInput
          style={styles.inputMultiline}
          placeholder="Any additional notes?"
          value={notes}
          onChangeText={setNotes}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top" // Ensure text starts from top for multiline
        />
        {/* --- End NEW --- */}

        <TouchableOpacity style={styles.saveButton} onPress={saveReading} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Save Reading</Text>
            </>
          )}
        </TouchableOpacity>

        {apiError ? (
          <Text style={styles.errorText}>{apiError}</Text>
        ) : loading && recentReadings.length === 0 ? (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Text style={styles.recentReadingsTitle}>Recent Readings:</Text>
            {recentReadings.length === 0 ? (
              <Text style={styles.noReadingsText}>No readings yet. Enter some data!</Text>
            ) : (
              recentReadings.slice(0, 5).map((reading) => ( // Display last 5 readings
                <View key={reading.id} style={[styles.readingItem, getReadingStyle(reading.value)]}>
                  <View style={styles.readingInfo}>
                    <Text style={styles.readingText}>
                      {formatDateTime(reading.timestamp)}:
                      <Text style={styles.readingValueText}> {reading.value} mg/dL</Text>
                    </Text>
                    {/* Display context if available */}
                    {(reading.mealContext || reading.activityContext || reading.notes) && (
                      <Text style={styles.readingContext}>
                        {reading.mealContext ? `🍽️ ${reading.mealContext}` : ''}
                        {reading.activityContext ? ` 🏃‍♂️ ${reading.activityContext}` : ''}
                        {reading.notes ? ` 📝 ${reading.notes}` : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => deleteReading(reading.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
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
    backgroundColor: '#E0F2F7',
  },
  container: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    height: 55,
    borderColor: '#a0d8e6',
    borderWidth: 2,
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 15, // Reduced marginBottom for new fields
    fontSize: 18,
    backgroundColor: '#f8f8f8',
    color: '#333',
  },
  inputMultiline: { // New style for multiline input
    height: 80,
    borderColor: '#a0d8e6',
    borderWidth: 2,
    borderRadius: 10,
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10, // Added vertical padding
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    color: '#333',
    textAlignVertical: 'top', // For Android multiline text alignment
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
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
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#555',
    alignSelf: 'flex-start', // Align left with other content
    width: '100%',
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
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
    borderLeftWidth: 5,
    backgroundColor: '#f0faff',
  },
  readingInfo: { // New container for text info to allow context on new line
    flex: 1,
    paddingRight: 10, // Spacing from delete button
  },
  readingText: {
    fontSize: 16,
    color: '#333',
  },
  readingValueText: {
    fontWeight: 'bold',
  },
  readingContext: { // Style for new context text
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  readingLow: {
    borderLeftColor: '#ffc107',
  },
  readingTarget: {
    borderLeftColor: '#28a745',
  },
  readingHigh: {
    borderLeftColor: '#dc3545',
  },
  clearButtonContainer: {
    marginTop: 25,
    width: '100%',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
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
  errorText: { // Style for API error messages
    color: '#dc3545',
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  sectionTitle: { // Style for new section titles like "Add Context"
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10, // Adjust spacing
    marginBottom: 5,
    color: '#555',
    alignSelf: 'flex-start',
    width: '100%',
  },
  rangeIndicatorContainer: { // Style for dynamic range indicator
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  rangeIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    overflow: 'hidden', // Ensures border-radius works
    backgroundColor: '#eee', // Default background
  },
});

export default DataEntryScreen;