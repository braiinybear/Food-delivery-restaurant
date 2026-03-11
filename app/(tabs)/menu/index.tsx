import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import {
    useCreateMenuCategory,
    useMenuCategories,
    useRestaurantMenuItems,
} from "@/hooks/useMenuManagement";
import { useMyRestaurant } from "@/hooks/useRestaurantPartnerRequest";
import { MenuCategory, MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    VEG: { icon: "leaf-outline", color: "#2ECC71" },
    NON_VEG: { icon: "nutrition-outline", color: "#E74C3C" },
    EGG: { icon: "ellipse-outline", color: "#F39C12" },
    VEGAN: { icon: "flower-outline", color: "#27AE60" },
};

// ─── Category Chip ───────────────────────────────────────────────────────────

function CategoryChip({
    category,
    onPress,
}: {
    category: MenuCategory;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.75}>
            <View style={styles.chipIconWrap}>
                <Ionicons name="grid-outline" size={16} color={Colors.primary} />
            </View>
            <View>
                <Text style={styles.chipName} numberOfLines={1}>
                    {category.name}
                </Text>
                <Text style={styles.chipCount}>{category.items?.length ?? 0} items</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Menu Item Card ──────────────────────────────────────────────────────────

function MenuItemCard({ item }: { item: MenuItem }) {
    const typeInfo = TYPE_ICONS[item.type] ?? { icon: "help-circle-outline", color: Colors.muted };

    return (
        <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => router.push(`/menuitem/${item.id}`)}
        >
            {/* Availability indicator strip */}
            <View
                style={[
                    styles.availStrip,
                    { backgroundColor: item.isAvailable ? Colors.success : Colors.danger },
                ]}
            />

            <View style={styles.menuCardBody}>
                {/* Left info */}
                <View style={styles.menuCardLeft}>
                    {/* Type badge */}
                    <View style={[styles.typeBadge, { borderColor: typeInfo.color }]}>
                        <Ionicons name={typeInfo.icon} size={10} color={typeInfo.color} />
                        <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                            {item.type?.replace("_", " ")}
                        </Text>
                    </View>

                    <Text style={styles.menuItemName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.menuItemDesc} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.menuItemMeta}>
                        <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={11} color={Colors.muted} />
                            <Text style={styles.metaChipText}>{item.prepTime} min</Text>
                        </View>
                        {item.isBestseller && (
                            <View style={[styles.metaChip, styles.metaChipBestseller]}>
                                <Ionicons name="flame" size={11} color={Colors.secondary} />
                                <Text style={[styles.metaChipText, { color: Colors.secondary }]}>
                                    Bestseller
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Right: price + arrow */}
                <View style={styles.menuCardRight}>
                    <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                    <View
                        style={[
                            styles.availBadge,
                            {
                                backgroundColor: item.isAvailable
                                    ? Colors.success + "18"
                                    : Colors.danger + "18",
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.availBadgeText,
                                { color: item.isAvailable ? Colors.success : Colors.danger },
                            ]}
                        >
                            {item.isAvailable ? "Available" : "Unavailable"}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Add Category Modal ──────────────────────────────────────────────────────

function AddCategoryModal({
    visible,
    restaurantId,
    onClose,
}: {
    visible: boolean;
    restaurantId: string;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const { mutate: createCategory, isPending } = useCreateMenuCategory();

    const handleAdd = () => {
        if (!name.trim()) {
            Alert.alert("Validation", "Category name cannot be empty.");
            return;
        }
        createCategory(
            { name: name.trim() },
            {
                onSuccess: () => {
                    setName("");
                    onClose();
                },
                onError: () => {
                    Alert.alert("Error", "Failed to create category. Please try again.");
                },
            }
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.modalCard}>
                    {/* Handle */}
                    <View style={styles.modalHandle} />

                    <View style={styles.modalHeader}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="grid" size={22} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.modalTitle}>New Category</Text>
                            <Text style={styles.modalSubtitle}>
                                Organise your menu with a new category
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>Category Name</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Starters, Beverages…"
                        placeholderTextColor={Colors.muted}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleAdd}
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setName("");
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.addButton, isPending && { opacity: 0.6 }]}
                            onPress={handleAdd}
                            disabled={isPending}
                            activeOpacity={0.8}
                        >
                            {isPending ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="add" size={18} color={Colors.white} />
                                    <Text style={styles.addButtonText}>Add Category</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MenuScreen() {
    const [modalVisible, setModalVisible] = useState(false);

      const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
      const restaurantId = restaurant?.id ?? "";

    const {
        data: categories = [],
        isLoading: catLoading,
        isError: catError,
    } = useMenuCategories(restaurantId);

    const {
        data: menuItems = [],
        isLoading: itemsLoading,
        isError: itemsError,
    } = useRestaurantMenuItems(restaurantId);

    const isCatLoading = restaurantLoading || catLoading;
    const isItemsLoading = restaurantLoading || itemsLoading;
    
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* ── Fixed Categories Section ── */}
            <View style={styles.categoriesSection}>
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>CATEGORIES</Text>
                    <TouchableOpacity
                        style={styles.addCategoryBtn}
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.75}
                    >
                        <Ionicons name="add-circle" size={16} color={Colors.primary} />
                        <Text style={styles.addCategoryBtnText}>Add Category</Text>
                    </TouchableOpacity>
                </View>

                {isCatLoading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : catError ? (
                    <Text style={styles.errorText}>Failed to load categories.</Text>
                ) : categories.length === 0 ? (
                    <View style={styles.emptyChipRow}>
                        <Ionicons name="grid-outline" size={32} color={Colors.muted} />
                        <Text style={styles.emptyText}>No categories yet. Create one!</Text>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScroll}
                    >
                        {categories.map((cat: MenuCategory) => (
                            <CategoryChip
                                key={cat.id}
                                category={cat}
                                onPress={() => router.push(`/menucategory/${cat.id}`)}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Scrollable Menu Items ── */}
            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>ALL MENU ITEMS</Text>
                    {!isItemsLoading && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{menuItems.length}</Text>
                        </View>
                    )}
                </View>

                {isItemsLoading ? (
                    <View style={styles.centeredLoader}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading menu items…</Text>
                    </View>
                ) : itemsError ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
                        <Text style={styles.errorText}>Failed to load menu items.</Text>
                    </View>
                ) : menuItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="restaurant-outline" size={48} color={Colors.primary} />
                        </View>
                        <Text style={styles.emptyHeading}>No Menu Items</Text>
                        <Text style={styles.emptySubText}>
                            Start adding items to your categories to populate your menu.
                        </Text>
                    </View>
                ) : (
                    menuItems.map((item: MenuItem) => (
                        <MenuItemCard key={item.id} item={item} />
                    ))
                )}
            </ScrollView>

            {/* ── Add Category Modal ── */}
            <AddCategoryModal
                visible={modalVisible}
                restaurantId={restaurantId}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Fixed categories section
    categoriesSection: {
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        backgroundColor: Colors.primary,
        paddingTop: 52,
        paddingBottom: 18,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    headerTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xl,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    headerSub: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.white + "BB",
        marginTop: 2,
    },
    headerSearchBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 32 },

    // Section label row
    sectionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        marginTop: 22,
        marginBottom: 12,
    },
    sectionLabel: {
        fontFamily: Fonts.brandBold,
        fontSize: 11,
        color: Colors.muted,
        letterSpacing: 2,
    },

    // Add category button
    addCategoryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addCategoryBtnText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.primary,
    },

    // Category chips
    chipScroll: {
        paddingLeft: 18,
        paddingRight: 8,
        gap: 10,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginRight: 2,
    },
    chipIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    chipName: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
        maxWidth: 100,
    },
    chipCount: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 1,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 18,
        marginTop: 8,
    },

    // Count badge
    countBadge: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    countBadgeText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
        color: Colors.white,
    },

    // Menu item card
    menuCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: "row",
        overflow: "hidden",
    },
    availStrip: {
        width: 4,
    },
    menuCardBody: {
        flex: 1,
        flexDirection: "row",
        padding: 14,
        gap: 10,
    },
    menuCardLeft: {
        flex: 1,
        gap: 4,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    typeBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: 10,
        letterSpacing: 0.3,
    },
    menuItemName: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        marginTop: 2,
    },
    menuItemDesc: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        lineHeight: 16,
    },
    menuItemMeta: {
        flexDirection: "row",
        gap: 6,
        marginTop: 4,
    },
    metaChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: Colors.light,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    metaChipBestseller: {
        backgroundColor: Colors.secondary + "22",
    },
    metaChipText: {
        fontFamily: Fonts.brand,
        fontSize: 10,
        color: Colors.muted,
    },
    menuCardRight: {
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    menuItemPrice: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.lg,
        color: Colors.primary,
    },
    availBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    availBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: 10,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: "center",
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 24,
    },
    modalIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    modalTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    modalSubtitle: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
    },
    inputLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontFamily: Fonts.brand,
        fontSize: FontSize.md,
        color: Colors.text,
        backgroundColor: Colors.surface,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.light,
        alignItems: "center",
    },
    cancelButtonText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    addButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    addButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
    },

    // States
    loadingRow: {
        paddingVertical: 16,
        alignItems: "center",
    },
    loadingText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.muted,
        marginTop: 8,
    },
    centeredLoader: {
        paddingVertical: 48,
        alignItems: "center",
        gap: 10,
    },
    errorContainer: {
        paddingVertical: 32,
        alignItems: "center",
        gap: 8,
    },
    errorText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.danger,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    emptyChipRow: {
        paddingVertical: 20,
        alignItems: "center",
        gap: 8,
    },
    emptyText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    emptyContainer: {
        paddingVertical: 48,
        alignItems: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    emptyHeading: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    emptySubText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.muted,
        textAlign: "center",
        lineHeight: 20,
    },
});