import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { showAlert } from "@/store/useAlertStore";
import { Ionicons } from "@expo/vector-icons";
import {
  useMyRestaurant,
  useUpdateRestaurant,
  useDeleteRestaurant,
} from "@/hooks/useRestaurantPartnerRequest";
import { Colors } from "@/constants/colors";
import { Fonts, FontSize } from "@/constants/typography";
import { getPlaceholderImage } from "@/constants/images";
import { Restaurant } from "@/types/restaurant";
import { router } from "expo-router";

// ─── Cuisine Options ─────────────────────────────────────────────────────────
const CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Mexican",
  "Fast Food",
  "Desserts",
  "Beverages",
];

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RestaurantProfile() {
  const { data: restaurant, isPending, refetch } = useMyRestaurant();
  const { mutate: deleteRestaurant, isPending: isDeleting } =
    useDeleteRestaurant();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.muted} />
        <Text style={styles.emptyText}>Restaurant not found</Text>
      </View>
    );
  }

  const bannerUri =
    restaurant.banner || restaurant.image || getPlaceholderImage(restaurant.id);

  const handleDelete = () => {
    showAlert(
      "Delete Restaurant",
      `Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteRestaurant(restaurant.id, {
              onSuccess: () => {
                showAlert("Deleted", "Restaurant has been deleted.");
                router.replace("/");
              },
              onError: () =>
                showAlert("Error", "Failed to delete restaurant."),
            }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Banner */}
        <View style={styles.bannerWrap}>
          <Image source={{ uri: bannerUri }} style={styles.banner} />
          <View style={styles.bannerOverlay} />
          {/* Logo */}
          {restaurant.logo && (
            <View style={styles.logoWrap}>
              <Image source={{ uri: restaurant.logo }} style={styles.logo} />
            </View>
          )}
        </View>

        {/* Name & Status */}
        <View style={styles.headerSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: restaurant.isOpen
                    ? Colors.success + "18"
                    : Colors.danger + "18",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: restaurant.isOpen
                      ? Colors.success
                      : Colors.danger,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: restaurant.isOpen ? Colors.success : Colors.danger,
                  },
                ]}
              >
                {restaurant.isOpen ? "Open" : "Closed"}
              </Text>
            </View>

            {restaurant.isVerified && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: Colors.primary + "14" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={[styles.statusText, { color: Colors.primary }]}>
                  Verified
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{restaurant.description}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={18} color={Colors.secondary} />
            <Text style={styles.statValue}>
              {restaurant.rating?.toFixed(1) || "—"}
            </Text>
            <Text style={styles.statLabel}>
              {restaurant.ratingCount} reviews
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={18} color={Colors.primary} />
            <Text style={styles.statValue}>₹{restaurant.costForTwo}</Text>
            <Text style={styles.statLabel}>for two</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons
              name="restaurant-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.statValue}>
              {restaurant.menuCategories?.length || 0}
            </Text>
            <Text style={styles.statLabel}>categories</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CUISINES</Text>
          <View style={styles.chipContainer}>
            {restaurant.cuisineTypes.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>{restaurant.address}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BUSINESS DETAILS</Text>
          <View style={styles.infoRow}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              FSSAI: {restaurant.fssaiCode}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="receipt-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>GST: {restaurant.gstNumber}</Text>
          </View>
          {restaurant.type && (
            <View style={styles.infoRow}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>Type: {restaurant.type}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={20} color={Colors.white} />
          <Text style={styles.updateBtnText}>Update Restaurant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors.danger}
              />
              <Text style={styles.deleteBtnText}>Delete Restaurant</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <EditRestaurantModal
        visible={editModalVisible}
        restaurant={restaurant}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditRestaurantModal({
  visible,
  restaurant,
  onClose,
}: {
  visible: boolean;
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const { mutate: updateRestaurant, isPending } = useUpdateRestaurant();

  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [address, setAddress] = useState(restaurant.address);
  const [costForTwo, setCostForTwo] = useState(String(restaurant.costForTwo));
  const [fssaiCode, setFssaiCode] = useState(restaurant.fssaiCode);
  const [gstNumber, setGstNumber] = useState(restaurant.gstNumber);
  const [cuisines, setCuisines] = useState<string[]>(restaurant.cuisineTypes);
  const [image, setImage] = useState(restaurant.image || "");
  const [showAddCuisine, setShowAddCuisine] = useState(false);
  const [customCuisine, setCustomCuisine] = useState("");

  useEffect(() => {
    if (visible) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setAddress(restaurant.address);
      setCostForTwo(String(restaurant.costForTwo));
      setFssaiCode(restaurant.fssaiCode);
      setGstNumber(restaurant.gstNumber);
      setCuisines(restaurant.cuisineTypes);
      setImage(restaurant.image || "");
      setShowAddCuisine(false);
      setCustomCuisine("");
    }
  }, [visible, restaurant]);

  const toggleCuisine = (cuisine: string) => {
    setCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleAddCustomCuisine = () => {
    const trimmed = customCuisine.trim();
    if (!trimmed) return;
    if (cuisines.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showAlert("Duplicate", "This cuisine is already added.");
      return;
    }
    setCuisines((prev) => [...prev, trimmed]);
    setCustomCuisine("");
    setShowAddCuisine(false);
  };

  const handleSave = () => {
    if (!name.trim() || !address.trim() || cuisines.length === 0) {
      showAlert("Validation", "Name, address, and at least one cuisine are required.");
      return;
    }

    updateRestaurant(
      {
        id: restaurant.id,
        body: {
          name: name.trim(),
          description: description.trim(),
          address: address.trim(),
          costForTwo: Number(costForTwo) || restaurant.costForTwo,
          fssaiCode: fssaiCode.trim(),
          gstNumber: gstNumber.trim(),
          cuisineTypes: cuisines,
          ...(image.trim() ? { image: image.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          showAlert("Updated", "Restaurant details updated successfully.");
          onClose();
        },
        onError: () =>
          showAlert("Error", "Failed to update restaurant. Try again."),
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={modalStyles.card}>
          <View style={modalStyles.handle} />

          {/* Header */}
          <View style={modalStyles.header}>
            <View style={modalStyles.iconWrap}>
              <Ionicons
                name="create-outline"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View>
              <Text style={modalStyles.title}>Update Restaurant</Text>
              <Text style={modalStyles.subtitle}>
                Edit your restaurant details below
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={modalStyles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <Text style={modalStyles.inputLabel}>Restaurant Name</Text>
            <TextInput
              style={modalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Restaurant name"
              placeholderTextColor={Colors.muted}
            />

            {/* Description */}
            <Text style={modalStyles.inputLabel}>Description</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 70, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your restaurant..."
              placeholderTextColor={Colors.muted}
              multiline
            />

            {/* Address */}
            <Text style={modalStyles.inputLabel}>Address</Text>
            <TextInput
              style={modalStyles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Restaurant address"
              placeholderTextColor={Colors.muted}
            />

            {/* Cost for Two */}
            <Text style={modalStyles.inputLabel}>Cost for Two (₹)</Text>
            <TextInput
              style={modalStyles.input}
              value={costForTwo}
              onChangeText={setCostForTwo}
              placeholder="e.g. 400"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
            />

            {/* Cuisines */}
            <Text style={modalStyles.inputLabel}>Cuisine Types</Text>
            <View style={modalStyles.chipContainer}>
              {CUISINE_OPTIONS.map((cuisine) => {
                const selected = cuisines.includes(cuisine);
                return (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      modalStyles.chip,
                      selected && modalStyles.chipSelected,
                    ]}
                    onPress={() => toggleCuisine(cuisine)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        selected && modalStyles.chipTextSelected,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom cuisines (not in preset list) */}
              {cuisines
                .filter((c) => !CUISINE_OPTIONS.includes(c))
                .map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[modalStyles.chip, modalStyles.chipSelected]}
                    onPress={() => toggleCuisine(c)}
                    activeOpacity={0.75}
                  >
                    <Text style={[modalStyles.chipText, modalStyles.chipTextSelected]}>
                      {c}
                    </Text>
                    <Ionicons name="close" size={13} color={Colors.white} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}

              {/* Add custom cuisine button */}
              <TouchableOpacity
                style={modalStyles.addChipBtn}
                onPress={() => setShowAddCuisine(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={modalStyles.addChipText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Inline popup for custom cuisine */}
            {showAddCuisine && (
              <View style={modalStyles.addCuisinePopup}>
                <TextInput
                  style={modalStyles.addCuisineInput}
                  value={customCuisine}
                  onChangeText={setCustomCuisine}
                  placeholder="e.g. Thai, Korean..."
                  placeholderTextColor={Colors.muted}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddCustomCuisine}
                />
                <TouchableOpacity
                  style={modalStyles.addCuisineConfirm}
                  onPress={handleAddCustomCuisine}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.addCuisineCancel}
                  onPress={() => {
                    setShowAddCuisine(false);
                    setCustomCuisine("");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color={Colors.muted} />
                </TouchableOpacity>
              </View>
            )}

            {/* FSSAI */}
            <Text style={modalStyles.inputLabel}>FSSAI License</Text>
            <TextInput
              style={modalStyles.input}
              value={fssaiCode}
              onChangeText={setFssaiCode}
              placeholder="14-digit FSSAI code"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
            />

            {/* GST */}
            <Text style={modalStyles.inputLabel}>GST Number</Text>
            <TextInput
              style={modalStyles.input}
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder="e.g. 29ABCDE1234F1Z5"
              placeholderTextColor={Colors.muted}
              autoCapitalize="characters"
            />

            {/* Image URL */}
            <Text style={modalStyles.inputLabel}>Image URL</Text>
            <TextInput
              style={modalStyles.input}
              value={image}
              onChangeText={setImage}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={Colors.muted}
              autoCapitalize="none"
              keyboardType="url"
            />
          </ScrollView>

          {/* Actions */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                modalStyles.saveBtn,
                isPending && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={modalStyles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Profile Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    color: Colors.muted,
    fontFamily: Fonts.brand,
  },
  emptyText: {
    marginTop: 12,
    fontSize: FontSize.md,
    color: Colors.muted,
    fontFamily: Fonts.brandMedium,
  },

  // Banner
  bannerWrap: {
    height: 200,
    position: "relative",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  logoWrap: {
    position: "absolute",
    bottom: -32,
    left: 20,
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.white,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  // Header
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 8,
  },
  restaurantName: {
    fontSize: FontSize.xxl,
    fontFamily: Fonts.brandBold,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.brand,
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.brandBold,
    fontWeight: "700",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    fontFamily: Fonts.brand,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.brandBold,
    fontWeight: "700",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.primary + "12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.brand,
    flex: 1,
  },

  // Buttons
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  updateBtnText: {
    fontSize: FontSize.md,
    fontFamily: Fonts.brandBold,
    fontWeight: "700",
    color: Colors.white,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.danger + "10",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
    color: Colors.danger,
  },
});

// ─── Modal Styles ────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary + "14",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.brandBold,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    fontFamily: Fonts.brand,
    marginTop: 2,
  },
  scroll: {
    flexGrow: 0,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    fontFamily: Fonts.brand,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: Colors.white,
  },
  addChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    backgroundColor: Colors.primary + "08",
  },
  addChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
  },
  addCuisinePopup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addCuisineInput: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Fonts.brand,
    color: Colors.text,
    paddingVertical: 6,
  },
  addCuisineConfirm: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addCuisineCancel: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.light,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.brandMedium,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.brandBold,
    fontWeight: "700",
    color: Colors.white,
  },
});