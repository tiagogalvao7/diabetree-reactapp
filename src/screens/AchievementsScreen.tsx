// src/screens/AchievementsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, Platform, ImageSourcePropType } from 'react-native'; // Adicionado ImageSourcePropType
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Para lidar com a área segura

interface GlucoseReading {
    id: string;
    value: number;
    timestamp: string;
}

// AsyncStorage Keys
const GLUCOSE_READINGS_KEY = '@glucose_readings';
const USER_COINS_KEY = '@user_coins';
const ACHIEVEMENTS_KEY = '@unlocked_achievements';
const TREE_MAX_STAGE_KEY = '@tree_max_stage';
const USER_OWNED_TREES_KEY = '@user_owned_trees';

// Interface for a Badge - REMOVIDO lockedImage daqui
interface Badge {
    id: string;
    name: string;
    description: string;
    image: ImageSourcePropType; // Usamos ImageSourcePropType para tipagem correta de require()
    rewardCoins: number; // Coin reward upon unlocking
    checkUnlock: (
        allReadings: GlucoseReading[],
        maxTreeStage: number,
        ownedTreeIds: string[],
        unlockedAchievements: string[]
    ) => boolean;
}

const AchievementsScreen = () => {
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [userCoins, setUserCoins] = useState(0);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets(); // Hook para obter as insets da área segura

    // Helper function to check for N consecutive days of readings (Revised for robustness)
    const checkConsecutiveNDays = (allReadings: GlucoseReading[], N: number): boolean => {
        if (allReadings.length === 0) {
            return false;
        }

        const uniqueDates = Array.from(new Set(allReadings.map(r => new Date(r.timestamp).toISOString().split('T')[0]))).sort(); // Sort dates ascending (YYYY-MM-DD)

        if (uniqueDates.length < N) {
            return false;
        }

        let currentStreak = 0;
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                const currentDate = new Date(uniqueDates[i]);
                const previousDate = new Date(uniqueDates[i - 1]);
                const diffTime = Math.abs(currentDate.getTime() - previousDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate difference in days

                if (diffDays === 1) { // If current date is exactly one day after previous date
                    currentStreak++;
                } else {
                    currentStreak = 1; // Streak broken, start new streak from this day
                }
            }
            if (currentStreak >= N) {
                return true;
            }
        }
        return false;
    };

    // Helper function to check for N consecutive days with healthy levels (Revised for robustness)
    const checkHealthyLevelsStreak = (allReadings: GlucoseReading[], N: number): boolean => {
        if (allReadings.length === 0) {
            return false;
        }

        // Os valores alvo deverão vir do perfil do utilizador, ou de um local centralizado.
        // Por agora, mantemos os exemplos para que a lógica funcione.
        const targetMin = 70; // Example target min (adjust as needed)
        const targetMax = 180; // Example target max (adjust as needed)

        // Group readings by date
        const readingsByDate: { [key: string]: GlucoseReading[] } = {};
        for (const reading of allReadings) {
            const date = new Date(reading.timestamp).toISOString().split('T')[0];
            if (!readingsByDate[date]) {
                readingsByDate[date] = [];
            }
            readingsByDate[date].push(reading);
        }

        const uniqueSortedDates = Object.keys(readingsByDate).sort(); // Sort dates ascending

        let consecutiveHealthyDays = 0;
        let lastProcessedDate: Date | null = null; // Track the last date that was part of a healthy streak

        for (const dateStr of uniqueSortedDates) {
            const readingsForDay = readingsByDate[dateStr];
            const currentDate = new Date(dateStr);

            // Check if there was at least one reading for this day AND all readings were within the target range
            const allReadingsInTarget = readingsForDay.length > 0 && readingsForDay.every(reading =>
                reading.value >= targetMin && reading.value <= targetMax
            );

            if (allReadingsInTarget) {
                if (lastProcessedDate === null) {
                    consecutiveHealthyDays = 1; // Start of a new streak
                } else {
                    const diffTime = Math.abs(currentDate.getTime() - lastProcessedDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) { // If the current day is exactly one day after the last healthy day
                        consecutiveHealthyDays++;
                    } else {
                        consecutiveHealthyDays = 1; // Streak broken, start a new streak from this day
                    }
                }
                lastProcessedDate = currentDate; // Update the last date that contributed to the streak
            } else {
                consecutiveHealthyDays = 0; // Streak broken if no readings or not all in target
                lastProcessedDate = null; // Reset last processed date
            }

            if (consecutiveHealthyDays >= N) {
                return true;
            }
        }
        return false;
    };


    // Define all Badges - REMOVIDO lockedImage de cada badge
    const allBadges: Badge[] = [
        {
            id: 'first_step',
            name: 'First Step',
            description: 'Record 1 glucose reading.',
            image: require('../../assets/images/badges/badge_readings1.png'),
            rewardCoins: 5,
            checkUnlock: (allReadings) => allReadings.length >= 1,
        },
        {
            id: 'hundred_readings',
            name: '100 Readings',
            description: 'Record 100 glucose reading.',
            image: require('../../assets/images/badges/badge_readings100.png'),
            rewardCoins: 10,
            checkUnlock: (allReadings) => allReadings.length >= 100,
        },
        {
            id: '5hundred_readings',
            name: 'Readings Experient',
            description: 'Record 500 glucose reading.',
            image: require('../../assets/images/badges/badge_readings500.png'),
            rewardCoins: 50,
            checkUnlock: (allReadings) => allReadings.length >= 500,
        },
        {
            id: 'thousand_readings',
            name: 'Readings Master',
            description: 'Record 1000 glucose reading.',
            image: require('../../assets/images/badges/badge_readings1000.png'),
            rewardCoins: 100,
            checkUnlock: (allReadings) => allReadings.length >= 1000,
        },
        {
            id: 'consistent_starter',
            name: 'Consistent Starter',
            description: 'Record readings for 3 consecutive days.',
            image: require('../../assets/images/badges/badge_streak3.png'),
            rewardCoins: 5,
            checkUnlock: (allReadings) => checkConsecutiveNDays(allReadings, 3),
        },
        {
            id: 'consistent_reading',
            name: 'Consistent Reader',
            description: 'Record readings for 14 consecutive days.',
            image: require('../../assets/images/badges/badge_streak14.png'),
            rewardCoins: 15,
            checkUnlock: (allReadings) => checkConsecutiveNDays(allReadings, 14),
        },
        {
            id: 'experient_reading',
            name: 'Experient Reader',
            description: 'Record readings for 30 consecutive days.',
            image: require('../../assets/images/badges/badge_streak30.png'),
            rewardCoins: 15,
            checkUnlock: (allReadings) => checkConsecutiveNDays(allReadings, 30),
        },
        {
            id: 'master_reading',
            name: 'Master Reader',
            description: 'Record readings for 90 consecutive days.',
            image: require('../../assets/images/badges/badge_streak90.png'),
            rewardCoins: 50,
            checkUnlock: (allReadings) => checkConsecutiveNDays(allReadings, 90),
        },
        {
            id: 'healthy_levels3',
            name: 'Healthy Levels',
            description: 'Record readings levels within the desired interval for 3 consecutive days.',
            image: require('../../assets/images/badges/badge_healthy3.png'),
            rewardCoins: 20,
            checkUnlock: (allReadings) => checkHealthyLevelsStreak(allReadings, 3),
        },
        {
            id: 'healthy_levels7',
            name: 'Healthy Levels Student',
            description: 'Record readings levels within the desired interval for 7 consecutive days.',
            image: require('../../assets/images/badges/badge_healthy7.png'),
            rewardCoins: 50,
            checkUnlock: (allReadings) => checkHealthyLevelsStreak(allReadings, 7),
        },
        {
            id: 'healthy_levels14',
            name: 'Healthy Levels Experient',
            description: 'Record readings levels within the desired interval for 14 consecutive days.',
            image: require('../../assets/images/badges/badge_healthy14.png'),
            rewardCoins: 100,
            checkUnlock: (allReadings) => checkHealthyLevelsStreak(allReadings, 14),
        },
        {
            id: 'healthy_levels30',
            name: 'Healthy Levels Master',
            description: 'Record readings levels within the desired interval for 30 consecutive days.',
            image: require('../../assets/images/badges/badge_healthy30.png'),
            rewardCoins: 250,
            checkUnlock: (allReadings) => checkHealthyLevelsStreak(allReadings, 30),
        },
        {
            id: 'first_tree_bought',
            name: 'First Tree',
            description: 'Buy your first tree.',
            image: require('../../assets/images/badges/badge_tree1.png'),
            rewardCoins: 100,
            checkUnlock: (allReadings, maxTreeStage, ownedTreeIds) => ownedTreeIds.length > 1 || (ownedTreeIds.length === 1 && ownedTreeIds[0] !== 'normal_tree'),
        },
        {
            id: 'three_trees_bought',
            name: 'Three Trees',
            description: 'Buy three trees.',
            image: require('../../assets/images/badges/badge_tree3.png'),
            rewardCoins: 300,
            checkUnlock: (allReadings, maxTreeStage, ownedTreeIds) => ownedTreeIds.length >= 3,
        },
        {
            id: 'five_trees_bought',
            name: 'Tree Collector',
            description: 'Buy five trees.',
            image: require('../../assets/images/badges/badge_tree5.png'),
            rewardCoins: 300,
            checkUnlock: (allReadings, maxTreeStage, ownedTreeIds) => ownedTreeIds.length >= 5, // Corrigido de 3 para 5
        }
    ];

    const loadAchievementsAndCoins = useCallback(async () => {
        try {
            const storedCoins = await AsyncStorage.getItem(USER_COINS_KEY);
            const currentCoins = storedCoins != null ? parseInt(storedCoins, 10) : 0;
            setUserCoins(currentCoins);

            const storedAchievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
            const initialUnlocked = storedAchievements != null ? JSON.parse(storedAchievements) : [];
            setUnlockedAchievements(initialUnlocked);

            const jsonReadings = await AsyncStorage.getItem(GLUCOSE_READINGS_KEY);
            const allReadings: GlucoseReading[] = jsonReadings != null ? JSON.parse(jsonReadings) : [];

            const storedMaxStage = await AsyncStorage.getItem(TREE_MAX_STAGE_KEY);
            const maxTreeStage = storedMaxStage != null ? parseInt(storedMaxStage, 10) : 1;

            const ownedTreesJson = await AsyncStorage.getItem(USER_OWNED_TREES_KEY);
            // Certifica-te de que 'normal_tree' é o ID do primeiro/default tree
            const ownedTreeIds: string[] = ownedTreesJson != null ? JSON.parse(ownedTreesJson) : ['normal_tree'];


            let updatedUnlockedAchievements = [...initialUnlocked];
            let newCoinsEarned = 0;

            for (const badge of allBadges) {
                if (!updatedUnlockedAchievements.includes(badge.id)) {
                    // Passa 'unlockedAchievements' para o checkUnlock se a lógica depender de outros badges desbloqueados
                    if (badge.checkUnlock(allReadings, maxTreeStage, ownedTreeIds, updatedUnlockedAchievements)) {
                        updatedUnlockedAchievements.push(badge.id);
                        newCoinsEarned += badge.rewardCoins;
                        // Pode-se considerar mostrar um modal ou toast mais amigável do que Alert.alert para melhor UX
                        Alert.alert("Achievement Unlocked!", `"${badge.name}" unlocked! You earned ${badge.rewardCoins} coins.`);
                    }
                }
            }

            if (newCoinsEarned > 0) {
                const finalCoins = currentCoins + newCoinsEarned;
                await AsyncStorage.setItem(USER_COINS_KEY, finalCoins.toString());
                setUserCoins(finalCoins);
            }

            if (updatedUnlockedAchievements.length > initialUnlocked.length) {
                await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedUnlockedAchievements));
                setUnlockedAchievements(updatedUnlockedAchievements);
            }

        } catch (e) {
            console.error("Failed to load or update achievements/coins:", e);
            Alert.alert("Error", "Could not load your achievements.");
        }
    }, [allBadges]); // allBadges como dependência para useCallback

    useFocusEffect(
        useCallback(() => {
            loadAchievementsAndCoins();
        }, [loadAchievementsAndCoins])
    );

    const sortedBadges = [...allBadges].sort((a, b) => {
        const aUnlocked = unlockedAchievements.includes(a.id);
        const bUnlocked = unlockedAchievements.includes(b.id);

        if (aUnlocked && !bUnlocked) {
            return -1; // Desbloqueados primeiro
        }
        if (!aUnlocked && bUnlocked) {
            return 1; // Bloqueados depois
        }
        // Se ambos estão desbloqueados ou bloqueados, mantém a ordem original (ou podes adicionar outro critério de ordenação)
        return 0;
    });

    return (
        // Use SafeAreaView or adjust padding based on insets for better iOS/Android Notch handling
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 0) }]}>
            {/* Custom Back Button - Fixed at top-left */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { top: insets.top + (Platform.OS === 'android' ? 10 : 0) }]} // Adjust top based on safe area
            >
                <Ionicons name="arrow-back" size={30} color="#333" />
            </TouchableOpacity>

            {/* Main Title/Trophy Section - This will now appear below the back button */}
            <View style={styles.mainTitleContainer}>
                <Ionicons name="trophy" size={36} color="#FFD700" style={styles.headerIcon} />
                <Text style={styles.title}>Your Achievements</Text>
            </View>

            <View style={styles.coinsContainer}>
                <Text style={styles.coinsText}>💰 {userCoins}</Text>
            </View>

            <View style={styles.badgesGrid}>
                {sortedBadges.map((badge) => {
                    const isUnlocked = unlockedAchievements.includes(badge.id);
                    return (
                        <View key={badge.id} style={styles.badgeItem}>
                            <Image
                                source={badge.image} // AGORA SEMPRE USA A IMAGEM PRINCIPAL
                                style={[styles.badgeImage, !isUnlocked && styles.lockedBadge]} // APLICA ESTILO CONDICIONALMENTE
                            />
                            <Text style={styles.badgeName}>{badge.name}</Text>
                            <Text style={styles.badgeDescription}>{badge.description}</Text>
                            {isUnlocked ? (
                                <Text style={styles.badgeStatusUnlocked}>Unlocked!</Text>
                            ) : (
                                <Text style={styles.badgeStatusLocked}>Locked</Text>
                            )}
                            <Text style={styles.badgeReward}>Reward: {badge.rewardCoins} 💰</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#E0F2F7',
        // paddingTop will be set dynamically using insets
    },
    backButton: {
        position: 'absolute',
        left: 20, // Keep it from the very edge
        zIndex: 10, // Ensure it's above other elements
        // top will be set dynamically using insets
    },
    mainTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 50, // Adjusted margin to provide space below the absolute back button
        justifyContent: 'center', // Center the trophy and title
        width: '100%', // Ensure it takes full width for centering
    },
    headerIcon: {
        marginRight: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
    },
    coinsContainer: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    coinsText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#555',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
    },
    badgeItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        margin: 10,
        alignItems: 'center',
        width: 150, // Fixed width for consistent layout
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    badgeImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    // ESTILO PARA BADGES BLOQUEADOS - AQUI ESTÁ A CHAVE!
    lockedBadge: {
        tintColor: 'grey', // Isso vai "pintar" a imagem de cinzento
        opacity: 0.6,      // E torná-la ligeiramente transparente
    },
    badgeName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    badgeDescription: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666',
        marginBottom: 8,
    },
    badgeStatusUnlocked: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#28a745', // Verde para desbloqueado
    },
    badgeStatusLocked: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#dc3545', // Vermelho para bloqueado
    },
    badgeReward: {
        fontSize: 12,
        color: '#007bff',
        marginTop: 5,
        fontWeight: 'bold',
    },
});

export default AchievementsScreen;