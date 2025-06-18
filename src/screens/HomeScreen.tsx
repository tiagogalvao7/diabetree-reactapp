// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation, NavigationProp, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';

// Import BOTH parameter lists
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
const MIN_REQUIRED_READINGS_FOR_EVALUATION = 7;
const USER_COINS_KEY = '@user_coins';
const EQUIPPED_TREE_KEY = '@equipped_tree_id';
const USER_OWNED_TREES_KEY = '@user_owned_trees';

const STAGE_PROGRESS_REQUIREMENTS: { [key: number]: number } = {
    1: 7,
    2: 10,
    3: 20,
    4: 0,
};

const MAX_GENERIC_TREE_STAGE = 4;

const calculatePotentialTreeStage = (allReadings: GlucoseReading[]): { potentialStage: number; recentCount: number; percentageInTarget: number } => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReadings = allReadings.filter(reading =>
        new Date(reading.timestamp).getTime() >= sevenDaysAgo.getTime()
    );

    const recentReadingsCount = recentReadings.length;

    let percentageInTarget = 0;
    let potentialStage = 1;

    if (recentReadingsCount < MIN_REQUIRED_READINGS_FOR_EVALUATION) {
        percentageInTarget = (recentReadingsCount / MIN_REQUIRED_READINGS_FOR_EVALUATION) * 100;
        potentialStage = 1;
        return { potentialStage: potentialStage, recentCount: recentReadingsCount, percentageInTarget: percentageInTarget };
    }

    const targetMin = 70;
    const targetMax = 180;

    const readingsInTarget = recentReadings.filter(reading =>
        reading.value >= targetMin && reading.value <= targetMax
    ).length;

    percentageInTarget = (readingsInTarget / recentReadingsCount) * 100;

    if (percentageInTarget >= 80) {
        potentialStage = 4;
    } else if (percentageInTarget >= 55) {
        potentialStage = 3;
    } else if (percentageInTarget >= 30) {
        potentialStage = 2;
    } else {
        potentialStage = 1;
    }

    return { potentialStage: potentialStage, recentCount: recentReadingsCount, percentageInTarget: percentageInTarget };
};

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [currentTreeStage, setCurrentTreeStage] = useState(1);
    const [totalGlucoseReadingsCount, setTotalGlucoseReadingsCount] = useState(0);
    const [recentGlucoseReadingsCount, setRecentGlucoseReadingsCount] = useState(0);
    const [treeProgressPercentage, setTreeProgressPercentage] = useState(0);
    const [maxTreeStageReached, setMaxTreeStageReached] = useState(1);
    const [readingsInCurrentStageCount, setReadingsInCurrentStageCount] = useState(0);
    const [userCoins, setUserCoins] = useState(0);
    const [equippedTreeId, setEquippedTreeId] = useState<string>('normal_tree');

    // --- Variáveis de Animação ---
    const treeImageFadeAnim = useRef(new Animated.Value(0)).current;
    const treeImageScaleAnim = useRef(new Animated.Value(0.8)).current;
    const logoTitleTranslateY = useRef(new Animated.Value(-50)).current;
    const logoTitleOpacity = useRef(new Animated.Value(0)).current;

    // NOVAS VARIÁVEIS PARA ANIMAÇÃO DE PULSAÇÃO DA PLANTA
    const pulseScaleAnim = useRef(new Animated.Value(1)).current;
    const pulseTranslateYAnim = useRef(new Animated.Value(0)).current;
    // --- Fim Variáveis de Animação ---


    const allCollectableTrees: TreeItem[] = [
        {
            id: 'normal_tree',
            name: 'Normal Tree',
            collectionImage: require('../../assets/images/normal_tree.png'),
            stage5Image: require('../../assets/images/normal_tree.png'),
        },
        {
            id: 'oak',
            name: 'Oak Tree',
            collectionImage: require('../../assets/images/oak_tree_stage5.png'),
            stage5Image: require('../../assets/images/oak_tree_stage5.png'),
        },
        {
            id: 'willow',
            name: 'Willow Tree',
            collectionImage: require('../../assets/images/willow_tree_stage5.png'),
            stage5Image: require('../../assets/images/willow_tree_stage5.png'),
        },
        {
            id: 'pine',
            name: 'Pine Tree',
            collectionImage: require('../../assets/images/pine_tree_stage5.png'),
            stage5Image: require('../../assets/images/pine_tree_stage5.png'),
        }
    ];

    const getEquippedTree = () => allCollectableTrees.find(tree => tree.id === equippedTreeId) || allCollectableTrees[0];

    const loadAndCalculateTreeStage = useCallback(async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@glucose_readings');
            const allReadings: GlucoseReading[] = jsonValue != null ? JSON.parse(jsonValue) : [];

            setTotalGlucoseReadingsCount(allReadings.length);

            const storedCoins = await AsyncStorage.getItem(USER_COINS_KEY);
            const currentCoins = storedCoins != null ? parseInt(storedCoins, 10) : 0;
            setUserCoins(currentCoins);

            const storedMaxStage = await AsyncStorage.getItem(TREE_MAX_STAGE_KEY);
            const previousMaxStageInStorage = storedMaxStage != null ? parseInt(storedMaxStage, 10) : 1;

            const storedEquippedTree = await AsyncStorage.getItem(EQUIPPED_TREE_KEY);
            const ownedTreesJson = await AsyncStorage.getItem(USER_OWNED_TREES_KEY);
            const ownedTreeIds: string[] = ownedTreesJson != null ? JSON.parse(ownedTreesJson) : ['normal_tree'];

            if (storedEquippedTree && ownedTreeIds.includes(storedEquippedTree)) {
                setEquippedTreeId(storedEquippedTree);
            } else {
                await AsyncStorage.setItem(EQUIPPED_TREE_KEY, 'normal_tree');
                setEquippedTreeId('normal_tree');
            }

            const { potentialStage, recentCount, percentageInTarget } = calculatePotentialTreeStage(allReadings);

            setRecentGlucoseReadingsCount(recentCount);

            let newTreeStageToShow = previousMaxStageInStorage;
            let hasLeveledUp = false;

            const storedReadingsInCurrentStage = await AsyncStorage.getItem(`@tree_stage_progress_${previousMaxStageInStorage}`);
            let currentReadingsInStage = storedReadingsInCurrentStage != null ? parseInt(storedReadingsInCurrentStage, 10) : 0;

            const readingsRequiredForNextStage = STAGE_PROGRESS_REQUIREMENTS[previousMaxStageInStorage] || 0;

            if (previousMaxStageInStorage <= MAX_GENERIC_TREE_STAGE) {
                if (recentCount >= MIN_REQUIRED_READINGS_FOR_EVALUATION && percentageInTarget >= (
                    previousMaxStageInStorage === 1 ? 30 :
                    previousMaxStageInStorage === 2 ? 55 :
                    previousMaxStageInStorage === 3 ? 80 :
                    0
                ) && currentReadingsInStage < readingsRequiredForNextStage) {
                    currentReadingsInStage += 1;
                    await AsyncStorage.setItem(`@tree_stage_progress_${previousMaxStageInStorage}`, currentReadingsInStage.toString());
                } else if (recentCount < MIN_REQUIRED_READINGS_FOR_EVALUATION && previousMaxStageInStorage === 1) {
                    currentReadingsInStage = Math.min(recentCount, readingsRequiredForNextStage);
                    await AsyncStorage.setItem(`@tree_stage_progress_${previousMaxStageInStorage}`, currentReadingsInStage.toString());
                }
            }
            setReadingsInCurrentStageCount(currentReadingsInStage);

            if (potentialStage > previousMaxStageInStorage && previousMaxStageInStorage < MAX_GENERIC_TREE_STAGE) {
                if (currentReadingsInStage >= readingsRequiredForNextStage) {
                    newTreeStageToShow = previousMaxStageInStorage + 1;
                    Alert.alert("Congratulations!", `Your tree grew to level ${newTreeStageToShow}! Keep up the good work!`);
                    hasLeveledUp = true;
                    await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
                    await AsyncStorage.setItem(`@tree_stage_progress_${newTreeStageToShow}`, '0');
                    setReadingsInCurrentStageCount(0);
                }
            } else if (potentialStage < previousMaxStageInStorage) {
                newTreeStageToShow = potentialStage;
                if (newTreeStageToShow < previousMaxStageInStorage) {
                    await AsyncStorage.setItem(TREE_MAX_STAGE_KEY, newTreeStageToShow.toString());
                    await AsyncStorage.setItem(`@tree_stage_progress_${newTreeStageToShow}`, '0');
                    setReadingsInCurrentStageCount(0);
                }
            } else {
                newTreeStageToShow = potentialStage;
            }

            if (newTreeStageToShow < 1) {
                newTreeStageToShow = 1;
            }

            setCurrentTreeStage(newTreeStageToShow);
            setMaxTreeStageReached(newTreeStageToShow);


            let progressForBar = 0;
            if (newTreeStageToShow < MAX_GENERIC_TREE_STAGE) {
                if (recentCount < MIN_REQUIRED_READINGS_FOR_EVALUATION && newTreeStageToShow === 1) {
                    progressForBar = percentageInTarget / 100;
                } else {
                    if (hasLeveledUp) {
                        progressForBar = 0;
                    } else {
                        const currentStageRequirement = STAGE_PROGRESS_REQUIREMENTS[newTreeStageToShow] || 1;
                        progressForBar = currentReadingsInStage / currentStageRequirement;
                    }
                }
            } else {
                progressForBar = 1;
            }
            setTreeProgressPercentage(progressForBar);

        } catch (e) {
            console.error("Failed to load glucose data for tree stage:", e);
            Alert.alert("Error", "Could not update tree status.");
        }
    }, []);

    // --- Função para Iniciar as Animações ---
    const startAnimations = useCallback(() => {
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
                    Animated.timing(pulseScaleAnim, {
                        toValue: 1.02,
                        duration: 1500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseScaleAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseTranslateYAnim, {
                        toValue: -2,
                        duration: 1500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseTranslateYAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
            { iterations: -1 }
        );

        entranceAnimation.start(() => {
            plantPulseAnimation.start();
        });

    }, [
        treeImageFadeAnim, treeImageScaleAnim,
        logoTitleTranslateY, logoTitleOpacity,
        pulseScaleAnim, pulseTranslateYAnim
    ]);

    useFocusEffect(
        useCallback(() => {
            loadAndCalculateTreeStage();
            startAnimations();
            return () => {
                treeImageFadeAnim.stopAnimation();
                treeImageScaleAnim.stopAnimation();
                logoTitleTranslateY.stopAnimation();
                logoTitleOpacity.stopAnimation();

                pulseScaleAnim.stopAnimation();
                pulseTranslateYAnim.stopAnimation();
            };
        }, [loadAndCalculateTreeStage, startAnimations])
    );

    const getTreeImageSource = () => {
        const equippedTree = getEquippedTree();

        if (currentTreeStage === MAX_GENERIC_TREE_STAGE && equippedTree.stage5Image) {
            return equippedTree.stage5Image;
        }

        switch (currentTreeStage) {
            case 1:
                return require('../../assets/images/tree_stage_1.png');
            case 2:
                return require('../../assets/images/tree_stage_2.png');
            case 3:
                return require('../../assets/images/tree_stage_3.png');
            case 4:
                return require('../../assets/images/tree_stage_4.png');
            default:
                return require('../../assets/images/tree_stage_1.png');
        }
    };

    const handleGoToProfile = () => {
        navigation.navigate('Profile');
    };

    const handleGoToAchievements = () => {
        navigation.navigate('Achievements', {}); // Correção da chamada de navegação
    };

    const getDynamicMessage = () => {
        const readingsNeededForNextLevel = STAGE_PROGRESS_REQUIREMENTS[currentTreeStage] - readingsInCurrentStageCount;

        if (currentTreeStage === MAX_GENERIC_TREE_STAGE) {
            if (equippedTreeId !== 'normal_tree') {
                return `Your tree is flourishing! You're currently displaying the ${getEquippedTree().name}.`;
            }
            return "Your tree is flourishing! Excellent work, keep monitoring your health to maintain it!";
        }

        if (recentGlucoseReadingsCount < MIN_REQUIRED_READINGS_FOR_EVALUATION) {
            const remainingReadings = MIN_REQUIRED_READINGS_FOR_EVALUATION - recentGlucoseReadingsCount;
            if (remainingReadings > 0) {
                return `Record ${remainingReadings} more readings in the last 7 days for a complete tree evaluation.`;
            }
        }

        if (readingsNeededForNextLevel > 0) {
            return `You need ${readingsNeededForNextLevel} more on-target readings for your tree to level up to Level ${currentTreeStage + 1}. Keep up the good work!`;
        }

        if (treeProgressPercentage >= 0.95 && currentTreeStage < MAX_GENERIC_TREE_STAGE) {
            return `Almost there! Your tree is one step away from growing to Level ${currentTreeStage + 1}. Stay focused!`;
        }

        if (currentTreeStage === 1) {
            return "Your tree needs attention. Record your readings to help it recover!";
        }
        if (currentTreeStage === 2) {
            return "Your tree is recovering well! Maintain consistency in your readings.";
        }
        if (currentTreeStage === 3) {
            return "Your tree is healthy! Continue with excellent control.";
        }

        return "Keep monitoring your glucose to watch your Diabetree grow!";
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                {/* Contêiner para os botões no canto superior direito */}
                <View style={styles.topRightButtonsContainer}>
                    {/* Botão de Achievements (NOVO) */}
                    <TouchableOpacity style={styles.achievementsButton} onPress={handleGoToAchievements}>
                        {/* Ícone de troféu. Use 'trophy' para preenchido, 'trophy-outline' para contorno. */}
                        <Ionicons name="trophy-outline" size={36} color="#FFD700" />
                    </TouchableOpacity>
                    {/* Botão de Perfil (já existente) */}
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
                        source={require('../../assets/images/diabetes_logo.png')}
                        style={styles.logoImage}
                    />
                    <Text style={styles.title}>Diabetree!</Text>
                </Animated.View>

                <Text style={styles.subtitle}>Monitor your health, make your tree grow.</Text>

                <View style={styles.coinsContainer}>
                    <Text style={styles.coinsText}>💰 {userCoins}</Text>
                </View>

                <Animated.Image
                    source={getTreeImageSource()}
                    style={[
                        styles.treeImage,
                        {
                            opacity: treeImageFadeAnim,
                            transform: [
                                { scale: treeImageScaleAnim },
                                { scale: pulseScaleAnim },
                                { translateY: pulseTranslateYAnim },
                            ],
                        },
                    ]}
                />
                <Text style={styles.treeStatusText}>
                    Tree Level: {currentTreeStage}
                    {currentTreeStage === 1 && ' (Needs attention)'}
                    {currentTreeStage === 2 && ' (Recovering)'}
                    {currentTreeStage === 3 && ' (Healthy)'}
                    {currentTreeStage === MAX_GENERIC_TREE_STAGE && ' (Flourishing!)'}
                </Text>

                <Text style={styles.dynamicMessageText}>{getDynamicMessage()}</Text>

                <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>Progress to next level:</Text>
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
                    {currentTreeStage < MAX_GENERIC_TREE_STAGE && (
                        <Text style={styles.progressHintText}>
                            {readingsInCurrentStageCount} out of {STAGE_PROGRESS_REQUIREMENTS[currentTreeStage] || 0} on-target readings for this level.
                        </Text>
                    )}
                </View>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
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
    profileButton: {
        // estilos para o botão de perfil (se houver algum específico)
    },
    achievementsButton: {
        // estilos para o botão de achievements (se houver algum específico)
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        borderRadius: 10,
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
        marginTop: 10,
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
    progressHintTextWarning: {
        fontSize: 13,
        color: 'orange',
        marginTop: 5,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default HomeScreen;