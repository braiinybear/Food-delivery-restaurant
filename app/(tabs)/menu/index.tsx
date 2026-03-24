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
    Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, validateImage } from "@/utility/cloudinary";

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
                {category.image ? (
                    <Image
                        source={{ uri: category.image }}
                        style={styles.chipImage}
                    />
                ) : (
                    <Ionicons name="grid-outline" size={16} color={Colors.primary} />
                )}
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

            {/* Item Thumbnail Image */}
            {item.image && (
                <Image
                    source={{ uri: item.image }}
                    style={styles.menuItemThumbnail}
                    resizeMode="cover"
                />
            )}

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
    const [type, setType] = useState("");
    const [catgoryImage, setCategoryImage] = useState<string | null>(null);
    const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { mutate: createCategory, isPending } = useCreateMenuCategory();

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;

                // ─── Validate image before uploading ─────────────────────────────
                try {
                    await validateImage(imageUri, 5); // 5MB max
                } catch (validationError) {
                    Alert.alert(
                        "Invalid Image",
                        validationError instanceof Error
                            ? validationError.message
                            : "Please select a valid image",
                    );
                    return;
                }

                // ─── Start cloudinary upload ────────────────────────────────
                setIsCloudinaryUploading(true);
                setUploadProgress(0);

                try {
                    // ─── Simulate progress (0% → 50%) ──────────────────────────
                    const progressInterval = setInterval(() => {
                        setUploadProgress((prev) => {
                            if (prev >= 50) {
                                clearInterval(progressInterval);
                                return prev;
                            }
                            return prev + Math.random() * 15;
                        });
                    }, 200);

                    // ─── Upload to Cloudinary ───────────────────────────────
                    const response = await uploadImageToCloudinary(imageUri, "menu_categories");

                    clearInterval(progressInterval);
                    setUploadProgress(100);

                    // ─── Validate response and store the secure URL ─────────────────────────────
                    if (!response.secure_url) {
                        throw new Error("No image URL returned from Cloudinary");
                    }

                    console.log("Cloudinary response:", { url: response.secure_url, folder: response.folder });
                    setCategoryImage(response.secure_url);
                    
                    // ─── Verify image was set ──────────────────────────────
                    setTimeout(() => {
                        console.log("Image state after set:", response.secure_url);
                    }, 100);
                    setIsCloudinaryUploading(false);
                    setUploadProgress(0);

                    // ─── Show success message ──────────────────────────────
                    Alert.alert(
                        "Success! ✅",
                        "Category image uploaded to cloud successfully",
                        [{ text: "OK" }],
                    );
                } catch (uploadError) {
                    Alert.alert(
                        "Upload Failed ❌",
                        uploadError instanceof Error
                            ? uploadError.message
                            : "Failed to upload image",
                        [{ text: "Try Again" }],
                    );
                } finally {
                    setIsCloudinaryUploading(false);
                    setUploadProgress(0);
                }
            }
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "An error occurred",
                [{ text: "OK" }],
            );
        }
    };

    const handleAdd = () => {
        if (!name.trim()) {
            Alert.alert("Validation", "Category name cannot be empty.");
            return;
        }
        if (!catgoryImage) {
            Alert.alert("Validation", "Please upload a category image.");
            return;
        }

        console.log("Creating category with:", { name: name.trim(), image: catgoryImage, type: type || undefined });

        createCategory(
            {
                name: name.trim(),
                image: catgoryImage,
                type: type || undefined,
            },
            {
                onSuccess: () => {
                    Alert.alert(
                        "Success! 🎉",
                        "Category created successfully",
                        [{ text: "OK" }]
                    );
                    setName("");
                    setType("");
                    setCategoryImage(null);
                    onClose();
                },
                onError: (error: any) => {
                    const errorMessage = error?.response?.data?.message || "Failed to create category. Please try again.";
                    Alert.alert("Error", errorMessage);
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
            {/* Cloudinary Upload Loading Overlay */}
            {isCloudinaryUploading && (
                <View style={styles.uploadingOverlay}>
                    <View style={styles.uploadingModal}>
                        <View style={styles.uploadingIcon}>
                            <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
                        </View>
                        <Text style={styles.uploadingTitle}>Uploading to Cloud</Text>
                        <Text style={styles.uploadingSubtitle}>
                            Uploading category image...
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${Math.min(uploadProgress, 99)}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressPercentage}>
                                {Math.round(Math.min(uploadProgress, 99))}%
                            </Text>
                        </View>

                        {/* Loading Spinner */}
                        <View style={styles.loadingSpinnerContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>

                        <Text style={styles.uploadingHint}>
                            This typically takes 5-15 seconds
                        </Text>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
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

                        {/* Image Upload Section */}
                        <Text style={styles.inputLabel}>Category Image</Text>
                        <TouchableOpacity
                            style={[
                                styles.uploadCard,
                                catgoryImage && { borderColor: Colors.primary, borderStyle: "solid" },
                            ]}
                            onPress={pickImage}
                            disabled={isCloudinaryUploading}
                            activeOpacity={0.7}
                        >
                            {catgoryImage ? (
                                <>
                                    <Image
                                        source={{ uri: catgoryImage }}
                                        style={styles.uploadCardImage}
                                    />
                                    <View style={styles.uploadCardOverlay}>
                                        <Ionicons
                                            name="camera"
                                            size={24}
                                            color={Colors.white}
                                        />
                                    </View>
                                </>
                            ) : (
                                <View style={styles.uploadCardContent}>
                                    <View style={styles.uploadCardIcon}>
                                        <Ionicons
                                            name="cloud-upload-outline"
                                            size={28}
                                            color={Colors.primary}
                                        />
                                    </View>
                                    <View style={styles.uploadCardText}>
                                        <Text style={styles.uploadCardTitle}>Upload Image</Text>
                                        <Text style={styles.uploadCardSubtitle}>
                                            Tap to select from gallery
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.inputLabel}>Category Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Starters, Beverages…"
                            placeholderTextColor={Colors.muted}
                            value={name}
                            onChangeText={setName}
                            returnKeyType="next"
                            editable={!isCloudinaryUploading}
                        />

                        <Text style={styles.inputLabel}>Category Type (Optional)</Text>
                        <View style={styles.typeContainer}>
                            {["VEG", "NON_VEG", "VEGAN", "DRINKS"].map((categoryType) => (
                                <TouchableOpacity
                                    key={categoryType}
                                    style={[
                                        styles.typeButton,
                                        type === categoryType && styles.typeButtonSelected,
                                    ]}
                                    onPress={() => setType(categoryType)}
                                    disabled={isCloudinaryUploading}
                                >
                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            type === categoryType && styles.typeButtonTextSelected,
                                        ]}
                                    >
                                        {categoryType.replace("_", " ")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setName("");
                                    setType("");
                                    setCategoryImage(null);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                                disabled={isCloudinaryUploading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.addButton,
                                    (isPending || isCloudinaryUploading) && { opacity: 0.6 },
                                ]}
                                onPress={handleAdd}
                                disabled={isPending || isCloudinaryUploading}
                                activeOpacity={0.8}
                            >
                                {isPending || isCloudinaryUploading ? (
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
                </ScrollView>
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
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    chipImage: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
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
        minHeight: 110,
    },
    availStrip: {
        width: 4,
    },
    menuItemThumbnail: {
        width: 80,
        height: "100%",
        backgroundColor: Colors.light,
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
        minWidth: 90,
        gap: 6,
    },
    menuItemPrice: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.lg,
        color: Colors.primary,
    },
    availBadge: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 5,
        justifyContent: "center",
        minWidth: 85,
    },
    availBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        textAlign: "center",
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
    imageUploadButton: {
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 14,
        borderStyle: "dashed",
        height: 160,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        backgroundColor: Colors.surface,
    },
    uploadPlaceholder: {
        alignItems: "center",
        gap: 8,
    },
    uploadedImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    uploadText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    uploadProgressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 16,
        padding: 12,
        backgroundColor: Colors.primaryLight,
        borderRadius: 10,
    },
    uploadProgressText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    uploadCard: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        backgroundColor: Colors.surface,
        borderStyle: "dashed",
        overflow: "hidden",
        minHeight: 100,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadCardContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
        width: "100%",
    },
    uploadCardImage: {
        width: "100%",
        height: 120,
        borderRadius: 10,
    },
    uploadCardOverlay: {
        position: "absolute",
        width: "100%",
        height: 120,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
    },
    uploadCardIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadCardText: {
        flex: 1,
    },
    uploadCardTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: 2,
    },
    uploadCardSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
    uploadingModal: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingVertical: 40,
        paddingHorizontal: 30,
        width: "80%",
        maxWidth: 320,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
        alignItems: "center",
    },
    uploadingIcon: {
        marginBottom: 16,
    },
    uploadingTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 8,
        textAlign: "center",
    },
    uploadingSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 18,
    },
    progressBarContainer: {
        width: "100%",
        marginBottom: 16,
        alignItems: "center",
        gap: 8,
    },
    progressBarBackground: {
        width: "100%",
        height: 8,
        backgroundColor: Colors.light,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: Colors.primary,
    },
    progressPercentage: {
        fontWeight: "700",
        fontSize: 13,
        color: Colors.primary,
    },
    loadingSpinnerContainer: {
        marginVertical: 16,
    },
    uploadingHint: {
        fontSize: 12,
        color: Colors.muted,
        textAlign: "center",
        marginTop: 12,
    },
    typeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeButtonSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeButtonText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    typeButtonTextSelected: {
        color: Colors.white,
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