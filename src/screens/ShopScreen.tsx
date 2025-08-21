import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native'; // Import FlatList and Dimensions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- ASYNCSTORAGE KEYS ---
const USER_COINS_KEY = '@user_coins';
const USER_OWNED_TREES_KEY = '@user_owned_trees';

// --- INTERFACES ---
interface ShopItem {
    id: string;
    name: string;
    price: number;
    image: any;
}

// --- ALL SHOP ITEMS DATA ---
const ALL_SHOP_ITEMS: ShopItem[] = [
    { id: 'oak', name: 'Oak Tree Seed', price: 100, image: require('../../assets/images/trees/oak_tree_stage5.png') },
    { id: 'willow', name: 'Willow Tree Seed', price: 150, image: require('../../assets/images/trees/willow_tree_stage5.png') },
    { id: 'pine', name: 'Pine Tree Seed', price: 150, image: require('../../assets/images/trees/pine_tree_stage5.png') },
    { id: 'cherry', name: 'Cherry Tree Seed', price: 200, image: require('../../assets/images/trees/cherry_tree_stage5.png') },
    { id: 'apple', name: 'Apple Tree Seed', price: 220, image: require('../../assets/images/trees/apple_tree_stage5.png') }
];

// --- CONSTANTS AND STYLE CALCULATION ---
const { width } = Dimensions.get('window');
const cardMargin = 8; // Margin between cards
const numColumns = 2; // Number of columns

// Horizontal padding around the cards in the FlatList
const FLAT_LIST_PADDING_HORIZONTAL = 15; 

// Calculate the width of each card
const calculatedCardWidth = (width - (FLAT_LIST_PADDING_HORIZONTAL * 2) - (cardMargin * numColumns * 2)) / numColumns;


const ShopScreen = () => {
    const [userCoins, setUserCoins] = useState(0);
    const [ownedTrees, setOwnedTrees] = useState<string[]>([]);
    const [availableShopItems, setAvailableShopItems] = useState<ShopItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadShopData = useCallback(async () => {
        setIsLoading(true);
        try {
            const storedCoins = await AsyncStorage.getItem(USER_COINS_KEY);
            const currentCoins = storedCoins != null ? parseInt(storedCoins, 10) : 0;
            setUserCoins(currentCoins);

            const ownedTreesJson = await AsyncStorage.getItem(USER_OWNED_TREES_KEY);
            const currentOwnedTrees: string[] = ownedTreesJson != null ? JSON.parse(ownedTreesJson) : [];
            setOwnedTrees(currentOwnedTrees);

            // Filter out 'normal_tree' as it's not bought, and already owned trees
            const filteredItems = ALL_SHOP_ITEMS.filter(item =>
                item.id !== 'normal_tree' && !currentOwnedTrees.includes(item.id)
            );
            setAvailableShopItems(filteredItems);

        } catch (e) {
            console.error("Failed to load shop data:", e);
            Alert.alert("Error", "Failed to load shop data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadShopData();
            return () => {};
        }, [loadShopData])
    );

    const handleBuyItem = async (itemPrice: number, itemId: string, itemName: string) => {
        if (userCoins < itemPrice) {
            Alert.alert('Not Enough Coins', 'You do not have enough coins to buy this item.');
            return;
        }

        if (ownedTrees.includes(itemId)) {
            Alert.alert('Already Owned', 'You already own this tree!');
            loadShopData(); // Reload to ensure UI consistency
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Are you sure you want to buy the ${itemName} for ${itemPrice} coins?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Buy',
                    onPress: async () => {
                        try {
                            const newCoins = userCoins - itemPrice;
                            await AsyncStorage.setItem(USER_COINS_KEY, newCoins.toString());
                            setUserCoins(newCoins);

                            const newOwnedTrees = [...ownedTrees, itemId];
                            await AsyncStorage.setItem(USER_OWNED_TREES_KEY, JSON.stringify(newOwnedTrees));
                            setOwnedTrees(newOwnedTrees);

                            Alert.alert('Purchase Successful!', `You bought the ${itemName}!`);
                            loadShopData(); // Reload shop to update available items
                        } catch (e) {
                            console.error("Failed to purchase item:", e);
                            Alert.alert('Error', 'Could not complete purchase. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // Render function for FlatList items
    const renderShopItem = ({ item }: { item: ShopItem }) => {
        const isOwned = ownedTrees.includes(item.id); // Check if item is owned

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.shopItemCard, isOwned && styles.shopItemCardOwned]} // Apply owned style
                onPress={() => handleBuyItem(item.price, item.id, item.name)}
                disabled={isOwned} // Disable if already owned
            >
                <Image source={item.image} style={styles.itemImage} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>💰 {item.price} Coins</Text>
                <View style={[styles.buyButton, isOwned && styles.buyButtonOwned]}>
                    <Text style={styles.buyButtonText}>
                        {isOwned ? 'Owned' : 'Buy'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading shop...</Text>
            </View>
        );
    }

    // Header component for FlatList
    const ListHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Diabetree Shop</Text>
            <Text style={styles.subtitle}>Collect coins and buy new trees!</Text>

            <View style={styles.coinsContainer}>
                <Ionicons name="leaf" size={24} color="#FFD700" />
                <Text style={styles.coinsText}>Your Coins: {userCoins}</Text>
            </View>
        </View>
    );

    return (
        <FlatList
            data={availableShopItems} // Use filtered items
            renderItem={renderShopItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns} // Set to 2 columns
            columnWrapperStyle={styles.row} // For row spacing
            contentContainerStyle={styles.flatListContent} // For overall padding
            ListHeaderComponent={ListHeader} // Place the header here
            ListEmptyComponent={() => ( // Component for when the list is empty
                !isLoading && availableShopItems.length === 0 ? (
                    <Text style={styles.emptyShopText}>No new trees available for purchase!</Text>
                ) : null
            )}
        />
    );
};

const styles = StyleSheet.create({
    // Removed scrollViewContent as FlatList handles scrolling
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
    headerContainer: { // New style for the header, similar to CollectionScreen
        width: '100%',
        paddingHorizontal: FLAT_LIST_PADDING_HORIZONTAL,
        alignItems: 'center',
        paddingTop: 20,
        backgroundColor: '#E0F2F7',
        paddingBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center', // Centered for header
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center', // Centered for header
    },
    coinsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#e0ffe0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    coinsText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#28a745',
        marginLeft: 8,
    },
    flatListContent: { // Content style for FlatList, handles padding
        paddingHorizontal: FLAT_LIST_PADDING_HORIZONTAL,
        paddingBottom: 20,
        backgroundColor: '#E0F2F7',
    },
    row: { // Used by columnWrapperStyle for spacing between columns
        flex: 1,
        justifyContent: 'space-between',
        marginBottom: cardMargin * 2, // Spacing between rows
    },
    shopItemCard: {
        backgroundColor: 'white',
        borderRadius: 12, // Slightly larger border-radius for consistency
        padding: 15,
        marginHorizontal: cardMargin, // Horizontal margin between cards
        width: calculatedCardWidth, // Apply calculated width
        aspectRatio: 0.8, // Maintain aspect ratio for cards
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, // Consistent shadow
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        justifyContent: 'space-between', // Distribute content vertically
    },
    shopItemCardOwned: { // Style for owned items
        borderColor: '#ccc', // Lighter border
        backgroundColor: '#f5f5f5', // Slightly different background
        opacity: 0.7, // Visual cue for owned
    },
    itemImage: {
        width: '90%', // Adjust to fit card width better
        height: '60%', // Adjust height
        resizeMode: 'contain',
        marginBottom: 5, // Reduce margin for better fit
    },
    itemName: {
        fontSize: 17, // Consistent font size
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    itemPrice: {
        fontSize: 18, // Slightly smaller price font
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10, // Adjust margin
    },
    buyButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15, // Adjusted padding
        borderRadius: 8, // Consistent border-radius
        width: '95%', // Full width inside card
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyButtonOwned: { // Style for owned button
        backgroundColor: '#cccccc', // Grey out button
    },
    buyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15, // Consistent font size
    },
    emptyShopText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        width: '100%', // Ensure it takes full width for centering
    },
});

export default ShopScreen;
