import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useSubmitRestaurantPartnerRequest } from "../../hooks/useRestaurantPartnerRequest";
import { Colors } from "../../constants/colors";
import { Link, router } from "expo-router";
import { Button } from "@react-navigation/elements";
import { authClient } from "@/lib/auth-client";
import { usePartnerStore } from "@/store/usePartner";

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
    const { setAppliedForPartner } = usePartnerStore();

    const { mutate, isPending } = useSubmitRestaurantPartnerRequest();

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
            !gstNumber
        ) {
            Alert.alert("Validation Error", "Please fill in all fields.");
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
            },
            {
                onSuccess: (data) => {
                    Alert.alert(
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
                        Alert.alert(
                            "Already Applied",
                            "You already have an existing application. Our team will review it soon."
                        );
                    } else {
                        Alert.alert(
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
});
