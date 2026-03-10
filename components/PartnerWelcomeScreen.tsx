import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import { FontSize } from "@/constants/typography";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePartnerStore } from "@/store/usePartner";

// ─── Welcome / Partner Onboarding Screen ─────────────────────────────────────
export function PartnerWelcomeScreen() {
    const { data: session } = authClient.useSession();
    const firstName = session?.user?.name?.split(" ")[0] ?? "Chef";

    return (
        <View style={welcomeStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Top curved background */}
            <View style={welcomeStyles.topBg}>
                <View style={welcomeStyles.iconCircle}>
                    <Ionicons name="storefront" size={52} color={Colors.white} />
                </View>
                <Text style={welcomeStyles.greeting}>Hello, {firstName}! 👋</Text>
                <Text style={welcomeStyles.tagline}>Ready to grow your business?</Text>
            </View>

            {/* Content */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={welcomeStyles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Feature Cards */}
                <View style={welcomeStyles.featureCard}>
                    <View style={[welcomeStyles.featureIcon, { backgroundColor: "#E8F5E9" }]}>
                        <Ionicons name="trending-up" size={24} color={Colors.success} />
                    </View>
                    <View style={welcomeStyles.featureText}>
                        <Text style={welcomeStyles.featureTitle}>Grow Your Revenue</Text>
                        <Text style={welcomeStyles.featureDesc}>
                            Reach thousands of hungry customers in your area every day.
                        </Text>
                    </View>
                </View>

                <View style={welcomeStyles.featureCard}>
                    <View style={[welcomeStyles.featureIcon, { backgroundColor: "#FFF8E1" }]}>
                        <Ionicons name="speedometer" size={24} color={Colors.warning} />
                    </View>
                    <View style={welcomeStyles.featureText}>
                        <Text style={welcomeStyles.featureTitle}>Easy Dashboard</Text>
                        <Text style={welcomeStyles.featureDesc}>
                            Manage orders, menu, and earnings all from one place.
                        </Text>
                    </View>
                </View>

                <View style={welcomeStyles.featureCard}>
                    <View style={[welcomeStyles.featureIcon, { backgroundColor: "#E3F2FD" }]}>
                        <Ionicons name="shield-checkmark" size={24} color="#1565C0" />
                    </View>
                    <View style={welcomeStyles.featureText}>
                        <Text style={welcomeStyles.featureTitle}>Trusted Platform</Text>
                        <Text style={welcomeStyles.featureDesc}>
                            Secure payments, verified customers, and 24/7 support.
                        </Text>
                    </View>
                </View>

                {/* Stats strip */}
                <View style={welcomeStyles.statsStrip}>
                    <View style={welcomeStyles.stat}>
                        <Text style={welcomeStyles.statNum}>500+</Text>
                        <Text style={welcomeStyles.statLbl}>Partners</Text>
                    </View>
                    <View style={welcomeStyles.statDivider} />
                    <View style={welcomeStyles.stat}>
                        <Text style={welcomeStyles.statNum}>50K+</Text>
                        <Text style={welcomeStyles.statLbl}>Orders/day</Text>
                    </View>
                    <View style={welcomeStyles.statDivider} />
                    <View style={welcomeStyles.stat}>
                        <Text style={welcomeStyles.statNum}>4.8 ⭐</Text>
                        <Text style={welcomeStyles.statLbl}>Avg Rating</Text>
                    </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    style={welcomeStyles.ctaBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/restaurantForm")}
                >
                    <Ionicons name="add-circle-outline" size={22} color={Colors.white} />
                    <Text style={welcomeStyles.ctaBtnText}>Create Your Restaurant</Text>
                </TouchableOpacity>

                <Text style={welcomeStyles.footerNote}>
                    Our team reviews every application within 24–48 hours. 🕐
                </Text>
            </ScrollView>
        </View>
    );
}
const welcomeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    topBg: {
        backgroundColor: Colors.primary,
        paddingTop: 60,
        paddingBottom: 60,
        alignItems: "center",
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    greeting: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xxl,
        color: Colors.white,
        marginBottom: 6,
    },
    tagline: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: "rgba(255,255,255,0.75)",
        letterSpacing: 0.5,
    },
    content: {
        padding: 20,
        paddingTop: 24,
    },
    featureCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 14,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    featureIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        marginBottom: 4,
    },
    featureDesc: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    statsStrip: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        marginTop: 8,
        justifyContent: "space-around",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stat: {
        alignItems: "center",
    },
    statNum: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xl,
        color: Colors.primary,
    },
    statLbl: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: Colors.border,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 17,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: Colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
        marginBottom: 16,
    },
    ctaBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    footerNote: {
        textAlign: "center",
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginBottom: 20,
    },
});