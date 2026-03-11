import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import {
  useDeleteMenuCategory,
  useMenuCategory,
  useUpdateMenuCategory,
  useCreateMenuItem,
} from "@/hooks/useMenuManagement";
import { MenuItem } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

// ─── Type badge colours ───────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  VEG: "#2ECC71",
  NON_VEG: "#E74C3C",
  EGG: "#F39C12",
  VEGAN: "#27AE60",
};

// ─── Small item row inside category detail ───────────────────────────────────
function CategoryItemRow({ item }: { item: MenuItem }) {
  const typeColor = TYPE_COLORS[item.type] ?? Colors.muted;

  return (
    <TouchableOpacity
      style={styles.itemRow}
      activeOpacity={0.8}
      onPress={() => router.push(`/menuitem/${item.id}`)}
    >
      {/* Color strip */}
      <View style={[styles.itemStrip, { backgroundColor: typeColor + "55" }]} />

      <View style={styles.itemRowBody}>
        <View style={styles.itemRowLeft}>
          <View style={[styles.itemTypeDot, { backgroundColor: typeColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDesc} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.itemRowRight}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <View
            style={[
              styles.itemAvailDot,
              {
                backgroundColor: item.isAvailable
                  ? Colors.success
                  : Colors.danger,
              },
            ]}
          />
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Edit Category Modal ─────────────────────────────────────────────────────
function EditCategoryModal({
  visible,
  currentName,
  categoryId,
  onClose,
}: {
  visible: boolean;
  currentName: string;
  categoryId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const { mutate: updateCategory, isPending } = useUpdateMenuCategory();

  useEffect(() => {
    if (visible) setName(currentName);
  }, [visible, currentName]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Category name cannot be empty.");
      return;
    }
    updateCategory(
      { id: categoryId, body: { name: name.trim() } },
      {
        onSuccess: () => onClose(),
        onError: () =>
          Alert.alert("Error", "Failed to update category. Please try again."),
      },
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
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name="create-outline"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <Text style={styles.modalSubtitle}>
                Rename this menu category
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Category Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            placeholderTextColor={Colors.muted}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isPending && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
function CreateMenuItemModal({
  visible,
  categoryId,
  onClose,
}: {
  visible: boolean;
  categoryId: string;
  onClose: () => void;
}) {
  const { mutate: createItem, isPending } = useCreateMenuItem();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    type: "VEG",
    spiceLevel: "Medium",
    prepTime: "",
    isBestseller: false,
  });

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Item name required");
      return;
    }

    createItem(
      {
        categoryId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image,
        type: form.type,
        spiceLevel: form.spiceLevel,
        prepTime: Number(form.prepTime),
        isBestseller: form.isBestseller,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({
            name: "",
            description: "",
            price: "",
            image: "",
            type: "VEG",
            spiceLevel: "Medium",
            prepTime: "",
            isBestseller: false,
          });
        },
        onError: () => Alert.alert("Error", "Failed to create menu item."),
      },
    );
  };

  const ITEM_TYPES = ["VEG", "NON_VEG", "EGG", "VEGAN"] as const;
  const SPICE_LEVELS = ["Low", "Medium", "High"] as const;

  const TYPE_PILL_COLORS: Record<string, string> = {
    VEG: "#2ECC71",
    NON_VEG: "#E74C3C",
    EGG: "#F39C12",
    VEGAN: "#27AE60",
  };
  const SPICE_PILL_COLORS: Record<string, string> = {
    Low: "#2ECC71",
    Medium: "#F39C12",
    High: "#E74C3C",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.createModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.createModalCard}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="restaurant" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.modalTitle}>New Menu Item</Text>
              <Text style={styles.modalSubtitle}>
                Add a dish to this category
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.createModalScroll}
          >
            {/* Name */}
            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              placeholder="e.g. Butter Chicken"
              placeholderTextColor={Colors.muted}
              style={styles.textInput}
              value={form.name}
              onChangeText={(v) => updateField("name", v)}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              placeholder="Short description of the dish"
              placeholderTextColor={Colors.muted}
              style={[styles.textInput, { minHeight: 60, textAlignVertical: "top" }]}
              value={form.description}
              onChangeText={(v) => updateField("description", v)}
              multiline
            />

            {/* Price & Prep Time row */}
            <View style={styles.createModalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Price (₹)</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={form.price}
                  onChangeText={(v) => updateField("price", v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Prep Time (min)</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={form.prepTime}
                  onChangeText={(v) => updateField("prepTime", v)}
                />
              </View>
            </View>

            {/* Image URL */}
            <Text style={styles.inputLabel}>Image URL</Text>
            <TextInput
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={Colors.muted}
              style={styles.textInput}
              value={form.image}
              onChangeText={(v) => updateField("image", v)}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Type pills */}
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.createModalPillGroup}>
              {ITEM_TYPES.map((t) => {
                const active = form.type === t;
                const color = TYPE_PILL_COLORS[t] ?? Colors.muted;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.createModalPill,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => updateField("type", t)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.createModalPillText,
                        active && { color: Colors.white },
                      ]}
                    >
                      {t.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Spice Level pills */}
            <Text style={styles.inputLabel}>Spice Level</Text>
            <View style={styles.createModalPillGroup}>
              {SPICE_LEVELS.map((s) => {
                const active = form.spiceLevel === s;
                const color = SPICE_PILL_COLORS[s] ?? Colors.muted;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.createModalPill,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => updateField("spiceLevel", s)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.createModalPillText,
                        active && { color: Colors.white },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bestseller toggle */}
            <TouchableOpacity
              style={styles.createModalToggleRow}
              onPress={() => updateField("isBestseller", !form.isBestseller)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={form.isBestseller ? "flame" : "flame-outline"}
                size={18}
                color={form.isBestseller ? Colors.secondary : Colors.muted}
              />
              <Text style={styles.createModalToggleLabel}>
                Mark as Bestseller
              </Text>
              <View
                style={[
                  styles.createModalToggleDot,
                  form.isBestseller && {
                    backgroundColor: Colors.secondary,
                    borderColor: Colors.secondary,
                  },
                ]}
              >
                {form.isBestseller && (
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Create Item</Text>
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
export default function MenuCategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createItemVisible, setCreateItemVisible] = useState(false);

  const { data: category, isLoading, isError } = useMenuCategory(id ?? "");
  const { mutate: deleteCategory, isPending: deleting } =
    useDeleteMenuCategory();

  const handleDelete = () => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category?.name}"? All items in this category will be unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCategory(id ?? "", {
              onSuccess: () => router.back(),
              onError: () =>
                Alert.alert("Error", "Failed to delete category. Try again."),
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading category…</Text>
      </View>
    );
  }

  if (isError || !category) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>Failed to load category data.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items: MenuItem[] = category.items ?? [];
  const availableCount = items.filter((i) => i.isAvailable).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backCircle}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.headerSub}>
            {items.length} items · {availableCount} available
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtnDanger}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="trash-outline" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setCreateItemVisible(true)}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {availableCount}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>
            {items.length - availableCount}
          </Text>
          <Text style={styles.statLabel}>Unavailable</Text>
        </View>
      </View>

      {/* ── Items list ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionLabel}>ITEMS IN THIS CATEGORY</Text>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="fast-food-outline"
                size={44}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyHeading}>No Items Yet</Text>
            <Text style={styles.emptySubText}>
              This category has no menu items.Add items by tapping the + button
              in the top right of this section.
            </Text>
          </View>
        ) : (
          items.map((item) => <CategoryItemRow key={item.id} item={item} />)
        )}
      </ScrollView>

      {/* ── Edit Modal ── */}
      <EditCategoryModal
        visible={editModalVisible}
        currentName={category.name}
        categoryId={id ?? ""}
        onClose={() => setEditModalVisible(false)}
      />
      <CreateMenuItemModal
        visible={createItemVisible}
        categoryId={id ?? ""}
        onClose={() => setCreateItemVisible(false)}
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

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionBtnDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.danger + "CC",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  sectionLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 12,
  },

  // Item row
  itemRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  itemStrip: {
    width: 4,
  },
  itemRowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  itemRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemTypeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemName: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  itemDesc: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  itemRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  itemAvailDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
  primaryButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButtonText: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },

  // States
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  errorText: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.md,
    color: Colors.danger,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  backBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.white,
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

  // Create Menu Item Modal
  createModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  createModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  createModalScroll: {
    marginBottom: 16,
  },
  createModalRow: {
    flexDirection: "row",
    gap: 12,
  },
  createModalPillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  createModalPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  createModalPillText: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  createModalToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  createModalToggleLabel: {
    flex: 1,
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  createModalToggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});
