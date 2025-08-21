<<<<<<< HEAD
=======
// src/screens/ProfileScreen.tsx
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = NavigationProp<AppStackParamList, 'Profile'>;

const USER_PROFILE_KEY = '@user_profile';

interface UserProfile {
  name: string;
  email: string;
  age?: string;
  diabetesDiscoveryDate?: string;
  minGlucoseTarget?: string;
  maxGlucoseTarget?: string;
<<<<<<< HEAD
  fastInsuline?: string; // Added variable: Fast-acting insulin
  slowInsuline?: string; // Added variable: Slow-acting insulin
=======
  fastInsuline?: string; // Variável adicionada: Insulina rápida
  slowInsuline?: string; // Variável adicionada: Insulina lenta
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
}

const DEFAULT_TARGET_MIN = 70;
const DEFAULT_TARGET_MAX = 180;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Guest User',
    email: 'guest@example.com',
    minGlucoseTarget: String(DEFAULT_TARGET_MIN),
    maxGlucoseTarget: String(DEFAULT_TARGET_MAX),
    fastInsuline: undefined,
    slowInsuline: undefined
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempAge, setTempAge] = useState('');
  const [tempDiscoveryDate, setTempDiscoveryDate] = useState<Date | undefined>(undefined);
  const [tempMinGlucoseTarget, setTempMinGlucoseTarget] = useState('');
  const [tempMaxGlucoseTarget, setTempMaxGlucoseTarget] = useState('');
  const [tempFastInsuline, setTempFastInsuline] = useState('');
  const [tempSlowInsuline, setTempSlowInsuline] = useState('');
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
        setTempMinGlucoseTarget(parsedProfile.minGlucoseTarget || String(DEFAULT_TARGET_MIN));
        setTempMaxGlucoseTarget(parsedProfile.maxGlucoseTarget || String(DEFAULT_TARGET_MAX));
        setTempFastInsuline(parsedProfile.fastInsuline || '');
        setTempSlowInsuline(parsedProfile.slowInsuline || '');
      } else {
        const defaultProfile: UserProfile = {
          name: 'Guest User',
          email: 'guest@example.com',
          minGlucoseTarget: String(DEFAULT_TARGET_MIN),
          maxGlucoseTarget: String(DEFAULT_TARGET_MAX),
          fastInsuline: undefined,
          slowInsuline: undefined
        };
        setProfile(defaultProfile);
        setTempName(defaultProfile.name);
        setTempEmail(defaultProfile.email);
        setTempAge('');
        setTempDiscoveryDate(undefined);
        setTempMinGlucoseTarget(String(DEFAULT_TARGET_MIN));
        setTempMaxGlucoseTarget(String(DEFAULT_TARGET_MAX));
        setTempFastInsuline('');
        setTempSlowInsuline('');
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

    const minTargetValue = parseFloat(tempMinGlucoseTarget);
    const maxTargetValue = parseFloat(tempMaxGlucoseTarget);

    if (isNaN(minTargetValue) || minTargetValue <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number for Min Glucose Target.");
      setIsLoading(false);
      return;
    }
    if (isNaN(maxTargetValue) || maxTargetValue <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number for Max Glucose Target.");
      setIsLoading(false);
      return;
    }
    if (minTargetValue >= maxTargetValue) {
      Alert.alert("Invalid Range", "Min Glucose Target must be less than Max Glucose Target.");
      setIsLoading(false);
      return;
    }

<<<<<<< HEAD
=======
    if (tempFastInsuline.trim() !== '' && isNaN(Number(tempFastInsuline))) {
      Alert.alert("Invalid Input", "Please enter a valid number for Fast Insulin.");
      setIsLoading(false);
      return;
    }
    if (tempSlowInsuline.trim() !== '' && isNaN(Number(tempSlowInsuline))) {
      Alert.alert("Invalid Input", "Please enter a valid number for Slow Insulin.");
      setIsLoading(false);
      return;
    }

>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
    const newProfile: UserProfile = {
      name: tempName,
      email: tempEmail,
      age: tempAge.trim() === '' ? undefined : tempAge.trim(),
      diabetesDiscoveryDate: tempDiscoveryDate ? tempDiscoveryDate.toISOString().split('T')[0] : undefined,
      minGlucoseTarget: String(minTargetValue),
      maxGlucoseTarget: String(maxTargetValue),
      fastInsuline: tempFastInsuline.trim() === '' ? undefined : tempFastInsuline.trim(),
      slowInsuline: tempSlowInsuline.trim() === '' ? undefined : tempSlowInsuline.trim()
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
    setTempMinGlucoseTarget(profile.minGlucoseTarget || String(DEFAULT_TARGET_MIN));
    setTempMaxGlucoseTarget(profile.maxGlucoseTarget || String(DEFAULT_TARGET_MAX));
    setTempFastInsuline(profile.fastInsuline || '');
    setTempSlowInsuline(profile.slowInsuline || '');
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
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 0) }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + (Platform.OS === 'android' ? 10 : 0) }]}
      >
        <Ionicons name="arrow-back" size={30} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainTitleContainer}>
            <Text style={styles.mainTitle}>Your Profile</Text>
        </View>

        <View style={styles.profilePictureContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#007bff" />
        </View>

        {isEditing ? (
          // --- EDITING MODE ---
          <View style={styles.card}>
            <Text style={styles.subtitleInCard}>Manage your account settings here.</Text>

            {/* Personal Information Section */}
            <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={22} color="#007bff" />
                <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.sectionContent}>
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
            </View>

            {/* Glucose Target Section */}
            <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart-outline" size={22} color="#007bff" />
                <Text style={styles.sectionTitle}>Glucose Targets</Text>
            </View>
            <View style={styles.sectionContent}>
                <View style={styles.inputGroup}>
                <Ionicons name="arrow-down-circle-outline" size={20} color="#666" style={styles.icon} />
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Min Target (mg/dL):</Text>
                    <TextInput
                    style={styles.input}
                    value={tempMinGlucoseTarget}
                    onChangeText={setTempMinGlucoseTarget}
                    placeholder={String(DEFAULT_TARGET_MIN)}
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    />
                </View>
                </View>

                <View style={styles.inputGroup}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#666" style={styles.icon} />
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Max Target (mg/dL):</Text>
                    <TextInput
                    style={styles.input}
                    value={tempMaxGlucoseTarget}
                    onChangeText={setTempMaxGlucoseTarget}
                    placeholder={String(DEFAULT_TARGET_MAX)}
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    />
                </View>
                </View>
            </View>

<<<<<<< HEAD
            {/* Insulin Information Section */}
=======
            {/* Nova Seção: Informação sobre Insulina */}
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
            <View style={styles.sectionHeader}>
                <Ionicons name="medical-outline" size={22} color="#007bff" />
                <Text style={styles.sectionTitle}>Insulin Information</Text>
            </View>
            <View style={styles.sectionContent}>
                <View style={styles.inputGroup}>
                <Ionicons name="speedometer-outline" size={20} color="#666" style={styles.icon} />
                <View style={styles.inputWrapper}>
<<<<<<< HEAD
                    <Text style={styles.label}>Fast-Acting Insulin (details):</Text>
=======
                    <Text style={styles.label}>Fast-Acting Insulin (units):</Text>
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
                    <TextInput
                    style={styles.input}
                    value={tempFastInsuline}
                    onChangeText={setTempFastInsuline}
                    placeholder="e.g., 1 unit per 10g carb"
                    placeholderTextColor="#888"
<<<<<<< HEAD
                    // keyboardType removed to allow string input
=======
                    keyboardType="numeric"
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
                    />
                </View>
                </View>

                <View style={styles.inputGroup}>
                <Ionicons name="time-outline" size={20} color="#666" style={styles.icon} />
                <View style={styles.inputWrapper}>
<<<<<<< HEAD
                    <Text style={styles.label}>Slow-Acting Insulin (details/day):</Text>
=======
                    <Text style={styles.label}>Slow-Acting Insulin (units/day):</Text>
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
                    <TextInput
                    style={styles.input}
                    value={tempSlowInsuline}
                    onChangeText={setTempSlowInsuline}
                    placeholder="e.g., 20 units daily"
                    placeholderTextColor="#888"
<<<<<<< HEAD
                    // keyboardType removed to allow string input
=======
                    keyboardType="numeric"
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
                    />
                </View>
                </View>
            </View>

<<<<<<< HEAD
            {/* Action Buttons (inside edit card) */}
=======
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
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
          <>
            <View style={styles.card}>
              <TouchableOpacity style={styles.editPencilIcon} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil-outline" size={24} color="#007bff" />
              </TouchableOpacity>

              <Text style={styles.subtitleInCard}>View and edit your personal information</Text>

              {/* Personal Information Display */}
              <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={22} color="#007bff" />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              <View style={styles.sectionContent}>
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
              </View>
            </View>

            {/* Glucose Target Display Card */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="stats-chart-outline" size={22} color="#007bff" />
                    <Text style={styles.sectionTitle}>Your Glucose Targets</Text>
                </View>
                <View style={styles.sectionContent}>
                    <View style={styles.detailRow}>
                        <Ionicons name="arrow-down-circle-outline" size={20} color="#007bff" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Min Target: {profile.minGlucoseTarget || DEFAULT_TARGET_MIN} mg/dL</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="arrow-up-circle-outline" size={20} color="#007bff" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Max Target: {profile.maxGlucoseTarget || DEFAULT_TARGET_MAX} mg/dL</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="pulse-outline" size={20} color="#007bff" style={styles.detailIcon} />
                        <Text style={styles.detailText}>
                            Healthy Range: {profile.minGlucoseTarget || DEFAULT_TARGET_MIN} - {profile.maxGlucoseTarget || DEFAULT_TARGET_MAX} mg/dL
                        </Text>
                    </View>
                </View>
            </View>

<<<<<<< HEAD
            {/* New Display Section: Insulin Information */}
=======
            {/* Nova Seção de Visualização: Informação sobre Insulina */}
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="medical-outline" size={22} color="#007bff" />
                    <Text style={styles.sectionTitle}>Insulin Information</Text>
                </View>
                <View style={styles.sectionContent}>
                    <View style={styles.detailRow}>
                        <Ionicons name="speedometer-outline" size={20} color="#007bff" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Fast-Acting Insulin: {profile.fastInsuline || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#007bff" style={styles.detailIcon} />
                        <Text style={styles.detailText}>Slow-Acting Insulin: {profile.slowInsuline || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Utility buttons (Reset) - now directly in scroll view */}
            <View style={styles.utilityButtonContainer}>
                <Text style={styles.subtitleInCard}>Account Options</Text>
                <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetProfile}>
                    <Ionicons name="reload-circle-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.buttonText}>Reset Profile</Text>
                </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CDEEF5', // A visible light blue tone
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
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
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  mainTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF4F8',
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    position: 'relative',
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  subtitleInCard: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  editPencilIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  sectionContent: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
    color: '#007bff',
  },
  detailText: {
    fontSize: 16,
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
    color: '#666',
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
  },
  dateInputButton: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  utilityButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FFC107',
    width: '90%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

<<<<<<< HEAD
export default ProfileScreen;
=======
export default ProfileScreen;
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
