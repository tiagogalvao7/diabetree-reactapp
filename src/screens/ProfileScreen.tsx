// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

import { AppStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = NavigationProp<AppStackParamList, 'Profile'>;

const USER_PROFILE_KEY = '@user_profile';

interface UserProfile {
  name: string;
  email: string;
  age?: string;
  diabetesDiscoveryDate?: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets(); // Initialize safe area insets
  const [profile, setProfile] = useState<UserProfile>({ name: 'Guest User', email: 'guest@example.com' });
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempAge, setTempAge] = useState('');
  const [tempDiscoveryDate, setTempDiscoveryDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (storedProfile) {
        const parsedProfile: UserProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        setTempName(parsedProfile.name);
        setTempEmail(parsedProfile.email);
        setTempAge(parsedProfile.age || '');
        setTempDiscoveryDate(parsedProfile.diabetesDiscoveryDate ? new Date(parsedProfile.diabetesDiscoveryDate) : undefined);
      } else {
        const defaultProfile: UserProfile = { name: 'Guest User', email: 'guest@example.com' };
        setProfile(defaultProfile);
        setTempName(defaultProfile.name);
        setTempEmail(defaultProfile.email);
        setTempAge('');
        setTempDiscoveryDate(undefined);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
      Alert.alert("Error", "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      return () => {};
    }, [loadProfile])
  );

  const saveProfile = async () => {
    setIsLoading(true);
    if (tempName.trim() === '') {
      Alert.alert("Error", "Name cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (!emailRegex.test(tempEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (tempAge.trim() !== '' && (isNaN(Number(tempAge)) || Number(tempAge) <= 0 || Number(tempAge) > 120)) {
        Alert.alert("Error", "Please enter a valid age (between 1 and 120).");
        setIsLoading(false);
        return;
    }

    const newProfile: UserProfile = {
      name: tempName,
      email: tempEmail,
      age: tempAge.trim() === '' ? undefined : tempAge.trim(),
      diabetesDiscoveryDate: tempDiscoveryDate ? tempDiscoveryDate.toISOString().split('T')[0] : undefined,
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (e) {
      console.error("Failed to save profile:", e);
      Alert.alert("Error", "Failed to save profile changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEditing = () => {
    setTempName(profile.name);
    setTempEmail(profile.email);
    setTempAge(profile.age || '');
    setTempDiscoveryDate(profile.diabetesDiscoveryDate ? new Date(profile.diabetesDiscoveryDate) : undefined);
    setIsEditing(false);
  };

  const resetProfile = async () => {
    Alert.alert(
      "Reset Profile",
      "Are you sure you want to reset your profile to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorage.removeItem(USER_PROFILE_KEY);
              await loadProfile();
              Alert.alert("Success", "Profile reset to default values.");
            } catch (e) {
              console.error("Failed to reset profile:", e);
              Alert.alert("Error", "Failed to reset profile.");
            } finally {
              setIsLoading(false);
              setIsEditing(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out? Your local profile data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorage.removeItem(USER_PROFILE_KEY);
              // Consider if you need to navigate to a specific initial route, e.g., 'Welcome'
              // navigation.reset({
              //   index: 0,
              //   routes: [{ name: 'Welcome' as never }],
              // });
              Alert.alert("Success", "You have been logged out.");
            } catch (e) {
              console.error("Failed to logout:", e);
              Alert.alert("Error", "Failed to log out.");
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || tempDiscoveryDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTempDiscoveryDate(currentDate);
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'Not defined';
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 0) }]} // Dynamic paddingTop
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Custom Back Button - Fixed at top-left */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + (Platform.OS === 'android' ? 10 : 0) }]} // Dynamic top position
      >
        <Ionicons name="arrow-back" size={30} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Title/Header Section */}
        <View style={styles.mainTitleContainer}>
            <Text style={styles.mainTitle}>Your Profile</Text>
        </View>

        {/* Profile Picture Placeholder */}
        <View style={styles.profilePictureContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#007bff" />
        </View>

        {isEditing ? (
          // --- EDITING MODE ---
          <View style={styles.card}>
            <Text style={styles.subtitleInCard}>Manage your account settings here.</Text>

            {/* Input fields */}
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Name:</Text>
                <TextInput
                  style={styles.input}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Enter your name"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={styles.input}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="happy-outline" size={20} color="#666" style={styles.icon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Age:</Text>
                <TextInput
                  style={styles.input}
                  value={tempAge}
                  onChangeText={setTempAge}
                  placeholder="Enter your age"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.icon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Diabetes Discovery Date:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
                  <Text style={styles.dateInputText}>
                    {tempDiscoveryDate ? formatDate(tempDiscoveryDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={tempDiscoveryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            </View>

            <View style={styles.editButtonGroup}>
              <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={saveProfile}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={cancelEditing}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // --- DISPLAY MODE ---
          <View style={styles.card}>
            {/* Pencil Icon for Editing */}
            <TouchableOpacity style={styles.editPencilIcon} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil-outline" size={24} color="#007bff" />
            </TouchableOpacity>

            <Text style={styles.subtitleInCard}>Manage your account settings here.</Text>

            {/* Profile details */}
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailText}>Name: {profile.name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={20} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailText}>Email: {profile.email || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="happy-outline" size={20} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailText}>Age: {profile.age || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#007bff" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Discovery Date: {profile.diabetesDiscoveryDate ? formatDate(new Date(profile.diabetesDiscoveryDate)) : 'N/A'}
              </Text>
            </View>

            {/* Utility buttons (Reset, Logout) */}
            <View style={styles.utilityButtonContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetProfile}>
                    <Ionicons name="reload-circle-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.buttonText}>Reset Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.buttonText}>Logout (Not Functional Yet)</Text>
                </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F7',
    // paddingTop will be set dynamically using insets
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  // NEW: Back button styling
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    // top will be set dynamically using insets
  },
  // NEW: Main Title/Header container styling
  mainTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30, // Space below the title
    marginTop: 30, // Space below the back button's typical area
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: '#007bff',
    overflow: 'hidden',
  },
  card: {
    width: '95%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 30,
    position: 'relative',
  },
  subtitleInCard: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  editPencilIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 17,
    color: '#333',
    flexShrink: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fefefe',
    color: '#333',
  },
  dateInputButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fefefe',
    justifyContent: 'center',
    minHeight: 45,
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  editButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 25,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  utilityButtonContainer: {
    marginTop: 25,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  resetButton: {
    backgroundColor: '#ffc107',
    width: '80%',
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;