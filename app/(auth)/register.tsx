import { ThemeType } from "@/constants/colors";
import { Fonts, FontSize } from "@/constants/typography";
import { authClient } from "@/lib/auth-client";
import { showAlert } from "@/store/useAlertStore";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function Register() {
    const { Colors, isDark } = useTheme();
    const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [haveReferralCode, setHaveReferralCode] = useState<boolean>(false);
    const [referralCode, setReferralCode] = useState<string>("");

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showAlert("Error", "Please fill in all fields");
            return;
        }

        setIsLoading(true);

        await authClient.signUp.email(
            { name, email, password },
            {
                body: haveReferralCode ? { invitedByCode: referralCode } : undefined,
                onSuccess: async (ctx) => {
                    // 1. Extract token directly from the response body (ctx.data)
                    const apiToken = ctx.data?.token;
                    if (apiToken) {
                        // 2. Save it to SecureStore under the name "token"
                        await SecureStore.setItemAsync("token", apiToken);
                        console.log("✅ Token successfully saved as 'token':", apiToken);
                        router.replace("/");
                    }

                    setIsLoading(false);
                    showAlert("Success", "Account created successfully", [
                        { text: "OK", onPress: () => router.replace("/") }
                    ]);
                },
                onError: (ctx: any) => {
                    setIsLoading(false);
                    showAlert("Registration Failed", ctx.error.message);
                },
            }
        );
    };

    const handleGoogleRegister = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "fooddeliveryrestaurant:///",
            });
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={Colors.background} />
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <Image
                    source={require("@/assets/images/app-logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* ── Email Sign-up Section ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Create Account</Text>

                    <TextInput
                        placeholder="Full Name"
                        placeholderTextColor={Colors.muted}
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                    />

                    <TextInput
                        placeholder="Email Address"
                        placeholderTextColor={Colors.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                    />

                    <TextInput
                        placeholder="Password"
                        placeholderTextColor={Colors.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={styles.input}
                    />
                    {
                        haveReferralCode && (
                            <TextInput
                                placeholder="Enter referral code"
                                placeholderTextColor={Colors.muted}
                                value={referralCode}
                                onChangeText={setReferralCode}
                                style={[styles.input, styles.referralCodeInput]}
                            />
                        )
                    }
                    {
                        !haveReferralCode && (
                            <Text onPress={() => setHaveReferralCode(true)} style={styles.referralCodeText}>Have a referral code?</Text>
                        )
                    }
                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color={isDark ? Colors.background : Colors.white} />
                                <Text style={styles.primaryButtonText}>Creating Account...</Text>
                            </>
                        ) : (
                            <Text style={styles.primaryButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Divider ── */}
                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.divider} />
                </View>

                {/* ── Google ── */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleRegister}
                    disabled={isLoading}
                >
                    <Image
                        source={require("@/assets/images/google-logo.png")}
                        style={styles.googleIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* ── Sign in link ── */}
                <TouchableOpacity
                    onPress={() => router.push("/(auth)/login")}
                    style={styles.switchContainer}
                >
                    <Text style={styles.switchText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (Colors: ThemeType, isDark: boolean) => StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
        justifyContent: "center",
        backgroundColor: Colors.background,
    },
    logo: {
        width: 180,
        height: 180,
        alignSelf: "center",
        marginBottom: 4,
    },

    // ── Section ────────────────────────────────────────────────
    section: {
        width: "100%",
        marginBottom: 8,
    },
    sectionLabel: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.muted,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },

    // ── Inputs ───────────────────────────────────────────────
    input: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 14,
        borderRadius: 16,
        marginBottom: 14,
        fontSize: FontSize.md,
        fontFamily: Fonts.brand,
        backgroundColor: Colors.surface,
        color: Colors.text,
    },

    // ── Buttons ──────────────────────────────────────────────
    primaryButton: {
        backgroundColor: isDark ? Colors.primary : Colors.secondary,
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: isDark ? Colors.primary : Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        color: isDark ? Colors.background : Colors.white,
        fontSize: FontSize.md,
        fontFamily: Fonts.brandBold,
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // ── Divider ──────────────────────────────────────────────
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    divider: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: {
        marginHorizontal: 12,
        color: Colors.muted,
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },

    // ── Google ───────────────────────────────────────────────
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        height: 52,
        borderRadius: 16,
        backgroundColor: isDark ? Colors.surface : Colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 8,
    },
    googleIcon: { width: 32, height: 32 },
    googleButtonText: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontFamily: Fonts.brandMedium,
    },

    // ── Switch ───────────────────────────────────────────────
    switchContainer: { marginTop: 20, alignItems: "center" },
    switchText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontFamily: Fonts.brandMedium,
    },
    referralCodeText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontFamily: Fonts.brandMedium,
        textAlign: "center",
        marginBottom: 10,
        textDecorationLine: "underline",
    },
    referralCodeInput: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 15,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        fontSize: FontSize.md,
        fontFamily: Fonts.brandMedium,
        color: Colors.text,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        marginBottom: 8,
    }
});
