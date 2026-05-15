import { ThemeType } from "@/constants/colors";
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
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
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
import { showAlert } from "@/store/useAlertStore";
import MenuCategorySkeleton from "@/components/loading/MenuCategory";
import MenuItemSkeleton from "@/components/loading/MenuItemSkelton";
import { useTheme } from "@/context/ThemeContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getCuisineTypeStyles = (Colors: ThemeType) => ({
  VEG: { icon: "leaf-outline" as const, color: Colors.success },
  NON_VEG: { icon: "nutrition-outline" as const, color: Colors.danger },
  EGG: { icon: "ellipse-outline" as const, color: Colors.secondary },
  VEGAN: { icon: "flower-outline" as const, color: Colors.success },
});

// ─── Category Chip ───────────────────────────────────────────────────────────

function CategoryChip({
  category,
  onPress,
}: {
  category: MenuCategory;
  onPress: () => void;
}) {
  const { Colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.chipIconWrap}>
        {category.image ? (
          <Image source={{ uri: category.image }} style={styles.chipImage} />
        ) : (
          <Ionicons name="grid-outline" size={16} color={Colors.primary} />
        )}
      </View>
      <View>
        <Text style={styles.chipName} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.chipCount}>
          {category.items?.length ?? 0} items
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Menu Item Card ──────────────────────────────────────────────────────────

function MenuItemCard({ item }: { item: MenuItem }) {
  const { Colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const TYPE_ICONS = useMemo(() => getCuisineTypeStyles(Colors), [Colors]);
  
  const typeInfo = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] ?? {
    icon: "help-circle-outline",
    color: Colors.muted,
  };

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
          {
            backgroundColor: item.isAvailable ? Colors.success : Colors.danger,
          },
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
          <View style={[styles.typeBadge, { borderColor: typeInfo.color + "40", backgroundColor: typeInfo.color + "10" }]}>
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
                <Text
                  style={[styles.metaChipText, { color: Colors.secondary }]}
                >
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
  const { Colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
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

        try {
          await validateImage(imageUri, 5); // 5MB max
        } catch (validationError) {
          showAlert(
            "Invalid Image",
            validationError instanceof Error
              ? validationError.message
              : "Please select a valid image",
          );
          return;
        }

        setIsCloudinaryUploading(true);
        setUploadProgress(0);

        try {
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 50) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + Math.random() * 15;
            });
          }, 200);

          const response = await uploadImageToCloudinary(
            imageUri,
            "menu_categories",
          );

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (!response.secure_url) {
            throw new Error("No image URL returned from Cloudinary");
          }

          setCategoryImage(response.secure_url);

          setIsCloudinaryUploading(false);
          setUploadProgress(0);

          showAlert(
            "Success! ✅",
            "Category image uploaded to cloud successfully",
            [{ text: "OK" }],
          );
        } catch (uploadError) {
          showAlert(
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
      showAlert(
        "Error",
        error instanceof Error ? error.message : "An error occurred",
        [{ text: "OK" }],
      );
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      showAlert("Validation", "Category name cannot be empty.");
      return;
    }
    if (!categoryImage) {
      showAlert("Validation", "Please upload a category image.");
      return;
    }

    createCategory(
      {
        name: name.trim(),
        image: categoryImage,
        type: type || undefined,
      },
      {
        onSuccess: () => {
          showAlert("Success! 🎉", "Category created successfully", [
            { text: "OK" },
          ]);
          setName("");
          setType("");
          setCategoryImage(null);
          onClose();
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            "Failed to create category. Please try again.";
          showAlert("Error", errorMessage);
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Cloudinary Upload Loading Overlay */}
      {isCloudinaryUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingModal}>
            <View style={styles.uploadingIcon}>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={Colors.primary}
              />
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
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
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
              categoryImage ? {
                borderColor: Colors.primary,
                borderStyle: "solid",
              } : {},
            ]}
            onPress={pickImage}
            disabled={isCloudinaryUploading}
            activeOpacity={0.7}
          >
            {categoryImage ? (
              <>
                <Image
                  source={{ uri: categoryImage }}
                  style={styles.uploadCardImage}
                />
                <View style={styles.uploadCardOverlay}>
                  <Ionicons name="camera" size={24} color={Colors.white} />
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
            {["VEG", "NON_VEG", "VEGAN"].map((categoryType) => (
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const { Colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 5 }).map((_, i) => (
              <MenuCategorySkeleton key={i} />
            ))}
          </ScrollView>
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
        </View>

        {isItemsLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </>
        ) : itemsError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={Colors.danger}
            />
            <Text style={styles.errorText}>Failed to load menu items.</Text>
          </View>
        ) : menuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={Colors.primary}
              />
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

const createStyles = (Colors: ThemeType, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  categoriesSection: {
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
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
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addCategoryBtnText: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
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
    backgroundColor: Colors.primary + "15",
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 18,
    marginTop: 8,
  },
  menuCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  availStrip: {
    width: 4,
    height: "100%",
  },
  menuItemThumbnail: {
    width: 90,
    height: "100%",
  },
  menuCardBody: {
    flex: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  menuCardLeft: {
    flex: 1,
    paddingRight: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 6,
    gap: 3,
  },
  typeBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  menuItemName: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  menuItemDesc: {
    fontFamily: Fonts.brand,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  menuItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  metaChipBestseller: {
    backgroundColor: Colors.secondary + "15",
  },
  metaChipText: {
    fontFamily: Fonts.brandMedium,
    fontSize: 10,
    color: Colors.muted,
  },
  menuCardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minWidth: 80,
  },
  menuItemPrice: {
    fontFamily: Fonts.brandBlack,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  availBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    minHeight: "60%",
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
    backgroundColor: Colors.primary + "15",
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
    backgroundColor: Colors.background,
    marginBottom: 24,
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    backgroundColor: Colors.background,
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  uploadCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadCardText: {
    flex: 1,
  },
  uploadCardTitle: {
    fontSize: 13,
    fontFamily: Fonts.brandBold,
    color: Colors.text,
    marginBottom: 2,
  },
  uploadCardSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.muted,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  uploadingModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
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
    fontFamily: Fonts.brandBold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  uploadingSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.brand,
    color: Colors.muted,
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
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  progressPercentage: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.primary,
  },
  loadingSpinnerContainer: {
    marginVertical: 16,
  },
  uploadingHint: {
    fontSize: 12,
    fontFamily: Fonts.brand,
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
    backgroundColor: Colors.background,
  },
  typeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  typeButtonTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.brandBold,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.primary + "15",
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
