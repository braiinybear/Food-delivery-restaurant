import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
} from "react-native";
import { showAlert } from "@/store/useAlertStore";
import { useSubmitRestaurantPartnerRequest } from "../../hooks/useRestaurantPartnerRequest";
import { Colors } from "../../constants/colors";
import { router } from "expo-router";
import { usePartnerStore } from "@/store/usePartner";
import { uploadImageToCloudinary, validateImage } from "@/utility/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

export default function RestaurantForm() {
    const [restaurantName, setRestaurantName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [costForTwo, setCostForTwo] = useState("");
    const [fssaiCode, setFssaiCode] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [fssaiDocUrl, setFssaiDocUrl] = useState("");
    const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentUploadingItem, setCurrentUploadingItem] = useState<string>("");
    const { setAppliedForPartner } = usePartnerStore();

    const { mutate, isPending } = useSubmitRestaurantPartnerRequest();

    const pickImage = async (setImageUrl: (url: string) => void, itemName: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: itemName === "banner" ? [16, 9] : [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;

                // ─── Validate image before uploading ─────────────────────────────
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

                // ─── Start cloudinary upload ────────────────────────────────
                setCurrentUploadingItem(itemName);
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
                    const response = await uploadImageToCloudinary(imageUri, "restaurant_uploads");

                    clearInterval(progressInterval);
                    setUploadProgress(100);

                    // ─── Store the secure URL ──────────────────────────────
                    setImageUrl(response.secure_url);

                    // ─── Show success message ──────────────────────────────
                    showAlert(
                        "Success! ✅",
                        `${itemName} uploaded to cloud successfully`,
                        [{ text: "OK" }],
                    );
                } catch (uploadError) {
                    showAlert(
                        "Upload Failed ❌",
                        uploadError instanceof Error
                            ? uploadError.message
                            : `Failed to upload ${itemName}`,
                        [{ text: "Try Again" }],
                    );
                } finally {
                    setIsCloudinaryUploading(false);
                    setUploadProgress(0);
                    setCurrentUploadingItem("");
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

    const toggleCuisine = (cuisine: string) => {
        setSelectedCuisines((prev) =>
            prev.includes(cuisine)
                ? prev.filter((c) => c !== cuisine)
                : [...prev, cuisine]
        );
    };

    const handleSubmit = () => {
        if (
            !restaurantName ||
            !description ||
            !address ||
            selectedCuisines.length === 0 ||
            !costForTwo ||
            !fssaiCode ||
            !gstNumber ||
            !logoUrl ||
            !bannerUrl ||
            !fssaiDocUrl
        ) {
            showAlert("Validation Error", "Please fill in all fields including image uploads.");
            return;
        }

        mutate(
            {
                restaurantName,
                description,
                address,
                cuisineTypes: selectedCuisines,
                costForTwo: parseInt(costForTwo),
                fssaiCode,
                gstNumber,
                logoUrl,
                bannerUrl,
                fssaiDocUrl,
            },
            {
                onSuccess: (data) => {
                    showAlert(
                        "Application Submitted! 🎉",
                        `Your restaurant "${data.restaurantName}" has been submitted.\nStatus: ${data.status}`,
                        [{ text: "OK" }]
                    );
                    setAppliedForPartner(true)
                    router.push("/")
                },
                onError: (error: any) => {
                    const status = error?.response?.status;
                    if (status === 409) {
                        showAlert(
                            "Already Applied",
                            "You already have an existing application. Our team will review it soon."
                        );
                    } else {
                        showAlert(
                            "Error",
                            error?.response?.data?.message || "Something went wrong."
                        );
                    }
                },
            }
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                            Uploading {currentUploadingItem}...
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

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>
                        Fill in your restaurant details. Our team will review and get back
                        to you.
                    </Text>
                </View>
                {/* Form Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Basic Information</Text>

                    <InputField
                        label="Restaurant Name"
                        placeholder="e.g. Priya's Kitchen"
                        value={restaurantName}
                        onChangeText={setRestaurantName}
                    />
                    <InputField
                        label="Description"
                        placeholder="Describe your restaurant..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                    <InputField
                        label="Address"
                        placeholder="e.g. 123, MG Road, Delhi – 110001"
                        value={address}
                        onChangeText={setAddress}
                    />
                </View>



                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Cuisine Types</Text>
                    <View style={styles.chipContainer}>
                        {CUISINE_OPTIONS.map((cuisine) => {
                            const selected = selectedCuisines.includes(cuisine);
                            return (
                                <TouchableOpacity
                                    key={cuisine}
                                    style={[styles.chip, selected && styles.chipSelected]}
                                    onPress={() => toggleCuisine(cuisine)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            selected && styles.chipTextSelected,
                                        ]}
                                    >
                                        {cuisine}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Business Details</Text>
                    <InputField
                        label="Cost for Two (₹)"
                        placeholder="e.g. 400"
                        value={costForTwo}
                        onChangeText={setCostForTwo}
                        keyboardType="number-pad"
                    />
                    <InputField
                        label="FSSAI License Number"
                        placeholder="14-digit FSSAI code"
                        value={fssaiCode}
                        onChangeText={setFssaiCode}
                        keyboardType="number-pad"
                    />
                    <InputField
                        label="GST Number"
                        placeholder="e.g. 29ABCDE1234F1Z5"
                        value={gstNumber}
                        onChangeText={setGstNumber}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Media Uploads Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Upload Media</Text>
                    
                    {/* Restaurant Logo */}
                    <ImageUploadCard
                        icon="image-outline"
                        title="Restaurant Logo"
                        subtitle="Square image (max 5MB)"
                        imageUrl={logoUrl}
                        isLoading={isCloudinaryUploading}
                        onPress={() => pickImage(setLogoUrl, "Logo")}
                    />

                    {/* Banner Image */}
                    <ImageUploadCard
                        icon="image-outline"
                        title="Banner Image"
                        subtitle="Wide image (max 5MB)"
                        imageUrl={bannerUrl}
                        isLoading={isCloudinaryUploading}
                        onPress={() => pickImage(setBannerUrl, "Banner")}
                    />

                    {/* FSSAI Document */}
                    <ImageUploadCard
                        icon="document-outline"
                        title="FSSAI License Copy"
                        subtitle="Clear image of your FSSAI license (max 5MB)"
                        imageUrl={fssaiDocUrl}
                        isLoading={isCloudinaryUploading}
                        onPress={() => pickImage(setFssaiDocUrl, "FSSAI Document")}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.button, isPending && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isPending}
                >
                    {isPending ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Submit Application</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Reusable Input Field ────────────────────────────────────────────────────
function InputField({
    label,
    placeholder,
    value,
    onChangeText,
    multiline,
    numberOfLines,
    keyboardType,
    autoCapitalize,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: any;
    autoCapitalize?: any;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                placeholder={placeholder}
                placeholderTextColor={Colors.muted}
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );
}

// ─── Reusable Image Upload Card ───────────────────────────────────────────────
function ImageUploadCard({
    icon,
    title,
    subtitle,
    imageUrl,
    isLoading,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    imageUrl: string;
    isLoading: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.uploadCard, imageUrl && styles.uploadCardUploaded]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.7}
        >
            {imageUrl ? (
                <>
                    <Image
                        source={{ uri: imageUrl }}
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
                    <View
                        style={[
                            styles.uploadCardIcon,
                            imageUrl && styles.uploadCardIconSuccess,
                        ]}
                    >
                        <Ionicons
                            name={imageUrl ? "checkmark" : icon}
                            size={24}
                            color={imageUrl ? Colors.white : Colors.primary}
                        />
                    </View>
                    <View style={styles.uploadCardText}>
                        <Text style={styles.uploadCardTitle}>{title}</Text>
                        <Text style={styles.uploadCardSubtitle}>{subtitle}</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 20,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: Colors.primary,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.muted,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
        backgroundColor: Colors.surface,
    },
    inputMultiline: {
        height: 90,
        textAlignVertical: "top",
        paddingTop: 10,
    },
    row: {
        flexDirection: "row",
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: "500",
    },
    chipTextSelected: {
        color: Colors.white,
        fontWeight: "700",
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.5,
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
    uploadCard: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: Colors.surface,
        borderStyle: "dashed",
        overflow: "hidden",
        minHeight: 100,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadCardUploaded: {
        backgroundColor: "rgba(46, 204, 113, 0.05)",
        borderColor: Colors.primary,
        borderStyle: "solid",
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
    uploadCardIconSuccess: {
        backgroundColor: Colors.primary,
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
});
