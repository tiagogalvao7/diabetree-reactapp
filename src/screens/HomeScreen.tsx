// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';

import { AppStackParamList, MainTabParamList } from '../navigation/AppNavigator';

interface GlucoseReading {
    id: string;
    value: number;
    timestamp: string;
}

interface TreeItem {
    id: string;
    name: string;
    collectionImage: any;
    stage5Image?: any;
}

type HomeScreenNavigationProp = CompositeNavigationProp<
    NavigationProp<MainTabParamList, 'Home'>,
    NavigationProp<AppStackParamList>
>;

const TREE_MAX_STAGE_KEY = '@tree_max_stage';
const USER_COINS_KEY = '@user_coins';
const EQUIPPED_TREE_KEY = '@equipped_tree_id';
const USER_OWNED_TREES_KEY = '@user_owned_trees';
const LAST_PROGRESS_EVALUATION_DATE_KEY = '@last_progress_evaluation_date';
const DAILY_COIN_BONUS_CLAIMED_KEY = '@daily_coin_bonus_claimed';

// These are the *cumulative* unique on-target readings needed to *reach* each stage.
// For example, to reach Stage 2, you need 7 unique on-target readings.
// To reach Stage 3, you need 7 + 10 = 17 unique on-target readings.
const CUMULATIVE_STAGE_REQUIREMENTS: { [key: number]: number } = {
    1: 0,  // You are at stage 1 with 0 unique on-target readings (just starting)
    2: 7,  // To get to stage 2, you need 7 unique on-target readings (>= 7 and < 17)
    3: 17, // To get to stage 3, you need 17 unique on-target readings (>= 17 and < 37)
    4: 37, // To get to stage 4, you need 37 unique on-target readings (>= 37)
};

const MAX_GENERIC_TREE_STAGE = 4;
const API_BASE_URL = 'http://192.168.2.214:3000'; // Make sure this is your correct IP
const MIN_TIME_BETWEEN_READINGS_FOR_PROGRESS = 5 * 60 * 1000; // 5 minutes in milliseconds

const calculateTreeMetrics = (allReadings: GlucoseReading[]): { uniqueOnTargetReadingsCount: number; recentUniqueReadingsCount: number; } => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const validRecentReadings: GlucoseReading[] = [];
    let lastValidReadingTime = 0;

    const sortedReadings = [...allReadings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const reading of sortedReadings) {
        const readingTime = new Date(reading.timestamp).getTime();
        // Only consider readings from the last 7 days
        if (readingTime >= sevenDaysAgo.getTime()) {
            // Check if it's the first valid reading OR if 5 minutes have passed since the last valid one
            if (validRecentReadings.length === 0 || (readingTime - lastValidReadingTime >= MIN_TIME_BETWEEN_READINGS_FOR_PROGRESS)) {
                validRecentReadings.push(reading);
                lastValidReadingTime = readingTime;
            }
        }
    }

    const targetMin = 70;
    const targetMax = 180;

    const uniqueOnTargetReadings = validRecentReadings.filter(reading =>
        reading.value >= targetMin && reading.value <= targetMax
    );

    return { 
        uniqueOnTargetReadingsCount: uniqueOnTargetReadings.length, // Number of unique, on-target readings in last 7 days
        recentUniqueReadingsCount: validRecentReadings.length, // Total unique readings in last 7 days (on-target or not)
    };
};

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [currentTreeStage, setCurrentTreeStage] = useState(0); // 0 indicates not yet loaded
    const [uniqueOnTargetReadingsCount, setUniqueOnTargetReadingsCount] = useState(0); // Total unique on-target readings from API
    const [recentUniqueReadingsCount, setRecentUniqueReadingsCount] = useState(0); // Total unique readings (on-target or not)
    const [treeProgressPercentage, setTreeProgressPercentage] = useState(0);
    const [userCoins, setUserCoins] = useState(0);
    const [equippedTreeId, setEquippedTreeId] = useState<string>('normal_tree');
    const [isDataLoading, setIsDataLoading] = useState(true);

    const treeImageFadeAnim = useRef(new Animated.Value(0)).current;
    const treeImageScaleAnim = useRef(new Animated.Value(0.8)).current;
    const logoTitleTranslateY = useRef(new Animated.Value(-50)).current;
    const logoTitleOpacity = useRef(new Animated.Value(0)).current;

    const pulseScaleAnim = useRef(new Animated.Value(1)).current;
    const pulseTranslateYAnim = useRef(new Animated.Value(0)).current;

    const allCollectableTrees: TreeItem[] = [
        {
            id: 'normal_tree',
            name: 'Normal Tree',
            collectionImage: require('../../assets/images/trees/normal_tree.png'),
            stage5Image: require('../../assets/images/trees/normal_tree.png'),
        },
        {
            id: 'oak',
            name: 'Oak Tree',
            collectionImage: require('../../assets/images/trees/oak_tree_stage5.png'),
            stage5Image: require('../../assets/images/trees/oak_tree_stage5.png'),
        },
        {
            id: 'willow',
            name: 'Willow Tree',
            collectionImage: require('../../assets/images/trees/willow_tree_stage5.png'),
            stage5Image: require('../../assets/images/trees/willow_tree_stage5.png'),
        },
        {
            id: 'pine',
            name: 'Pine Tree',
            collectionImage: require('../../assets/images/trees/pine_tree_stage5.png'),
            stage5Image: require('../../assets/images/trees/pine_tree_stage5.png'),
        }
    ];

    const getEquippedTree = () => allCollectableTrees.find(tree => tree.id === equippedTreeId) || allCollectableTrees[0];

    const fetchGlucoseReadings = useCallback(async (): Promise<GlucoseReading[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/glucoseReadings`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
                return [];
            }
            const data = await response.json();
            return data as GlucoseReading[];
        } catch (error) {
            console.error("Failed to fetch glucose readings from API:", error);
            Alert.alert("Connection Error", "Could not fetch glucose readings from the local API. Check if json-server is running, your machine's IP is correct, and firewall is not blocking.");
            return [];
        }
    }, []);

    const loadAndCalculateTreeStage = useCallback(async () => {
        // Set loading to true only if tree stage is not yet determined (first load)
        // or if we explicitly want to show loading on subsequent refreshes.
        // For flicker reduction, we only show it initially if currentTreeStage is 0.
        if (currentTreeStage === 0) { 
            setIsDataLoading(true);
        }

        try {
            const allReadings = await fetchGlucoseReadings();
            
            let currentCoins = parseInt(await AsyncStorage.getItem(USER_COINS_KEY) || '0', 10);
            setUserCoins(currentCoins);

            let previousMaxStageInStorage = parseInt(await AsyncStorage.getItem(TREE_MAX_STAGE_KEY) || '1', 10);
            previousMaxStageInStorage = Math.max(1, Math.min(previousMaxStageInStorage, MAX_GENERIC_TREE_STAGE));

            const storedEquippedTree = await AsyncStorage.getItem(EQUIPPED_TREE_KEY);
            const ownedTreesJson = await AsyncStorage.getItem(USER_OWNED_TREES_KEY);
            const ownedTreeIds: string[] = ownedTreesJson != null ? JSON.parse(ownedTreesJson) : ['normal_tree'];

            if (storedEquippedTree && ownedTreeIds.includes(storedEquippedTree)) {
                setEquippedTreeId(storedEquippedTree);
            } else {
                await AsyncStorage.setItem(EQUIPPED_TREE_KEY, 'normal_tree');
                setEquippedTreeId('normal_tree');
            }

            const { uniqueOnTargetReadingsCount: calculatedUniqueOnTarget, recentUniqueReadingsCount: calculatedRecentUnique } = calculateTreeMetrics(allReadings);
            setUniqueOnTargetReadingsCount(calculatedUniqueOnTarget);
            setRecentUniqueReadingsCount(calculatedRecentUnique);

            let newTreeStageToShow = previousMaxStageInStorage;

            // Determine the new tree stage based on cumulative unique on-target readings
            let determinedStage = 1;
            if (calculatedUniqueOnTarget >= CUMULATIVE_STAGE_REQUIREMENTS[4]) {
                determinedStage = 4;
            } else if (calculatedUniqueOnTarget >= CUMULATIVE_STAGE_REQUIREMENTS[3]) {
                determinedStage = 3;
            } else if (calculatedUniqueOnTarget >= CUMULATIVE_STAGE_REQUIREMENTS[2]) {
                determinedStage = 2;
            } else {
                determinedStage = 1;
            }

            // Check for stage changes and alert user
            if (determinedStage > previousMaxStageInStorage) {
                newTreeStageToShow = determinedStage;
                Alert.alert("Congratulations!", `Your tree grew to level ${newTreeStageToShow}! Keep up the good work!`);
                await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
            } else if (determinedStage < previousMaxStageInStorage) {
                newTreeStageToShow = determinedStage;
                Alert.alert("Oh no!", `Your tree regressed to level ${newTreeStageToShow}. Focus on consistent readings to help it recover!`);
                await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
            } else {
                newTreeStageToShow = previousMaxStageInStorage;
            }

            // Ensure the stage never goes below 1
            if (newTreeStageToShow < 1) {
                newTreeStageToShow = 1;
            }

            setCurrentTreeStage(newTreeStageToShow);

            // --- Daily Coin Bonus Logic ---
            const lastEvaluationDate = await AsyncStorage.getItem(LAST_PROGRESS_EVALUATION_DATE_KEY);
            const today = new Date().toISOString().slice(0, 10);
            if (!lastEvaluationDate || lastEvaluationDate < today) {
                await AsyncStorage.setItem(LAST_PROGRESS_EVALUATION_DATE_KEY, today);
                await AsyncStorage.removeItem(DAILY_COIN_BONUS_CLAIMED_KEY); // Reset daily bonus flag

                const targetMin = 70;
                const targetMax = 180;
                const readingsInTargetToday = allReadings.filter(r => 
                    new Date(r.timestamp).toISOString().slice(0,10) === today &&
                    r.value >= targetMin && r.value <= targetMax
                ).length;

                const dailyBonusClaimed = await AsyncStorage.getItem(DAILY_COIN_BONUS_CLAIMED_KEY);
                if (!dailyBonusClaimed && readingsInTargetToday > 0) { // Only award if there's at least one on-target reading today
                    let coinsToAdd = 0;
                    // Award coins based on the current tree stage
                    if (newTreeStageToShow === 4) coinsToAdd = 50;
                    else if (newTreeStageToShow === 3) coinsToAdd = 30;
                    else if (newTreeStageToShow === 2) coinsToAdd = 10;

                    if (coinsToAdd > 0) {
                        currentCoins += coinsToAdd;
                        await AsyncStorage.setItem(USER_COINS_KEY, currentCoins.toString());
                        await AsyncStorage.setItem(DAILY_COIN_BONUS_CLAIMED_KEY, 'true');
                        Alert.alert("Daily Bonus!", `You earned ${coinsToAdd} coins for your health today!`);
                    }
                }
            }
            setUserCoins(currentCoins);

            // --- Calculate Progress Bar Percentage ---
            let progressForBar = 0;
            const currentStageCumulativeRequirement = CUMULATIVE_STAGE_REQUIREMENTS[newTreeStageToShow] || 0;
            const nextStageCumulativeRequirement = CUMULATIVE_STAGE_REQUIREMENTS[newTreeStageToShow + 1];

            if (newTreeStageToShow < MAX_GENERIC_TREE_STAGE) {
                // Progress within the current stage towards the next
                const progressSinceLastStage = calculatedUniqueOnTarget - currentStageCumulativeRequirement;
                const requirementForNextSegment = nextStageCumulativeRequirement - currentStageCumulativeRequirement;
                
                if (requirementForNextSegment > 0) {
                    progressForBar = Math.min(progressSinceLastStage / requirementForNextSegment, 1);
                } else {
                    progressForBar = 0; // Should not happen with correctly set requirements
                }
            } else {
                progressForBar = 1; // Tree is at max stage, bar is full
            }
            setTreeProgressPercentage(progressForBar);

        } catch (e) {
            console.error("Failed to load glucose data for tree stage:", e);
            Alert.alert("Error", "Could not update tree status. Check API connection and data format.");
            setCurrentTreeStage(1); // Fallback to stage 1 on error
            setTreeProgressPercentage(0);
            setUniqueOnTargetReadingsCount(0);
            setRecentUniqueReadingsCount(0);
        } finally {
            setIsDataLoading(false);
        }
    }, [fetchGlucoseReadings, currentTreeStage]); // Added currentTreeStage to dependencies


    // Animations logic remains the same
    const startAnimations = useCallback(() => {
        if (currentTreeStage > 0) {
            treeImageFadeAnim.stopAnimation();
            treeImageScaleAnim.stopAnimation();
            logoTitleTranslateY.stopAnimation();
            logoTitleOpacity.stopAnimation();
            pulseScaleAnim.stopAnimation();
            pulseTranslateYAnim.stopAnimation();

            treeImageFadeAnim.setValue(0);
            treeImageScaleAnim.setValue(0.8);
            logoTitleTranslateY.setValue(-50);
            logoTitleOpacity.setValue(0);
            pulseScaleAnim.setValue(1);
            pulseTranslateYAnim.setValue(0);

            const entranceAnimation = Animated.parallel([
                Animated.timing(treeImageFadeAnim, { toValue: 1, duration: 1200, easing: Easing.ease, useNativeDriver: true }),
                Animated.spring(treeImageScaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
                Animated.timing(logoTitleTranslateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(logoTitleOpacity, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            ]);

            const plantPulseAnimation = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(pulseScaleAnim, { toValue: 1.02, duration: 1500, easing: Easing.ease, useNativeDriver: true }),
                        Animated.timing(pulseScaleAnim, { toValue: 1, duration: 1500, easing: Easing.ease, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.timing(pulseTranslateYAnim, { toValue: -2, duration: 1500, easing: Easing.ease, useNativeDriver: true }),
                        Animated.timing(pulseTranslateYAnim, { toValue: 0, duration: 1500, easing: Easing.ease, useNativeDriver: true }),
                    ]),
                ]),
                { iterations: -1 }
            );

            entranceAnimation.start(() => {
                plantPulseAnimation.start();
            });
        }
    }, [
        currentTreeStage,
        treeImageFadeAnim, treeImageScaleAnim,
        logoTitleTranslateY, logoTitleOpacity,
        pulseScaleAnim, pulseTranslateYAnim
    ]);

    useFocusEffect(
        useCallback(() => {
            loadAndCalculateTreeStage();
            return () => {
                treeImageFadeAnim.stopAnimation();
                treeImageScaleAnim.stopAnimation();
                logoTitleTranslateY.stopAnimation();
                logoTitleOpacity.stopAnimation();
                pulseScaleAnim.stopAnimation();
                pulseTranslateYAnim.stopAnimation();
            };
        }, [loadAndCalculateTreeStage])
    );

    useEffect(() => {
        if (currentTreeStage > 0) {
            startAnimations();
        }
    }, [currentTreeStage, startAnimations]);


    const getTreeImageSource = () => {
        const equippedTree = getEquippedTree();
        const stageToDisplay = currentTreeStage > 0 ? currentTreeStage : 1;

        if (stageToDisplay === MAX_GENERIC_TREE_STAGE && equippedTree.stage5Image) {
            return equippedTree.stage5Image;
        } else {
            switch (stageToDisplay) {
                case 1: return require('../../assets/images/trees/tree_stage_1.png');
                case 2: return require('../../assets/images/trees/tree_stage_2.png');
                case 3: return require('../../assets/images/trees/tree_stage_3.png');
                case 4: return require('../../assets/images/trees/tree_stage_4.png');
                default: return require('../../assets/images/trees/tree_stage_1.png');
            }
        }
    };

    const handleGoToProfile = () => {
        navigation.navigate('Profile');
    };

    const handleGoToAchievements = () => {
        navigation.navigate('Achievements', {});
    };

    const getDynamicMessage = () => {
        if (currentTreeStage === MAX_GENERIC_TREE_STAGE) {
            if (equippedTreeId !== 'normal_tree') {
                return `Your tree is flourishing! You're currently displaying the ${getEquippedTree().name}.`;
            }
            return "Your tree is flourishing! Excellent work, keep monitoring your health to maintain it!";
        }

        const requiredForNextStage = CUMULATIVE_STAGE_REQUIREMENTS[currentTreeStage + 1];
        if (requiredForNextStage === undefined) { // Fallback for last stage or if requirements are not fully defined
            return `Keep up the great work to make your tree grow!`;
        }
        
        const readingsNeeded = requiredForNextStage - uniqueOnTargetReadingsCount;

        if (readingsNeeded > 0) {
            return `Record ${readingsNeeded} more unique on-target readings for your tree to level up to Level ${currentTreeStage + 1}. Keep up the good work!`;
        }

        return "Keep monitoring your glucose to watch your Diabetree grow!";
    };

    const getProgressLabelText = () => {
        if (currentTreeStage < MAX_GENERIC_TREE_STAGE) {
            return `Progress to Level ${currentTreeStage + 1}:`;
        }
        return `Tree fully grown!`;
    };

    const getProgressCounterText = () => {
        if (currentTreeStage < MAX_GENERIC_TREE_STAGE) {
            const currentStageCumulativeRequirement = CUMULATIVE_STAGE_REQUIREMENTS[currentTreeStage] || 0;
            const nextStageCumulativeRequirement = CUMULATIVE_STAGE_REQUIREMENTS[currentTreeStage + 1];
            
            // Calculate progress specifically for the current stage segment
            const progressSinceLastStage = Math.max(0, uniqueOnTargetReadingsCount - currentStageCumulativeRequirement);
            const requirementForNextSegment = nextStageCumulativeRequirement - currentStageCumulativeRequirement;

            if (requirementForNextSegment > 0) {
                return `${progressSinceLastStage} out of ${requirementForNextSegment} on-target readings.`;
            }
            return ``; // Should not happen if requirements are set correctly
        }
        return ``;
    };

    // The key change is here: conditionally render the loader.
    // It will only show if `isDataLoading` is true AND `currentTreeStage` is 0 (meaning data hasn't loaded yet).
    // On subsequent loads (when currentTreeStage > 0), the existing UI will remain visible.
    if (isDataLoading && currentTreeStage === 0) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading data from API...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                <View style={styles.topRightButtonsContainer}>
                    <TouchableOpacity style={styles.achievementsButton} onPress={handleGoToAchievements}>
                        <Ionicons name="trophy-outline" size={36} color="#FFD700" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileButton} onPress={handleGoToProfile}>
                        <Ionicons name="person-circle-outline" size={36} color="#007bff" />
                    </TouchableOpacity>
                </View>

                <Animated.View
                    style={[
                        styles.titleContainer,
                        {
                            transform: [{ translateY: logoTitleTranslateY }],
                            opacity: logoTitleOpacity,
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/images/others/diabetes_logo.png')}
                        style={styles.logoImage}
                    />
                    <Text style={styles.title}>Diabetree!</Text>
                </Animated.View>

                <Text style={styles.subtitle}>Monitor your health, make your tree grow.</Text>

                <View style={styles.coinsContainer}>
                    <Text style={styles.coinsText}>💰 {userCoins}</Text>
                </View>

                {/* This conditional rendering for the tree image remains,
                    but now the *entire screen* loader (above) handles the initial state. */}
                {currentTreeStage > 0 ? (
                    <Animated.Image
                        source={getTreeImageSource()}
                        style={[
                            styles.treeImage,
                            {
                                opacity: treeImageFadeAnim,
                                transform: [
                                    { scale: Animated.multiply(treeImageScaleAnim, pulseScaleAnim) },
                                    { translateY: pulseTranslateYAnim },
                                ],
                            },
                        ]}
                    />
                ) : (
                    // This placeholder will now only be shown if currentTreeStage is 0
                    // and the *initial* loading screen (the 'if (isDataLoading && currentTreeStage === 0)' block)
                    // has already finished its initial check, or if there's a very unusual state.
                    // In practice, the initial loader should prevent this from being seen much.
                    <View style={styles.treeImagePlaceholder}>
                       <ActivityIndicator size="large" color="#007bff" />
                       <Text>Loading tree...</Text>
                    </View>
                )}


                <Text style={styles.treeStatusText}>
                    Tree Level: {currentTreeStage}
                    {currentTreeStage === 1 && ' (Needs attention)'}
                    {currentTreeStage === 2 && ' (Recovering)'}
                    {currentTreeStage === 3 && ' (Healthy)'}
                    {currentTreeStage === MAX_GENERIC_TREE_STAGE && ' (Flourishing!)'}
                </Text>

                <Text style={styles.dynamicMessageText}>{getDynamicMessage()}</Text>

                <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>{getProgressLabelText()}</Text>
                    <Progress.Bar
                        progress={treeProgressPercentage}
                        width={250}
                        height={15}
                        color={'#28a745'}
                        unfilledColor={'#e0e0e0'}
                        borderColor={'#ccc'}
                        borderRadius={10}
                    />
                    <Text style={styles.progressText}>
                        {`Completed: ${(treeProgressPercentage * 100).toFixed(0)}%`}
                    </Text>
                    <Text style={styles.progressHintText}>
                        {getProgressCounterText()}
                    </Text>
                </View>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#E0F2F7',
        width: '100%',
        paddingTop: 60,
    },
    topRightButtonsContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
        flexDirection: 'row',
        gap: 10,
    },
    profileButton: {},
    achievementsButton: {},
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    logoImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: 10,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    coinsContainer: {
        marginBottom: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    coinsText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#555',
    },
    treeImage: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
        marginBottom: 20,
        marginTop: 20,
        borderRadius: 10,
    },
    treeImagePlaceholder: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
    },
    treeStatusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
    },
    dynamicMessageText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#0056b3',
        textAlign: 'center',
        marginBottom: 20,
        marginHorizontal: 20,
    },
    progressBarWrapper: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        width: '90%',
    },
    progressLabel: {
        fontSize: 15,
        color: '#555',
        marginBottom: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressText: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    progressHintText: {
        fontSize: 13,
        color: '#777',
        marginTop: 5,
        textAlign: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0F2F7',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#555',
    },
});

export default HomeScreen;