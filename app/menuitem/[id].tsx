import { ThemeType } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import {
    useDeleteMenuItem,
    useMenuItem,
    useMenuCategories,
    useUpdateMenuItem,
} from "@/hooks/useMenuManagement";
import { useMyRestaurantApplication } from "@/hooks/useRestaurantPartnerRequest";
import { UpdateMenuItemRequest } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, validateImage } from "@/utility/cloudinary";
import { showAlert } from "@/store/useAlertStore";
import { useTheme } from "@/context/ThemeContext";

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEM_TYPES = ["VEG", "NON_VEG", "VEGAN"] as const;
const SPICE_LEVELS = ["Low", "Medium", "High"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionCard({ children, title, styles }: { children: React.ReactNode; title?: string; styles: any }) {
    return (
        <View style={styles.sectionCard}>
            {title && <Text style={styles.sectionCardTitle}>{title}</Text>}
            {children}
        </View>
    );
}

function FieldRow({ label, children, styles }: { label: string; children: React.ReactNode; styles: any }) {
    return (
        <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

function OptionPill<T extends string>({
    options,
    selected,
    colorMap,
    onSelect,
    Colors,
    styles,
}: {
    options: readonly T[];
    selected: T;
    colorMap: Record<string, { color: string }>;
    onSelect: (val: T) => void;
    Colors: ThemeType;
    styles: any;
}) {
    return (
        <View style={styles.pillGroup}>
            {options.map((opt) => {
                const isActive = selected === opt;
                const color = colorMap[opt]?.color ?? Colors.muted;
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[
                            styles.pill,
                            isActive && { backgroundColor: color, borderColor: color },
                        ]}
                        onPress={() => onSelect(opt)}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={[
                                styles.pillText,
                                isActive && { color: Colors.white },
                            ]}
                        >
                            {opt.replace("_", " ")}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MenuItemDetailScreen() {
    const { Colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);

    const TYPE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = useMemo(() => ({
        VEG: { color: "#2ECC71", icon: "leaf-outline", label: "Veg" },
        NON_VEG: { color: "#E74C3C", icon: "nutrition-outline", label: "Non-Veg" },
        EGG: { color: "#F39C12", icon: "ellipse-outline", label: "Egg" },
        VEGAN: { color: "#27AE60", icon: "flower-outline", label: "Vegan" },
    }), []);

    const SPICE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = useMemo(() => ({
        Low: { color: "#2ECC71", icon: "thermometer-outline" },
        Medium: { color: "#F39C12", icon: "thermometer-outline" },
        High: { color: "#E74C3C", icon: "flame-outline" },
    }), []);

    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: application } = useMyRestaurantApplication();
    const restaurantId = application?.id ?? "";

    const { data: item, isLoading, isError } = useMenuItem(id ?? "");
    const { data: categories = [] } = useMenuCategories(restaurantId);
    const { mutate: updateItem, isPending: updating } = useUpdateMenuItem();
    const { mutate: deleteItem, isPending: deleting } = useDeleteMenuItem();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [type, setType] = useState<string>("VEG");
    const [spiceLevel, setSpiceLevel] = useState<string>("Low");
    const [isBestseller, setIsBestseller] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const [categoryId, setCategoryId] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (item) {
            setName(item.name ?? "");
            setDescription(item.description ?? "");
            setPrice(String(item.price ?? ""));
            setPrepTime(String(item.prepTime ?? ""));
            setType(item.type ?? "VEG");
            setSpiceLevel(item.spiceLevel ?? "Low");
            setIsBestseller(item.isBestseller ?? false);
            setIsAvailable(item.isAvailable ?? true);
            setCategoryId(item.categoryId ?? "");
            setImage(item.image ?? null);
        }
    }, [item]);

    const markDirty = (setter: (v: any) => void) => (v: any) => {
        setter(v);
        setIsDirty(true);
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
                        setUploadProgress((prev) => {
                            const next = prev + Math.random() * 40;
                            return next > 50 ? 50 : next;
                        });
                    }, 200);

                    const response = await uploadImageToCloudinary(imageUri, "menu_items");

                    clearInterval(progressInterval);
                    setUploadProgress(100);

                    if (!response.secure_url) throw new Error("No image URL returned from Cloudinary");

                    setImage(response.secure_url);
                    setIsDirty(true);
                    setIsCloudinaryUploading(false);
                    setUploadProgress(0);

                    showAlert("Success! ✅", "Menu item image uploaded successfully", [{ text: "OK" }]);
                } catch (uploadError) {
                    showAlert("Upload Failed ❌", uploadError instanceof Error ? uploadError.message : "Failed to upload image", [{ text: "Try Again" }]);
                } finally {
                    setIsCloudinaryUploading(false);
                    setUploadProgress(0);
                }
            }
        } catch (error) {
            showAlert("Error", error instanceof Error ? error.message : "An error occurred", [{ text: "OK" }]);
        }
    };

    const handleSave = () => {
        if (!name.trim()) { showAlert("Validation", "Item name cannot be empty."); return; }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) { showAlert("Validation", "Please enter a valid price."); return; }

        const body: UpdateMenuItemRequest = {
            name: name.trim(),
            description: description.trim(),
            price: parsedPrice,
            prepTime: parseInt(prepTime, 10) || 0,
            type,
            spiceLevel,
            isBestseller,
            categoryId: categoryId || undefined,
            image: image || undefined,
        };

        updateItem({ id: id ?? "", body }, {
            onSuccess: () => { setIsDirty(false); showAlert("Success", "Menu item updated successfully."); },
            onError: () => showAlert("Error", "Failed to update menu item. Try again."),
        });
    };

    const handleToggleAvailability = () => {
        const newVal = !isAvailable;
        setIsAvailable(newVal);
        updateItem({ id: id ?? "", body: { isAvailable: newVal } as any }, {
            onError: () => { setIsAvailable(!newVal); showAlert("Error", "Couldn't update availability."); },
        });
    };

    const handleDelete = () => {
        showAlert("Delete Item", `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteItem(id ?? "", { onSuccess: () => router.back(), onError: () => showAlert("Error", "Failed to delete item. Try again.") }) },
        ]);
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading item…</Text>
            </View>
        );
    }

    if (isError || !item) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={styles.errorText}>Failed to load menu item.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const typeConfig = TYPE_CONFIG[type] ?? TYPE_CONFIG["VEG"];

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? Colors.background : Colors.secondary} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={isDark ? Colors.text : Colors.white} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.headerBadgeRow}>
                        <View style={[styles.typeBadge, { borderColor: typeConfig.color + "AA" }]}>
                            <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
                            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                        </View>
                        <View style={[styles.availBadge, { backgroundColor: isAvailable ? Colors.success + "33" : Colors.danger + "33" }]}>
                            <Text style={[styles.availBadgeText, { color: isAvailable ? Colors.success : Colors.danger }]}>{isAvailable ? "Available" : "Unavailable"}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
                    {deleting ? <ActivityIndicator size="small" color={Colors.danger} /> : <Ionicons name="trash-outline" size={18} color={Colors.danger} />}
                </TouchableOpacity>
            </View>

            <View style={styles.priceHero}>
                <Text style={styles.priceHeroLabel}>Current Price</Text>
                <Text style={styles.priceHeroValue}>₹{item.price}</Text>
                <View style={styles.priceHeroMeta}>
                    <View style={styles.metaTag}>
                        <Ionicons name="time-outline" size={13} color={Colors.muted} />
                        <Text style={styles.metaTagText}>{item.prepTime} min</Text>
                    </View>
                    {item.isBestseller && (
                        <View style={[styles.metaTag, styles.metaTagBestseller]}>
                            <Ionicons name="flame" size={13} color={Colors.secondary} />
                            <Text style={[styles.metaTagText, { color: Colors.secondary }]}>Bestseller</Text>
                        </View>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {isCloudinaryUploading && (
                    <View style={styles.uploadingOverlay}>
                        <View style={styles.uploadingModal}>
                            <View style={styles.uploadingIcon}>
                                <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
                            </View>
                            <Text style={styles.uploadingTitle}>Uploading...</Text>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBackground}>
                                    <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                                </View>
                            </View>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    </View>
                )}

                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <SectionCard styles={styles}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleLeft}>
                                <View style={[styles.toggleIconWrap, { backgroundColor: isAvailable ? Colors.success + "18" : Colors.danger + "18" }]}>
                                    <Ionicons name={isAvailable ? "checkmark-circle" : "close-circle"} size={22} color={isAvailable ? Colors.success : Colors.danger} />
                                </View>
                                <View>
                                    <Text style={styles.toggleTitle}>Item Availability</Text>
                                    <Text style={styles.toggleSub}>{isAvailable ? "Visible to customers" : "Hidden"}</Text>
                                </View>
                            </View>
                            <Switch
                                value={isAvailable}
                                onValueChange={handleToggleAvailability}
                                trackColor={{ false: isDark ? "#333" : "#F0F0F0", true: Colors.success + "55" }}
                                thumbColor={isAvailable ? Colors.success : Colors.muted}
                            />
                        </View>
                    </SectionCard>

                    <SectionCard title="ITEM IMAGE" styles={styles}>
                        <TouchableOpacity style={styles.uploadCard} onPress={pickImage} disabled={isCloudinaryUploading}>
                            {image ? (
                                <>
                                    <Image source={{ uri: image }} style={styles.uploadCardImage} />
                                    <View style={styles.cameraOverlay}>
                                        <View style={styles.cameraIconCircle}>
                                            <Ionicons name="camera" size={24} color="#FFF" />
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.uploadCardContent}>
                                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                                    <Text style={styles.uploadCardTitle}>Upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </SectionCard>

                    <SectionCard title="BASIC INFO" styles={styles}>
                        <FieldRow label="Item Name" styles={styles}>
                            <TextInput style={styles.fieldInput} value={name} onChangeText={markDirty(setName)} placeholder="Enter item name" placeholderTextColor={Colors.muted} />
                        </FieldRow>
                        <View style={styles.fieldDivider} />
                        <FieldRow label="Description" styles={styles}>
                            <TextInput style={[styles.fieldInput, styles.fieldInputMulti]} value={description} onChangeText={markDirty(setDescription)} placeholder="Item description…" placeholderTextColor={Colors.muted} multiline numberOfLines={3} />
                        </FieldRow>
                    </SectionCard>

                    <SectionCard title="PRICING & TIME" styles={styles}>
                        <View style={styles.doubleRow}>
                            <View style={styles.doubleField}>
                                <Text style={styles.fieldLabel}>Price (₹)</Text>
                                <TextInput style={styles.fieldInputInline} value={price} onChangeText={markDirty(setPrice)} keyboardType="decimal-pad" />
                            </View>
                            <View style={styles.doubleFieldDivider} />
                            <View style={styles.doubleField}>
                                <Text style={styles.fieldLabel}>Prep Time (min)</Text>
                                <TextInput style={styles.fieldInputInline} value={prepTime} onChangeText={markDirty(setPrepTime)} keyboardType="number-pad" />
                            </View>
                        </View>
                    </SectionCard>

                    <SectionCard title="ITEM TYPE" styles={styles}>
                        <OptionPill options={ITEM_TYPES} selected={type as any} colorMap={TYPE_CONFIG} onSelect={markDirty(setType)} Colors={Colors} styles={styles} />
                    </SectionCard>

                    <SectionCard title="SPICE LEVEL" styles={styles}>
                        <OptionPill options={SPICE_LEVELS} selected={spiceLevel as any} colorMap={SPICE_CONFIG} onSelect={markDirty(setSpiceLevel)} Colors={Colors} styles={styles} />
                    </SectionCard>

                    {categories.length > 0 && (
                        <SectionCard title="CATEGORY" styles={styles}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {categories.map((cat) => (
                                    <TouchableOpacity key={cat.id} style={[styles.catPill, categoryId === cat.id && styles.catPillActive]} onPress={() => markDirty(setCategoryId)(cat.id)}>
                                        <Text style={[styles.catPillText, categoryId === cat.id && styles.catPillTextActive]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </SectionCard>
                    )}

                    <SectionCard styles={styles}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleLeft}>
                                <View style={[styles.toggleIconWrap, { backgroundColor: isBestseller ? Colors.secondary + "22" : Colors.background }]}><Ionicons name="flame" size={22} color={isBestseller ? Colors.secondary : Colors.muted} /></View>
                                <View><Text style={styles.toggleTitle}>Bestseller Tag</Text></View>
                            </View>
                            <Switch value={isBestseller} onValueChange={markDirty(setIsBestseller)} trackColor={{ false: isDark ? "#333" : "#F0F0F0", true: Colors.secondary + "55" }} thumbColor={isBestseller ? Colors.secondary : Colors.muted} />
                        </View>
                    </SectionCard>

                    <TouchableOpacity style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]} onPress={handleSave} disabled={!isDirty || updating}>
                        <Text style={styles.saveBtnText}>{updating ? "Saving..." : "Save Changes"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        gap: 12 
    },
    backCircle: { 
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        backgroundColor: isDark ? Colors.background : "rgba(255,255,255,0.18)", 
        justifyContent: "center", 
        alignItems: "center" 
    },
    headerCenter: { flex: 1 },
    headerTitle: { 
        fontFamily: Fonts.brandBold, 
        fontSize: FontSize.xl, 
        color: isDark ? Colors.text : Colors.primary, 
        letterSpacing: 0.3 
    },
    headerBadgeRow: { flexDirection: "row", gap: 6 },
    typeBadge: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 4, 
        borderWidth: 1, 
        borderRadius: 6, 
        paddingHorizontal: 7, 
        paddingVertical: 2, 
        backgroundColor: isDark ? Colors.background : "rgba(255,255,255,0.12)" 
    },
    typeBadgeText: { fontFamily: Fonts.brandMedium, fontSize: 10 },
    availBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    availBadgeText: { fontFamily: Fonts.brandBold, fontSize: 10 },
    deleteBtn: { 
        width: 38, 
        height: 38, 
        borderRadius: 12, 
        backgroundColor: isDark ? Colors.danger + "22" : "rgba(255,255,255,0.18)", 
        justifyContent: "center", 
        alignItems: "center" 
    },
    priceHero: { 
        padding: 20, 
        backgroundColor: isDark ? Colors.background : Colors.secondary, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30, 
        alignItems: "center" 
    },
    priceHeroLabel: { 
        fontFamily: Fonts.brand, 
        fontSize: 12, 
        color: "rgba(255,255,255,0.7)", 
        marginBottom: 4 
    },
    priceHeroValue: { fontFamily: Fonts.brandBlack, fontSize: 36, color: isDark ? Colors.text : Colors.white },
    priceHeroMeta: { flexDirection: "row", gap: 8, marginTop: 12 },
    metaTag: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 4, 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 10, 
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    metaTagBestseller: { backgroundColor: Colors.secondary + "22" },
    metaTagText: { fontFamily: Fonts.brandMedium, fontSize: 11, color: "rgba(255,255,255,0.8)" },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
    loadingText: { fontFamily: Fonts.brand, fontSize: FontSize.sm, color: Colors.muted, marginTop: 12 },
    errorText: { fontFamily: Fonts.brand, fontSize: FontSize.sm, color: Colors.danger, marginTop: 12, marginBottom: 20 },
    backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    backBtnText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.white },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    sectionCard: { 
        backgroundColor: Colors.surface, 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionCardTitle: { 
        fontFamily: Fonts.brandBold, 
        fontSize: 12, 
        color: Colors.muted, 
        letterSpacing: 1, 
        textTransform: "uppercase", 
        marginBottom: 16 
    },
    fieldRow: { marginBottom: 0 },
    fieldLabel: { fontFamily: Fonts.brandBold, fontSize: 12, color: Colors.muted, marginBottom: 8 },
    fieldInput: { 
        fontFamily: Fonts.brand, 
        fontSize: FontSize.md, 
        color: Colors.text, 
        backgroundColor: Colors.background, 
        borderRadius: 12, 
        padding: 12, 
        borderWidth: 1, 
        borderColor: Colors.border 
    },
    fieldInputMulti: { height: 100, textAlignVertical: "top" },
    fieldDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
    doubleRow: { flexDirection: "row", gap: 16 },
    doubleField: { flex: 1 },
    doubleFieldDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
    fieldInputInline: { 
        fontFamily: Fonts.brandBold, 
        fontSize: FontSize.md, 
        color: Colors.text, 
        backgroundColor: Colors.background, 
        borderRadius: 12, 
        padding: 12, 
        borderWidth: 1, 
        borderColor: Colors.border 
    },
    pillGroup: { flexDirection: "row", gap: 8 },
    pill: { 
        flex: 1, 
        paddingVertical: 10, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        alignItems: "center", 
        backgroundColor: Colors.background 
    },
    pillText: { fontFamily: Fonts.brandBold, fontSize: 11, color: Colors.muted },
    catPill: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        backgroundColor: Colors.background 
    },
    catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catPillText: { fontFamily: Fonts.brandBold, fontSize: 12, color: Colors.muted },
    catPillTextActive: { color: Colors.white },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    toggleIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    toggleTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.text },
    toggleSub: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
    uploadCard: { 
        width: "100%", 
        height: 160, 
        borderRadius: 20, 
        backgroundColor: Colors.background, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        borderStyle: "dashed", 
        justifyContent: "center", 
        alignItems: "center", 
        overflow: "hidden" 
    },
    uploadCardImage: { width: "100%", height: "100%" },
    uploadCardContent: { alignItems: "center", gap: 8 },
    uploadCardTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.primary },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    cameraIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    saveBtn: { 
        backgroundColor: Colors.primary, 
        padding: 18, 
        borderRadius: 16, 
        alignItems: "center", 
        shadowColor: Colors.primary, 
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 12, 
        elevation: 8 
    },
    saveBtnDisabled: { backgroundColor: Colors.muted + "44", shadowOpacity: 0, elevation: 0 },
    saveBtnText: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.white },

    // Uploading Overlay
    uploadingOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: "rgba(0,0,0,0.7)", 
        zIndex: 999, 
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
        borderRadius: 20, 
        backgroundColor: Colors.primary + "18", 
        justifyContent: "center", 
        alignItems: "center", 
        marginBottom: 16 
    },
    uploadingTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.lg, color: Colors.text, marginBottom: 16 },
    progressBarContainer: { width: "100%", height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 20 },
    progressBarBackground: { flex: 1, backgroundColor: Colors.border },
    progressBarFill: { height: "100%", backgroundColor: Colors.primary },
    progressPercentage: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.text },
    loadingSpinnerContainer: { marginBottom: 16 },
    uploadingHint: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
});
