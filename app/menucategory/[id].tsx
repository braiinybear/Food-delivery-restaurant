import { ThemeType } from "@/constants/colors";
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
import React, { useEffect, useState, useMemo } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, validateImage } from "@/utility/cloudinary";
import { showAlert } from "@/store/useAlertStore";
import { useTheme } from "@/context/ThemeContext";

// ─── Type badge colours ───────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  VEG: "#2ECC71",
  NON_VEG: "#E74C3C",
  EGG: "#F39C12",
  VEGAN: "#27AE60",
};

// ─── Small item row inside category detail ───────────────────────────────────
function CategoryItemRow({ item, Colors, styles }: { item: MenuItem; Colors: ThemeType; styles: any }) {
  const typeColor = TYPE_COLORS[item.type] ?? Colors.muted;

  return (
    <TouchableOpacity
      style={styles.itemRow}
      activeOpacity={0.8}
      onPress={() => router.push(`/menuitem/${item.id}`)}
    >
      <View style={[styles.itemStrip, { backgroundColor: typeColor }]} />
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemThumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.itemThumbnail} />
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
              { backgroundColor: item.isAvailable ? Colors.success : Colors.danger },
            ]}
          />
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
  Colors,
  isDark,
}: {
  visible: boolean;
  currentName: string;
  currentType?: string;
  categoryId: string;
  categoryImage?: string;
  onClose: () => void;
  Colors: ThemeType;
  isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);
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
        try {
          await validateImage(imageUri, 5);
        } catch (validationError) {
          showAlert("Invalid Image", validationError instanceof Error ? validationError.message : "Please select a valid image");
          return;
        }

        setIsCloudinaryUploading(true);
        setUploadProgress(0);

        try {
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => (prev >= 50 ? prev : prev + Math.random() * 15));
          }, 200);

          const response = await uploadImageToCloudinary(imageUri, "menu_categories");

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (!response.secure_url) throw new Error("No image URL returned");

          setCategoryImage(response.secure_url);
          setIsCloudinaryUploading(false);
          setUploadProgress(0);
          showAlert("Success! ✅", "Category image updated successfully");
        } catch (uploadError) {
          showAlert("Upload Failed ❌", uploadError instanceof Error ? uploadError.message : "Failed to upload image");
        } finally {
          setIsCloudinaryUploading(false);
          setUploadProgress(0);
        }
      }
    } catch (error) {
      showAlert("Error", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showAlert("Validation", "Category name cannot be empty.");
      return;
    }
    
    const updateBody: any = { name: name.trim() };
    if (categoryImg && categoryImg.trim()) updateBody.image = categoryImg;
    if (type && type.trim()) updateBody.type = type;
    
    updateCategory(
      { id: categoryId, body: updateBody },
      {
        onSuccess: () => {
          showAlert("Success! ✅", "Category updated successfully");
          onClose();
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to update category.";
          showAlert("Error", errorMessage);
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {isCloudinaryUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingModal}>
            <View style={styles.uploadingIcon}>
              <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.uploadingTitle}>Uploading...</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${Math.min(uploadProgress, 99)}%` }]} />
              </View>
            </View>
          </View>
        </View>
      )}
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.editModalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="create-outline" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <Text style={styles.modalSubtitle}>Update category details</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Category Image</Text>
          <TouchableOpacity style={styles.smallUploadCard} onPress={pickImage} disabled={isCloudinaryUploading}>
            {categoryImg ? (
              <Image source={{ uri: categoryImg }} style={styles.uploadCardImage} />
            ) : (
              <View style={styles.uploadCardContent}>
                <Ionicons name="cloud-upload-outline" size={24} color={Colors.muted} />
              </View>
            )}
            {categoryImg && <View style={styles.uploadCardOverlay}><Ionicons name="camera" size={20} color={Colors.white} /></View>}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Category Name</Text>
          <TextInput style={styles.textInput} value={name} onChangeText={setName} />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={isPending}><Text style={styles.primaryButtonText}>Save Changes</Text></TouchableOpacity>
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
  Colors,
  isDark,
}: {
  visible: boolean;
  categoryId: string;
  onClose: () => void;
  Colors: ThemeType;
  isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);
  const { mutate: createItem, isPending } = useCreateMenuItem();
  const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    name: "", description: "", price: "", image: "", type: "VEG", spiceLevel: "Medium", prepTime: "", isBestseller: false,
  });

  const updateField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        try { await validateImage(imageUri, 5); } catch (e) { return; }
        setIsCloudinaryUploading(true);
        const response = await uploadImageToCloudinary(imageUri, "menu_items");
        updateField("image", response.secure_url);
        setIsCloudinaryUploading(false);
      }
    } catch (e) {}
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createItem({ categoryId, name: form.name, description: form.description, price: Number(form.price), image: form.image, type: form.type, spiceLevel: form.spiceLevel, prepTime: Number(form.prepTime), isBestseller: form.isBestseller }, { onSuccess: onClose });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {isCloudinaryUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingModal}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingTitle}>Uploading...</Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView style={[styles.createModalOverlayFull, { backgroundColor: Colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.createModalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}><Ionicons name="restaurant" size={24} color={Colors.primary} /></View>
            <View><Text style={styles.modalTitle}>New Menu Item</Text></View>
          </View>
          <ScrollView style={styles.createModalScroll}>
            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput style={styles.textInput} value={form.name} onChangeText={(v) => updateField("name", v)} />
            <Text style={styles.inputLabel}>Menu Item Image</Text>
            <TouchableOpacity style={styles.uploadCard} onPress={pickImage}>
              {form.image ? <Image source={{ uri: form.image }} style={styles.uploadCardImage} /> : <View style={styles.uploadCardContent}><Ionicons name="cloud-upload-outline" size={32} color={Colors.muted} /></View>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.createModalToggleRow} onPress={() => updateField("isBestseller", !form.isBestseller)}>
              <View style={styles.createModalToggleLeft}>
                <Ionicons name="flame" size={20} color={form.isBestseller ? Colors.secondary : Colors.muted} />
                <Text style={styles.createModalToggleLabel}>Bestseller Item</Text>
              </View>
              <View style={[styles.createModalToggle, form.isBestseller && { backgroundColor: Colors.secondary }]}>
                <View style={[styles.createModalToggleKnob, form.isBestseller && { transform: [{ translateX: 16 }] }]} />
              </View>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
          <View style={styles.createModalFooter}>
            <TouchableOpacity style={styles.cancelButtonFull} onPress={onClose}><Text style={styles.cancelButtonText}>Discard</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonFull} onPress={handleSubmit}><Text style={styles.primaryButtonText}>Create Item</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Category Detail Screen ─────────────────────────────────────────────
export default function MenuCategoryDetailScreen() {
  const { Colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cat, isLoading, isError } = useMenuCategory(id ?? "");
  const { mutate: deleteCategory, isPending: deleting } = useDeleteMenuCategory();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createItemModalVisible, setCreateItemModalVisible] = useState(false);

  const handleDelete = () => {
    showAlert("Delete Category", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteCategory(id ?? "", { onSuccess: () => router.back() }) }]);
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (isError || !cat) return <View style={styles.centered}><Ionicons name="alert-circle-outline" size={48} color={Colors.danger} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? Colors.background : Colors.secondary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={isDark ? Colors.text : Colors.white} /></TouchableOpacity>
        <View style={styles.headerBody}><Text style={styles.headerLabel}>Category</Text><Text style={styles.headerTitle} numberOfLines={1}>{cat.name}</Text></View>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}><Ionicons name="trash-outline" size={20} color={isDark ? Colors.danger : Colors.white} /></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.categoryInfoCard}>
          <View style={styles.infoRow}>
            {cat.image ? <Image source={{ uri: cat.image }} style={styles.categoryMainImage} /> : <View style={styles.categoryIconWrap}><Ionicons name="restaurant" size={32} color={Colors.primary} /></View>}
            <View style={{ flex: 1 }}><Text style={styles.catNameLabel}>{cat.name}</Text><Text style={styles.itemCountText}>{cat.items?.length ?? 0} items</Text></View>
            <TouchableOpacity style={styles.editCircle} onPress={() => setEditModalVisible(true)}><Ionicons name="pencil" size={18} color={Colors.primary} /></TouchableOpacity>
          </View>
        </View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Menu Items</Text><TouchableOpacity style={styles.addBtn} onPress={() => setCreateItemModalVisible(true)}><Text style={styles.addBtnText}>Add Item</Text></TouchableOpacity></View>
        <View style={styles.itemsList}>{cat.items?.map((item) => <CategoryItemRow key={item.id} item={item} Colors={Colors} styles={styles} />)}</View>
      </ScrollView>
      <EditCategoryModal visible={editModalVisible} currentName={cat.name} currentType={cat.type || undefined} categoryId={cat.id} categoryImage={cat.image || undefined} onClose={() => setEditModalVisible(false)} Colors={Colors} isDark={isDark} />
      <CreateMenuItemModal visible={createItemModalVisible} categoryId={cat.id} onClose={() => setCreateItemModalVisible(false)} Colors={Colors} isDark={isDark} />
    </View>
  );
}

const createStyles = (Colors: ThemeType, isDark: boolean, insets: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    backgroundColor: isDark ? Colors.background : Colors.secondary, 
    paddingTop: Platform.OS === "ios" ? insets.top : Math.max(insets.top, 20),
    paddingBottom: 18, 
    paddingHorizontal: 16, 
    flexDirection: "row", 
    alignItems: "flex-end", 
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: isDark ? Colors.background : "rgba(255,255,255,0.18)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerBody: { flex: 1 },
  headerLabel: { 
    fontFamily: Fonts.brandMedium, 
    fontSize: 10, 
    color: isDark ? Colors.muted : "rgba(255,255,255,0.7)", 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  headerTitle: { 
    fontFamily: Fonts.brandBold, 
    fontSize: FontSize.lg, 
    color: isDark ? Colors.text : Colors.primary 
  },
  deleteBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: isDark ? Colors.danger + "18" : "rgba(255,255,255,0.18)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  categoryInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  categoryMainImage: { width: 64, height: 64, borderRadius: 12 },
  categoryIconWrap: { 
    width: 64, 
    height: 64, 
    borderRadius: 12, 
    backgroundColor: Colors.primary + "11", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  catNameLabel: { fontFamily: Fonts.brandBold, fontSize: FontSize.lg, color: Colors.text },
  itemCountText: { fontFamily: Fonts.brand, fontSize: FontSize.sm, color: Colors.muted, marginTop: 2 },
  editCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: Colors.background, 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  sectionHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.text },
  addBtn: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  addBtnText: { fontFamily: Fonts.brandBold, fontSize: 12, color: Colors.white },
  itemsList: { gap: 12 },
  itemRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    height: 80,
  },
  itemStrip: { width: 4, height: "100%" },
  itemThumbnail: { width: 80, height: "100%", backgroundColor: Colors.border },
  itemRowBody: { flex: 1, flexDirection: "row", paddingHorizontal: 12, alignItems: "center" },
  itemRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  itemTypeDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.text },
  itemDesc: { fontFamily: Fonts.brand, fontSize: 11, color: Colors.muted, marginTop: 2 },
  itemRowRight: { alignItems: "flex-end", gap: 4 },
  itemPrice: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.primary },
  itemAvailDot: { width: 6, height: 6, borderRadius: 3 },

  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "flex-end" 
  },
  createModalOverlayFull: { flex: 1 },
  editModalCard: { 
    backgroundColor: Colors.surface, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingTop: 12 
  },
  createModalCard: { flex: 1, backgroundColor: Colors.surface },
  modalHandle: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: Colors.border, 
    alignSelf: "center", 
    marginBottom: 20 
  },
  modalHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: Colors.primary + "15", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.lg, color: Colors.text },
  modalSubtitle: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
  createModalScroll: { flex: 1, paddingHorizontal: 20 },
  inputLabel: { 
    fontFamily: Fonts.brandBold, 
    fontSize: 12, 
    color: Colors.muted, 
    marginBottom: 8, 
    marginTop: 16,
    paddingHorizontal: 20,
  },
  textInput: { 
    backgroundColor: Colors.background, 
    borderRadius: 12, 
    padding: 12, 
    fontFamily: Fonts.brand, 
    color: Colors.text, 
    borderWidth: 1, 
    borderColor: Colors.border,
    marginHorizontal: 20,
  },
  smallUploadCard: { 
    width: "100%", 
    height: 120, 
    borderRadius: 16, 
    backgroundColor: Colors.background, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderStyle: "dashed", 
    justifyContent: "center", 
    alignItems: "center", 
    overflow: "hidden",
    marginVertical: 10,
  },
  uploadCard: { 
    width: "100%", 
    height: 160, 
    borderRadius: 20, 
    backgroundColor: Colors.background, 
    borderWidth: 2, 
    borderColor: Colors.border, 
    borderStyle: "dashed", 
    justifyContent: "center", 
    alignItems: "center", 
    overflow: "hidden",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  uploadCardImage: { width: "100%", height: "100%" },
  uploadCardContent: { alignItems: "center", gap: 8 },
  uploadCardOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.3)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  createModalToggleRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 16,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 20,
  },
  createModalToggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  createModalToggleLabel: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.text },
  createModalToggle: { 
    width: 44, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: Colors.border, 
    padding: 2, 
    justifyContent: "center" 
  },
  createModalToggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },
  modalActions: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 24 
  },
  createModalFooter: { 
    flexDirection: "row", 
    gap: 12, 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border 
  },
  cancelButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    backgroundColor: Colors.background, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  cancelButtonFull: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: "center", 
    backgroundColor: Colors.background, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  cancelButtonText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.muted },
  primaryButton: { 
    flex: 2, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    backgroundColor: Colors.primary 
  },
  primaryButtonFull: { 
    flex: 2, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: "center", 
    backgroundColor: Colors.primary 
  },
  primaryButtonText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.white },

  // Uploading Overlay
  uploadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    zIndex: 9999, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  uploadingModal: { 
    backgroundColor: Colors.surface, 
    borderRadius: 24, 
    padding: 32, 
    alignItems: "center", 
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  uploadingIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: Colors.primary + "22", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 16 
  },
  uploadingTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.lg, color: Colors.text, marginBottom: 16 },
  progressBarContainer: { width: "100%", height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressBarBackground: { flex: 1, backgroundColor: Colors.border },
  progressBarFill: { height: "100%", backgroundColor: Colors.primary },
});

