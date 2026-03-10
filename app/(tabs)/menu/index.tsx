import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";

const CATEGORIES = ["All", "Burgers", "Pasta", "Mains", "Salads", "Desserts", "Drinks"];

const MENU_ITEMS = [
    { name: "Grilled Chicken Burger", category: "Burgers", price: "$12.99", available: true, orders: 142 },
    { name: "BBQ Double Smash Burger", category: "Burgers", price: "$15.99", available: true, orders: 88 },
    { name: "Spicy Prawn Pasta", category: "Pasta", price: "$16.00", available: true, orders: 98 },
    { name: "Creamy Carbonara", category: "Pasta", price: "$14.50", available: false, orders: 54 },
    { name: "BBQ Ribs Platter", category: "Mains", price: "$24.00", available: true, orders: 76 },
    { name: "Grilled Salmon", category: "Mains", price: "$22.50", available: true, orders: 60 },
    { name: "Caesar Salad", category: "Salads", price: "$9.00", available: true, orders: 65 },
    { name: "Lava Chocolate Cake", category: "Desserts", price: "$8.00", available: true, orders: 55 },
    { name: "Lemonade Cooler", category: "Drinks", price: "$4.50", available: true, orders: 200 },
];

export default function MenuScreen() {
    const [activeCategory, setActiveCategory] = useState("All");

    const filtered = activeCategory === "All"
        ? MENU_ITEMS
        : MENU_ITEMS.filter(i => i.category === activeCategory);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={Colors.white} />
                    <Text style={styles.addBtnText}>Add Item</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={styles.catScroll} contentContainerStyle={styles.catContent}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
                        onPress={() => setActiveCategory(cat)}
                    >
                        <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                style={styles.contentScroll}
            >
                {filtered.map((item) => (
                    <View key={item.name} style={styles.menuCard}>
                        <View style={styles.menuItemIcon}>
                            <Ionicons name="restaurant" size={24} color={Colors.primary} />
                        </View>
                        <View style={styles.menuItemInfo}>
                            <Text style={styles.menuItemName}>{item.name}</Text>
                            <Text style={styles.menuItemCat}>{item.category} · {item.orders} orders</Text>
                        </View>
                        <View style={styles.menuItemRight}>
                            <Text style={styles.menuItemPrice}>{item.price}</Text>
                            <View style={[styles.availBadge, { backgroundColor: item.available ? Colors.success + "22" : Colors.danger + "22" }]}>
                                <Text style={[styles.availText, { color: item.available ? Colors.success : Colors.danger }]}>
                                    {item.available ? "Active" : "Off"}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    headerTitle: { fontFamily: Fonts.brandBlack, fontSize: FontSize.xxl, color: Colors.text },
    addBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 12,
    },
    addBtnText: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.white },
    catScroll: {
        flexGrow: 0,
        maxHeight: 60,
        marginBottom: 10,
    },
    catContent: {
        paddingHorizontal: 16,
        alignItems: "center",
        gap: 8,
    },
    catTab: {
        height: 36,
        marginVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    catTabActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    catText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    catTextActive: {
        color: Colors.white,
    },
    content: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, paddingTop: 10 },
    contentScroll: { flex: 1 },
    menuCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuItemIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    menuItemInfo: { flex: 1 },
    menuItemName: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.text },
    menuItemCat: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted, marginTop: 3 },
    menuItemRight: { alignItems: "flex-end", gap: 6 },
    menuItemPrice: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.primary },
    availBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    availText: { fontFamily: Fonts.brandBold, fontSize: 11 },
});
