// src/screens/CollectionScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// --- CONSTANTES AND STYLE CALCULATION (MOVED TO TOP AND REORDERED) ---
const { width } = Dimensions.get('window');
const cardMargin = 8; // Margem entre os cards
const numColumns = 2;

// Define os KEYS do AsyncStorage no topo
const USER_OWNED_TREES_KEY = '@user_owned_trees';
const EQUIPPED_TREE_KEY = '@equipped_tree_id';

// Calcula a largura de cada card ANTES da definição dos estilos
// Usa valores fixos de padding horizontal aqui, pois 'styles.flatListContent' ainda não existe
const FLAT_LIST_PADDING_HORIZONTAL = 15; 
const calculatedCardWidth = (width - (FLAT_LIST_PADDING_HORIZONTAL * 2) - (cardMargin * numColumns * 2)) / numColumns;


// Declara os estilos APÓS o 'calculatedCardWidth' ter sido determinado
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0F2F7',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    headerContainer: {
        width: '100%',
        paddingHorizontal: FLAT_LIST_PADDING_HORIZONTAL, // Usando a constante aqui
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: '#E0F2F7',
        paddingBottom: 15, // Espaço entre o subtítulo e o início da FlatList
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    flatListContent: {
        paddingHorizontal: FLAT_LIST_PADDING_HORIZONTAL, // Usando a constante aqui
        paddingBottom: 20,
        backgroundColor: '#E0F2F7',
    },
    row: {
        flex: 1,
        justifyContent: 'space-between', // Distribui os itens uniformemente na linha
        marginBottom: cardMargin * 2, // Espaçamento entre as linhas de cards
    },
    treeItemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: cardMargin, // Margem horizontal entre cards
        width: calculatedCardWidth, // *** ATENÇÃO: AGORA O WIDTH É DEFINIDO AQUI! ***
        aspectRatio: 0.8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        justifyContent: 'space-between',
    },
    treeItemCardLocked: {
        backgroundColor: '#e9ecef',
    },
    treeItemCardEquipped: {
        borderColor: '#28a745',
        borderWidth: 3,
    },
    lockedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    lockedPriceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    treeImage: {
        width: '90%',
        height: '60%',
        resizeMode: 'contain',
        marginBottom: 5,
    },
    treeImageLocked: {
    },
    treeName: {
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 5,
    },
    treeNameLocked: {
        color: '#555',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    equipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        width: '95%',
    },
    equipButtonEquipped: {
        backgroundColor: '#28a745',
    },
    equipButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    equippedIcon: {
        marginLeft: 5,
    },
    viewInShopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffc107',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        width: '95%',
    },
    viewInShopButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

// --- END CONSTANTS AND STYLES DECLARATIONS ---


type RootStackParamList = {
    Home: undefined;
    DataEntry: undefined;
    Collection: undefined;
    Shop: undefined;
};

interface TreeItem {
    id: string;
    name: string;
    collectionImage: any;
    stage5Image?: any;
    price?: number;
}

// Sua lista completa de árvores - já sabemos que as imagens funcionam aqui
const ALL_COLLECTABLE_TREES: TreeItem[] = [
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
        price: 100,
    },
    {
        id: 'willow',
        name: 'Willow Tree',
        collectionImage: require('../../assets/images/willow_tree_stage5.png'),
        stage5Image: require('../../assets/images/willow_tree_stage5.png'),
        price: 150,
    },
    {
        id: 'pine',
        name: 'Pine Tree',
        collectionImage: require('../../assets/images/pine_tree_stage5.png'),
        stage5Image: require('../../assets/images/pine_tree_stage5.png'),
        price: 150,
    },
    {
        id: 'cherry',
        name: 'Cherry Tree',
        collectionImage: require('../../assets/images/cherry_tree_stage5.png'),
        stage5Image: require('../../assets/images/cherry_tree_stage5.png'),
        price: 200,
    },
    {
        id: 'apple',
        name: 'Apple Tree',
        collectionImage: require('../../assets/images/apple_tree_stage5.png'),
        stage5Image: require('../../assets/images/apple_tree_stage5.png'),
        price: 220,
    },
];

const CollectionScreen = () => {
    const [ownedTreeIdsState, setOwnedTreeIdsState] = useState<string[]>([]);
    const [equippedTreeId, setEquippedTreeId] = useState<string>('normal_tree');
    const [isLoading, setIsLoading] = useState(true);

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const getTreeById = (id: string) => ALL_COLLECTABLE_TREES.find(tree => tree.id === id);

    const loadCollectionData = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log("--- INÍCIO DO CARREGAMENTO DA COLEÇÃO ---");

            const ownedTreesJson = await AsyncStorage.getItem(USER_OWNED_TREES_KEY);
            let ownedTreeIds: string[] = ownedTreesJson != null ? JSON.parse(ownedTreesJson) : [];

            const uniqueOwnedTreeIds = new Set(ownedTreeIds);
            if (!uniqueOwnedTreeIds.has('normal_tree')) {
                uniqueOwnedTreeIds.add('normal_tree');
            }

            const validOwnedTreeIds = Array.from(uniqueOwnedTreeIds).filter(id => getTreeById(id) !== undefined);
            
            if (JSON.stringify(validOwnedTreeIds) !== JSON.stringify(ownedTreeIds)) {
                 await AsyncStorage.setItem(USER_OWNED_TREES_KEY, JSON.stringify(validOwnedTreeIds));
                 console.log("DEBUG: ownedTreeIds atualizado no AsyncStorage:", validOwnedTreeIds);
            }
            setOwnedTreeIdsState(validOwnedTreeIds);
            console.log("DEBUG: ownedTreeIdsState definido para (componente):", validOwnedTreeIds);

            const storedEquippedTree = await AsyncStorage.getItem(EQUIPPED_TREE_KEY);
            
            if (storedEquippedTree && validOwnedTreeIds.includes(storedEquippedTree) && getTreeById(storedEquippedTree)) {
                setEquippedTreeId(storedEquippedTree); 
                console.log("DEBUG: equippedTreeId definido para:", storedEquippedTree);
            } else {
                await AsyncStorage.setItem(EQUIPPED_TREE_KEY, 'normal_tree');
                setEquippedTreeId('normal_tree');
                console.log("DEBUG: equippedTreeId fallback para 'normal_tree'.");
            }
            console.log("--- FIM DO CARREGAMENTO DA COLEÇÃO ---");

        } catch (e) {
            console.error("ERRO: Falha ao carregar árvores da coleção:", e);
            Alert.alert("Erro", "Não foi possível carregar a sua coleção de árvores.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEquipTree = async (treeId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (!ownedTreeIdsState.includes(treeId)) {
            Alert.alert("Error", "You don't own this tree yet!");
            return;
        }
        if (treeId === equippedTreeId) {
            Alert.alert("Info", "This tree is already equipped!");
            return;
        }

        try {
            const treeToEquip = getTreeById(treeId);
            if (!treeToEquip || !treeToEquip.stage5Image) {
                Alert.alert("Error", "This tree cannot be equipped for Stage 5.");
                return;
            }
            
            await AsyncStorage.setItem(EQUIPPED_TREE_KEY, treeId);
            setEquippedTreeId(treeId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", `${treeToEquip.name} has been equipped!`);
        } catch (e) {
            console.error("Failed to equip tree:", e);
            Alert.alert("Error", "Could not equip tree.");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadCollectionData();
            return () => {};
        }, [loadCollectionData])
    );

    const renderTreeItem = ({ item }: { item: TreeItem }) => {
        const isOwned = ownedTreeIdsState.includes(item.id);
        const isEquipped = item.id === equippedTreeId;

        const handlePress = () => {
            if (isOwned) {
                handleEquipTree(item.id);
            } else {
                navigation.navigate('Shop');
            }
        };

        return (
            <TouchableOpacity
                style={[styles.treeItemCard, !isOwned && styles.treeItemCardLocked, isEquipped && styles.treeItemCardEquipped]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {!isOwned && (
                    <View style={styles.lockedOverlay}>
                        <Ionicons name="lock-closed" size={40} color="#fff" />
                        {item.price !== undefined && <Text style={styles.lockedPriceText}>💰 {item.price}</Text>}
                    </View>
                )}
                <Image
                    source={item.collectionImage}
                    style={[styles.treeImage, !isOwned && styles.treeImageLocked]}
                />
                <Text style={[styles.treeName, !isOwned && styles.treeNameLocked]}>{item.name}</Text>

                <View style={styles.buttonContainer}>
                    {isOwned ? (
                        <TouchableOpacity
                            style={[styles.equipButton, isEquipped && styles.equipButtonEquipped]}
                            onPress={() => handleEquipTree(item.id)}
                            disabled={isEquipped || !item.stage5Image}
                        >
                            <Text style={styles.equipButtonText}>
                                {isEquipped ? 'Equipped' : 'Equip'}
                            </Text>
                            {isEquipped && <Ionicons name="star" size={16} color="#fff" style={styles.equippedIcon} />}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.viewInShopButton}
                            onPress={() => navigation.navigate('Shop')}
                        >
                            <Text style={styles.viewInShopButtonText}>View in Shop</Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.equippedIcon} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading your collection...</Text>
            </View>
        );
    }

    // --- Data Preparation for FlatList ---
    // 1. Get the equipped tree
    const equippedTree = ALL_COLLECTABLE_TREES.find(tree => tree.id === equippedTreeId);

    // 2. Get owned trees (excluding the equipped one, if it exists)
    const otherOwnedTrees = ALL_COLLECTABLE_TREES.filter(tree => 
        ownedTreeIdsState.includes(tree.id) && tree.id !== equippedTreeId
    );

    // 3. Get unowned trees
    const unownedTrees = ALL_COLLECTABLE_TREES.filter(tree => 
        !ownedTreeIdsState.includes(tree.id)
    );

    // 4. Combine them in the desired order
    const orderedTrees: TreeItem[] = [];
    if (equippedTree) {
        orderedTrees.push(equippedTree);
    }
    orderedTrees.push(...otherOwnedTrees);
    orderedTrees.push(...unownedTrees);
    // --- End Data Preparation ---


    // O ListHeaderComponent agora contém apenas o título e o subtítulo da tela
    const ListHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Your Tree Collection</Text>
            <Text style={styles.subtitle}>Explore all trees, owned and unowned!</Text>
        </View>
    );

    return (
        <FlatList
            data={orderedTrees} // Agora usa a lista ordenada!
            renderItem={renderTreeItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent} 
            ListHeaderComponent={ListHeader} // O cabeçalho da tela
        />
    );
};

export default CollectionScreen;