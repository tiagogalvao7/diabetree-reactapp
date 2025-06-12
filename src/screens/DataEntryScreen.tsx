// src/screens/DataEntryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Define a type for a single glucose reading
interface GlucoseReading {
  id: string; // Unique ID for each reading
  value: number;
  timestamp: string; // ISO string for easy sorting and display
}

const DataEntryScreen = () => {
  const [glucoseValue, setGlucoseValue] = useState(''); // State for the input field
  const [recentReadings, setRecentReadings] = useState<GlucoseReading[]>([]); // State to display recent readings

  // Load existing readings when the component mounts
  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@glucose_readings');
      const readings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      // Sort readings by timestamp to show the most recent first
      readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentReadings(readings);
    } catch (e) {
      console.error("Failed to load glucose readings from AsyncStorage:", e);
      Alert.alert("Error", "Could not load past readings.");
    }
  };

  const saveReading = async () => {
    const value = parseFloat(glucoseValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number for glucose.");
      return;
    }

    const newReading: GlucoseReading = {
      id: Date.now().toString(), // Simple unique ID
      value: value,
      timestamp: new Date().toISOString(), // Current timestamp
    };

    try {
      // Get existing readings, add the new one, and save back
      const jsonValue = await AsyncStorage.getItem('@glucose_readings');
      const existingReadings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      const updatedReadings = [...existingReadings, newReading];

      await AsyncStorage.setItem('@glucose_readings', JSON.stringify(updatedReadings));
      setGlucoseValue(''); // Clear input field
      Alert.alert("Success", "Glucose reading saved!");
      loadReadings(); // Reload readings to update the list
    } catch (e) {
      console.error("Failed to save glucose reading to AsyncStorage:", e);
      Alert.alert("Error", "Could not save reading.");
    }
  };

  const clearAllReadings = async () => {
    Alert.alert(
      "Confirm Clear",
      "Are you sure you want to delete ALL glucose readings? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@glucose_readings');
              setRecentReadings([]);
              Alert.alert("Cleared", "All readings have been deleted.");
            } catch (e) {
              console.error("Failed to clear all readings:", e);
              Alert.alert("Error", "Could not clear all readings.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Record Your Glucose</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter glucose value (mg/dL)"
          keyboardType="numeric"
          value={glucoseValue}
          onChangeText={setGlucoseValue}
        />

        <Button
          title="Save Reading"
          onPress={saveReading}
          color="#28a745" // Green color for save button
        />

        <Text style={styles.recentReadingsTitle}>Recent Readings:</Text>
        {recentReadings.length === 0 ? (
          <Text>No readings yet. Enter some data!</Text>
        ) : (
          recentReadings.slice(0, 5).map((reading) => ( // Display only the last 5
            <View key={reading.id} style={styles.readingItem}>
              <Text style={styles.readingText}>
                {new Date(reading.timestamp).toLocaleString()}: {reading.value} mg/dL
              </Text>
            </View>
          ))
        )}

        {recentReadings.length > 0 && (
          <View style={styles.clearButtonContainer}>
            <Button
              title="Clear All Readings"
              onPress={clearAllReadings}
              color="#dc3545" // Red color for clear button
            />
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
  },
  container: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#e0f7fa', // Light blue background
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  recentReadingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#555',
  },
  readingItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  readingText: {
    fontSize: 16,
    color: '#333',
  },
  clearButtonContainer: {
    marginTop: 20,
    width: '100%',
  },
});

export default DataEntryScreen;