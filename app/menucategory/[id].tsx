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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, validateImage } from "@/utility/cloudinary";

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

      {/* Item Image Thumbnail */}
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.itemThumbnail}
          resizeMode="cover"
        />
      )}

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
  currentType,
  categoryId,
  categoryImage,
  onClose,
}: {
  visible: boolean;
  currentName: string;
  currentType?: string;
  categoryId: string;
  categoryImage?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [type, setType] = useState(currentType ?? "");
  const [categoryImg, setCategoryImage] = useState<string | null>(categoryImage ?? null);
  const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { mutate: updateCategory, isPending } = useUpdateMenuCategory();

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setType(currentType ?? "");
      setCategoryImage(categoryImage ?? null);
    }
  }, [visible, currentName, currentType, categoryImage]);

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

          setCategoryImage(response.secure_url);
          setIsCloudinaryUploading(false);
          setUploadProgress(0);

          // ─── Show success message ──────────────────────────────
          Alert.alert(
            "Success! ✅",
            "Category image updated successfully",
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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Category name cannot be empty.");
      return;
    }
    
    const updateBody: any = {
      name: name.trim(),
    };
    
    // Only include image if it has a valid URL
    if (categoryImg && categoryImg.trim()) {
      updateBody.image = categoryImg;
    }

    // Only include type if it's selected
    if (type && type.trim()) {
      updateBody.type = type;
    }
    
    updateCategory(
      { id: categoryId, body: updateBody },
      {
        onSuccess: () => {
          Alert.alert("Success! ✅", "Category updated successfully");
          onClose();
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to update category. Please try again.";
          Alert.alert("Error", errorMessage);
        },
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
      {/* Cloudinary Upload Loading Overlay */}
      {isCloudinaryUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingModal}>
            <View style={styles.uploadingIcon}>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.uploadingTitle}>Uploading to Cloud</Text>
            <Text style={styles.uploadingSubtitle}>
              Updating category image...
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 }}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Category</Text>
                <Text style={styles.modalSubtitle}>
                  Update this menu category
                </Text>
              </View>
            </View>

            {/* Image Upload Section - Smaller */}
            <Text style={styles.inputLabel}>Category Image</Text>
            <TouchableOpacity
              style={[
                styles.smallUploadCard,
                categoryImg && { borderColor: Colors.primary, borderStyle: "solid" },
              ]}
              onPress={pickImage}
              disabled={isCloudinaryUploading}
              activeOpacity={0.7}
            >
              {categoryImg ? (
                <>
                  <Image
                    source={{ uri: categoryImg }}
                    style={styles.uploadCardImage}
                  />
                  <View style={styles.uploadCardOverlay}>
                    <Ionicons
                      name="camera"
                      size={20}
                      color={Colors.white}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.uploadCardContent}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              placeholderTextColor={Colors.muted}
              editable={!isCloudinaryUploading}
            />

            <Text style={styles.inputLabel}>Category Type (Optional)</Text>
            <View style={styles.createModalPillGroup}>
              {["VEG", "NON_VEG", "VEGAN", "DRINKS"].map((categoryType) => (
                <TouchableOpacity
                  key={categoryType}
                  style={[
                    styles.createModalPill,
                    type === categoryType && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setType(categoryType)}
                  disabled={isCloudinaryUploading}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.createModalPillText,
                      type === categoryType && { color: Colors.white },
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
                onPress={onClose}
                activeOpacity={0.7}
                disabled={isCloudinaryUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, (isPending || isCloudinaryUploading) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isPending || isCloudinaryUploading}
                activeOpacity={0.8}
              >
                {isPending || isCloudinaryUploading ? (
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
        </ScrollView>
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
  const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
              const next = prev + Math.random() * 40;
              return next > 50 ? 50 : next;
            });
          }, 200);

          // ─── Upload to Cloudinary ───────────────────────────────
          const response = await uploadImageToCloudinary(imageUri, "menu_items");

          clearInterval(progressInterval);
          setUploadProgress(100);

          // ─── Validate response and store the secure URL ─────────────────────────────
          if (!response.secure_url) {
            throw new Error("No image URL returned from Cloudinary");
          }

          updateField("image", response.secure_url);
          setIsCloudinaryUploading(false);
          setUploadProgress(0);

          // ─── Show success message ──────────────────────────────
          Alert.alert(
            "Success! ✅",
            "Menu item image uploaded successfully",
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
      transparent={false}
      animationType="slide"
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
              Updating menu item image...
            </Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${uploadProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(uploadProgress)}%
              </Text>
            </View>

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
        style={styles.createModalOverlayFull}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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

            {/* Image Upload Card */}
            <Text style={styles.inputLabel}>Menu Item Image</Text>
            <TouchableOpacity 
             style={[
    styles.uploadCard,
    form.image && styles.uploadCardActive
  ]}
              onPress={pickImage}
              disabled={isCloudinaryUploading}
              activeOpacity={0.8}
            >
              {form.image ? (
                <>
                  <Image
                    source={{ uri: form.image }}
                    style={styles.uploadCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.uploadCardOverlay}>
                    <View style={styles.uploadCardContent}>
                      <View style={styles.uploadCardIcon}>
                        <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
                      </View>
                      <View style={styles.uploadCardText}>
                        <Text style={styles.uploadCardTitle}>Tap to Change</Text>
                        <Text style={styles.uploadCardSubtitle}>Select a different image</Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.uploadCardContent}>
                  <View style={styles.uploadCardIcon}>
                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                  </View>
                  <View style={styles.uploadCardText}>
                    <Text style={styles.uploadCardTitle}>Upload Image</Text>
                    <Text style={styles.uploadCardSubtitle}>Tap to select from device</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

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

      {/* ── Category Image Showcase ── */}
      {category.image && (
        <View style={styles.imageShowcase}>
          <Image
            source={{ uri: category.image }}
            style={styles.showcaseImage}
          />
        </View>
      )}

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
        categoryImage={category.image}
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

  // Category Image Showcase
  imageShowcase: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  showcaseImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.surface,
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
  itemThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: Colors.light,
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
  editModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 24,
    paddingBottom: 32,
    flex: 1,
    maxHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  createModalScroll: {
    marginBottom: 0,
    paddingBottom: 16,
  },

  createModalOverlayFull: {
    flex: 1,
    backgroundColor: Colors.white,
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

  // Upload Card
  uploadCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    marginBottom: 20,
    minHeight: 180,
    maxHeight: 220,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  smallUploadCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 0,
    overflow: "hidden",
    marginBottom: 20,
    height: 100,
    width: 100,
    backgroundColor: Colors.surface,
    alignSelf: "center",
  },
  uploadCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 16,
  },
  uploadCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  uploadCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadCardText: {
    alignItems: "center",
    gap: 4,
  },
  uploadCardTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  uploadCardSubtitle: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.sm,
    color: Colors.muted,
  },

  // Uploading Overlay
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  uploadingModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  uploadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadingTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.lg,
    color: Colors.text,
    marginBottom: 4,
  },
  uploadingSubtitle: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginBottom: 24,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 16,
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: "center",
  },
  loadingSpinnerContainer: {
    marginBottom: 16,
  },
  uploadingHint: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.xs,
    color: Colors.muted,
    textAlign: "center",
  },
  uploadCardActive: {
  borderWidth: 0,
  backgroundColor: "transparent",
  padding: 0,
  borderStyle: "solid",
},
});

