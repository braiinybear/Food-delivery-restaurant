import { Colors } from "@/constants/colors";
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
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEM_TYPES = ["VEG", "NON_VEG", "EGG", "VEGAN"] as const;
const SPICE_LEVELS = ["Low", "Medium", "High"] as const;

const TYPE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    VEG: { color: "#2ECC71", icon: "leaf-outline", label: "Veg" },
    NON_VEG: { color: "#E74C3C", icon: "nutrition-outline", label: "Non-Veg" },
    EGG: { color: "#F39C12", icon: "ellipse-outline", label: "Egg" },
    VEGAN: { color: "#27AE60", icon: "flower-outline", label: "Vegan" },
};

const SPICE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    Low: { color: "#2ECC71", icon: "thermometer-outline" },
    Medium: { color: "#F39C12", icon: "thermometer-outline" },
    High: { color: "#E74C3C", icon: "flame-outline" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
    return (
        <View style={styles.sectionCard}>
            {title && <Text style={styles.sectionCardTitle}>{title}</Text>}
            {children}
        </View>
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
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
}: {
    options: readonly T[];
    selected: T;
    colorMap: Record<string, { color: string }>;
    onSelect: (val: T) => void;
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
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: application } = useMyRestaurantApplication();
    const restaurantId = application?.id ?? "";

    const { data: item, isLoading, isError } = useMenuItem(id ?? "");
    const { data: categories = [] } = useMenuCategories(restaurantId);
    const { mutate: updateItem, isPending: updating } = useUpdateMenuItem();
    const { mutate: deleteItem, isPending: deleting } = useDeleteMenuItem();

    // ── Editable form state ──
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

    // Populate from API data
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
        }
    }, [item]);

    const markDirty = (setter: (v: any) => void) => (v: any) => {
        setter(v);
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Validation", "Item name cannot be empty.");
            return;
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert("Validation", "Please enter a valid price.");
            return;
        }

        const body: UpdateMenuItemRequest = {
            name: name.trim(),
            description: description.trim(),
            price: parsedPrice,
            prepTime: parseInt(prepTime, 10) || 0,
            type,
            spiceLevel,
            isBestseller,
            categoryId: categoryId || undefined,
        };

        updateItem(
            { id: id ?? "", body },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    Alert.alert("Success", "Menu item updated successfully.");
                },
                onError: () => Alert.alert("Error", "Failed to update menu item. Try again."),
            }
        );
    };

    const handleToggleAvailability = () => {
        const newVal = !isAvailable;
        setIsAvailable(newVal);
        updateItem(
            { id: id ?? "", body: { isAvailable: newVal } as any },
            {
                onError: () => {
                    setIsAvailable(!newVal); // revert on failure
                    Alert.alert("Error", "Couldn't update availability.");
                },
            }
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Item",
            `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteItem(id ?? "", {
                            onSuccess: () => router.back(),
                            onError: () => Alert.alert("Error", "Failed to delete item. Try again."),
                        });
                    },
                },
            ]
        );
    };

    // ── Loading / Error states ──
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
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={Colors.white} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.headerBadgeRow}>
                        <View style={[styles.typeBadge, { borderColor: typeConfig.color + "AA" }]}>
                            <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
                            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                                {typeConfig.label}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.availBadge,
                                {
                                    backgroundColor: isAvailable
                                        ? Colors.success + "33"
                                        : Colors.danger + "33",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.availBadgeText,
                                    { color: isAvailable ? Colors.success : Colors.danger },
                                ]}
                            >
                                {isAvailable ? "Available" : "Unavailable"}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <Ionicons name="trash-outline" size={18} color={Colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Price hero ── */}
            <View style={styles.priceHero}>
                <Text style={styles.priceHeroLabel}>Current Price</Text>
                <Text style={styles.priceHeroValue}>₹{item.price}</Text>
                <View style={styles.priceHeroMeta}>
                    <View style={styles.metaTag}>
                        <Ionicons name="time-outline" size={13} color={Colors.muted} />
                        <Text style={styles.metaTagText}>{item.prepTime} min prep</Text>
                    </View>
                    {item.isBestseller && (
                        <View style={[styles.metaTag, styles.metaTagBestseller]}>
                            <Ionicons name="flame" size={13} color={Colors.secondary} />
                            <Text style={[styles.metaTagText, { color: Colors.secondary }]}>
                                Bestseller
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ── Form ── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Availability Toggle */}
                    <SectionCard>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleLeft}>
                                <View
                                    style={[
                                        styles.toggleIconWrap,
                                        {
                                            backgroundColor: isAvailable
                                                ? Colors.success + "18"
                                                : Colors.danger + "18",
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={isAvailable ? "checkmark-circle" : "close-circle"}
                                        size={22}
                                        color={isAvailable ? Colors.success : Colors.danger}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.toggleTitle}>Item Availability</Text>
                                    <Text style={styles.toggleSub}>
                                        {isAvailable
                                            ? "Visible & orderable by customers"
                                            : "Hidden from customer menu"}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isAvailable}
                                onValueChange={handleToggleAvailability}
                                trackColor={{
                                    false: Colors.light,
                                    true: Colors.success + "55",
                                }}
                                thumbColor={isAvailable ? Colors.success : Colors.muted}
                            />
                        </View>
                    </SectionCard>

                    {/* Basic Info */}
                    <SectionCard title="BASIC INFO">
                        <FieldRow label="Item Name">
                            <TextInput
                                style={styles.fieldInput}
                                value={name}
                                onChangeText={markDirty(setName)}
                                placeholder="Enter item name"
                                placeholderTextColor={Colors.muted}
                            />
                        </FieldRow>
                        <View style={styles.fieldDivider} />
                        <FieldRow label="Description">
                            <TextInput
                                style={[styles.fieldInput, styles.fieldInputMulti]}
                                value={description}
                                onChangeText={markDirty(setDescription)}
                                placeholder="Item description…"
                                placeholderTextColor={Colors.muted}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </FieldRow>
                    </SectionCard>

                    {/* Pricing & Prep Time */}
                    <SectionCard title="PRICING & TIME">
                        <View style={styles.doubleRow}>
                            <View style={styles.doubleField}>
                                <Text style={styles.fieldLabel}>Price (₹)</Text>
                                <TextInput
                                    style={styles.fieldInputInline}
                                    value={price}
                                    onChangeText={markDirty(setPrice)}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>
                            <View style={styles.doubleFieldDivider} />
                            <View style={styles.doubleField}>
                                <Text style={styles.fieldLabel}>Prep Time (min)</Text>
                                <TextInput
                                    style={styles.fieldInputInline}
                                    value={prepTime}
                                    onChangeText={markDirty(setPrepTime)}
                                    keyboardType="number-pad"
                                    placeholder="15"
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>
                        </View>
                    </SectionCard>

                    {/* Type */}
                    <SectionCard title="ITEM TYPE">
                        <OptionPill
                            options={ITEM_TYPES}
                            selected={type as any}
                            colorMap={TYPE_CONFIG}
                            onSelect={markDirty(setType)}
                        />
                    </SectionCard>

                    {/* Spice Level */}
                    <SectionCard title="SPICE LEVEL">
                        <OptionPill
                            options={SPICE_LEVELS}
                            selected={spiceLevel as any}
                            colorMap={SPICE_CONFIG}
                            onSelect={markDirty(setSpiceLevel)}
                        />
                    </SectionCard>

                    {/* Category */}
                    {categories.length > 0 && (
                        <SectionCard title="CATEGORY">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8 }}
                            >
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catPill,
                                            categoryId === cat.id && styles.catPillActive,
                                        ]}
                                        onPress={() => markDirty(setCategoryId)(cat.id)}
                                        activeOpacity={0.75}
                                    >
                                        <Text
                                            style={[
                                                styles.catPillText,
                                                categoryId === cat.id && styles.catPillTextActive,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </SectionCard>
                    )}

                    {/* Bestseller Toggle */}
                    <SectionCard>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleLeft}>
                                <View
                                    style={[
                                        styles.toggleIconWrap,
                                        {
                                            backgroundColor: isBestseller
                                                ? Colors.secondary + "22"
                                                : Colors.light,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="flame"
                                        size={22}
                                        color={isBestseller ? Colors.secondary : Colors.muted}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.toggleTitle}>Bestseller Tag</Text>
                                    <Text style={styles.toggleSub}>
                                        Highlight this item as a customer favourite
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isBestseller}
                                onValueChange={markDirty(setIsBestseller)}
                                trackColor={{
                                    false: Colors.light,
                                    true: Colors.secondary + "55",
                                }}
                                thumbColor={isBestseller ? Colors.secondary : Colors.muted}
                            />
                        </View>
                    </SectionCard>

                    {/* Save button */}
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            !isDirty && styles.saveBtnDisabled,
                            updating && { opacity: 0.7 },
                        ]}
                        onPress={handleSave}
                        disabled={!isDirty || updating}
                        activeOpacity={0.85}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color={Colors.white} />
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                        style={styles.dangerBtn}
                        onPress={handleDelete}
                        disabled={deleting}
                        activeOpacity={0.85}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color={Colors.danger} />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                <Text style={styles.dangerBtnText}>Delete This Item</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
    headerCenter: { flex: 1 },
    headerTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xl,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    headerBadgeRow: {
        flexDirection: "row",
        gap: 6,
        marginTop: 4,
    },
    typeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    typeBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: 10,
    },
    availBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    availBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: 10,
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.danger + "CC",
        justifyContent: "center",
        alignItems: "center",
    },

    // Price hero
    priceHero: {
        backgroundColor: Colors.surface,
        paddingVertical: 20,
        paddingHorizontal: 22,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
    },
    priceHeroLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.muted,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    priceHeroValue: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xxl,
        color: Colors.primary,
    },
    priceHeroMeta: {
        flexDirection: "row",
        gap: 8,
        flex: 1,
        flexWrap: "wrap",
    },
    metaTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.light,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    metaTagBestseller: {
        backgroundColor: Colors.secondary + "22",
    },
    metaTagText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 16, paddingBottom: 40, gap: 12, paddingHorizontal: 16 },

    // Section card
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionCardTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: 10,
        color: Colors.muted,
        letterSpacing: 2,
        marginBottom: 14,
    },

    // Field row
    fieldRow: {
        gap: 6,
    },
    fieldLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        letterSpacing: 0.3,
    },
    fieldInput: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.md,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: Colors.background,
    },
    fieldInputMulti: {
        minHeight: 80,
        paddingTop: 11,
    },
    fieldDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },

    // Double row (price + prep time)
    doubleRow: {
        flexDirection: "row",
        gap: 12,
    },
    doubleField: {
        flex: 1,
        gap: 8,
    },
    doubleFieldDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    fieldInputInline: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: Colors.background,
    },

    // Pill selector
    pillGroup: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    pill: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        backgroundColor: Colors.background,
    },
    pillText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },

    // Category pill
    catPill: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Colors.background,
    },
    catPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    catPillText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    catPillTextActive: {
        color: Colors.white,
    },

    // Toggle row
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    toggleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    toggleIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    toggleTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    toggleSub: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
        maxWidth: 200,
    },

    // Save button
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 4,
    },
    saveBtnDisabled: {
        backgroundColor: Colors.muted,
    },
    saveBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
    },

    // Delete button
    dangerBtn: {
        borderWidth: 1.5,
        borderColor: Colors.danger,
        borderRadius: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    dangerBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.danger,
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
});