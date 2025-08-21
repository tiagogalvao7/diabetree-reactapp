// src/components/DailyMissionPopup.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import the DailyMission interface from the new centralized file
import { DailyMission } from '../utils/missions';

interface DailyMissionPopupProps {
  isVisible: boolean; // Controls whether the popup is visible or not
  onClose: () => void; // Function to close the popup
  mission: DailyMission | null; // The daily mission object to be displayed
  isCompleted: boolean; // Indicates if the mission has been completed
  rewardCoins: number; // The amount of coins the mission rewards
}

const DailyMissionPopup: React.FC<DailyMissionPopupProps> = ({
  isVisible,
  onClose,
  mission,
  isCompleted,
  rewardCoins,
}) => {
  // If no mission is defined, don't render the popup
  if (!mission) {
    return null;
  }

  return (
    <Modal
      animationType="fade" // Smooth transition effect
      transparent={true}    // Makes the background transparent to see what's underneath
      visible={isVisible}   // Controls visibility
      onRequestClose={onClose} // Handles the Android "back" button to close the modal
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Button to close the popup */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#666" />
          </TouchableOpacity>

          {/* Main popup icon, changes depending on whether the mission is complete or not */}
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "calendar-outline"}
            size={60}
            color={isCompleted ? "#28a745" : "#FFD700"} // Green for complete, gold for pending
            style={styles.icon}
          />
          <Text style={styles.modalTitle}>Daily Mission</Text>
          <Text style={styles.missionName}>{mission.name}</Text>
          <Text style={styles.missionDescription}>{mission.description}</Text>

          {/* Mission status control */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, isCompleted ? styles.statusCompleted : styles.statusPending]}>
              {isCompleted ? 'Completed!' : 'Pending'}
            </Text>
            <Ionicons
              name={isCompleted ? "happy" : "hourglass-outline"} // "Happy" or "hourglass" icon
              size={20}
              color={isCompleted ? "#28a745" : "#ffc107"}
              style={{ marginLeft: 5 }}
            />
          </View>

          {/* Mission reward */}
          <Text style={styles.rewardText}>Reward: {rewardCoins} 💰</Text>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Dark semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%', // Adjusts popup width
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, // Ensures the button is above other elements
  },
  icon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  missionName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#555',
  },
  missionDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#777',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusCompleted: {
    color: '#28a745', // Green
  },
  statusPending: {
    color: '#ffc107', // Yellow
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // Gold (coin color)
    marginTop: 15,
  },
});

export default DailyMissionPopup;