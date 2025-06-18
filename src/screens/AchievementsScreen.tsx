// src/screens/AchievementsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Certifique-se de que está instalado: npm install react-native-safe-area-context

const AchievementsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Your Achievements</Text>
          <Text style={styles.subtitle}>Unlock badges by managing your diabetes!</Text>

          {/* Adicione sua lógica e UI de achievements aqui */}
          <View style={styles.achievementItem}>
            <Text style={styles.achievementTitle}>First Step</Text>
            <Text style={styles.achievementDescription}>Record your first glucose reading.</Text>
            <Text style={styles.achievementStatus}>Unlocked!</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementTitle}>Healthy Week</Text>
            <Text style={styles.achievementDescription}>Maintain blood glucose in target range for 7 consecutive days.</Text>
            <Text style={styles.achievementStatus}>Locked</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    width: '90%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  achievementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  achievementStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745', // Green for unlocked
  },
});

export default AchievementsScreen;