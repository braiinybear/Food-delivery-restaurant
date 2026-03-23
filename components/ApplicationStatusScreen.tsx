import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { RestaurantApplicationResponse } from "@/types/restaurantRegistration";
import { authClient } from "@/lib/auth-client";
import { usePartnerStore } from "@/store/usePartner";

type Props = {
    application: RestaurantApplicationResponse | undefined;
    isLoading: boolean;
};

const STATUS_CONFIG = {
    PENDING: {
        icon: "time-outline" as const,
        iconBg: "#FFF8E1",
        iconColor: Colors.warning,
        badgeBg: "#FFF3CD",
        badgeText: Colors.warning,
        badge: "UNDER REVIEW",
        title: "Application Received!",
        subtitle: "We're reviewing your restaurant details.",
        bodyTitle: "What happens next?",
        steps: [
            { icon: "checkmark-circle" as const, color: Colors.success, text: "Application submitted successfully" },
            { icon: "search" as const, color: Colors.warning, text: "Our team is verifying your details (24–48 hrs)" },
            { icon: "storefront-outline" as const, color: Colors.muted, text: "Once approved, your dashboard unlocks" },
        ],
        accentColor: Colors.warning,
    },
    APPROVED: {
        icon: "checkmark-circle" as const,
        iconBg: "#E8F8F0",
        iconColor: Colors.success,
        badgeBg: "#D4EDDA",
        badgeText: Colors.success,
        badge: "APPROVED",
        title: "You're a Partner!",
        subtitle: "Your restaurant has been verified and approved.",
        bodyTitle: "You're all set",
        steps: [
            { icon: "checkmark-circle" as const, color: Colors.success, text: "Restaurant verified & approved" },
            { icon: "storefront" as const, color: Colors.success, text: "Your dashboard is now active" },
            { icon: "rocket" as const, color: Colors.primary, text: "Start managing your menu & orders" },
        ],
        accentColor: Colors.success,
    },
    REJECTED: {
        icon: "close-circle" as const,
        iconBg: "#FEE2E2",
        iconColor: Colors.danger,
        badgeBg: "#FECACA",
        badgeText: Colors.danger,
        badge: "REJECTED",
        title: "Application Rejected",
        subtitle: "Your application could not be approved at this time.",
        bodyTitle: "Reason for rejection",
        steps: [],
        accentColor: Colors.danger,
    },
} as const;

export const ApplicationStatusScreen = ({ application, isLoading }: Props) => {
    const insets = useSafeAreaInsets();
    const { setAppliedForPartner } = usePartnerStore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, scaleAnim, slideAnim]);

    const status = application?.status ?? "PENDING";
    const cfg = STATUS_CONFIG[status];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.loadingDot} />
                </Animated.View>
                <Text style={styles.loadingText}>Fetching application…</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Application Status</Text>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        authClient.signOut();
                        setAppliedForPartner(false);
                    }}
                    activeOpacity={0.75}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.muted} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero card */}
                <Animated.View
                    style={[
                        styles.heroCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                            borderColor: cfg.accentColor + "33",
                        },
                    ]}
                >
                    {/* Icon */}
                    <View style={[styles.iconRing, { backgroundColor: cfg.iconBg }]}>
                        <Ionicons name={cfg.icon} size={48} color={cfg.iconColor} />
                    </View>

                    {/* Badge */}
                    <View style={[styles.badge, { backgroundColor: cfg.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: cfg.badgeText }]}>{cfg.badge}</Text>
                    </View>

                    <Text style={styles.heroTitle}>{cfg.title}</Text>
                    <Text style={styles.heroSubtitle}>{cfg.subtitle}</Text>

                    {/* Restaurant name */}
                    {application?.restaurantName && (
                        <View style={styles.restaurantPill}>
                            <Ionicons name="storefront-outline" size={14} color={Colors.primary} />
                            <Text style={styles.restaurantPillText}>{application.restaurantName}</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Rejection reason */}
                {status === "REJECTED" && application?.rejectionReason && (
                    <Animated.View style={[styles.rejectionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.rejectionHeader}>
                            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                            <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
                        </View>
                        <Text style={styles.rejectionText}>{application.rejectionReason}</Text>

                        <View style={styles.divider} />
                        <Text style={styles.rejectionHint}>
                            You can resubmit a new application after addressing the above concerns.
                        </Text>
                    </Animated.View>
                )}

                {/* Steps / timeline */}
                {cfg.steps.length > 0 && (
                    <Animated.View style={[styles.stepsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.stepsTitle}>{cfg.bodyTitle}</Text>
                        {cfg.steps.map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                                <View style={[styles.stepIconWrap, { backgroundColor: step.color + "18" }]}>
                                    <Ionicons name={step.icon} size={18} color={step.color} />
                                </View>
                                {i < cfg.steps.length - 1 && <View style={styles.stepConnector} />}
                                <Text style={styles.stepText}>{step.text}</Text>
                            </View>
                        ))}
                    </Animated.View>
                )}

                {/* APPROVED — Go to Dashboard */}
                {status === "APPROVED" && (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <TouchableOpacity
                            style={styles.dashboardBtn}
                            activeOpacity={0.85}
                            onPress={() => {
                                setAppliedForPartner(false);
                                router.replace("/");
                            }}
                        >
                            <Ionicons name="storefront" size={20} color={Colors.white} />
                            <Text style={styles.dashboardBtnText}>Open My Dashboard</Text>
                            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Application details */}
                {application && (
                    <Animated.View style={[styles.detailsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.stepsTitle}>Application Details</Text>
                        <DetailRow icon="location-outline" label="Address" value={application.address} />
                        <DetailRow icon="restaurant-outline" label="Cuisine" value={application.cuisineTypes?.join(", ")} />
                        <DetailRow icon="cash-outline" label="Cost for Two" value={`₹${application.costForTwo}`} />
                        <DetailRow icon="calendar-outline" label="Submitted" value={new Date(application.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
};

const DetailRow = ({ icon, label, value }: { icon: any; label: string; value?: string }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailIconWrap}>
            <Ionicons name={icon} size={16} color={Colors.primary} />
        </View>
        <View style={styles.detailText}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value ?? "—"}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + "22",
    },
    loadingText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    logoutBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    scroll: {
        padding: 20,
        gap: 16,
    },
    heroCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        borderWidth: 1.5,
        gap: 12,
    },
    iconRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontFamily: Fonts.brandBold,
        fontSize: 11,
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xl,
        color: Colors.text,
        textAlign: "center",
    },
    heroSubtitle: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.muted,
        textAlign: "center",
        lineHeight: 20,
    },
    restaurantPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    restaurantPillText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    rejectionCard: {
        backgroundColor: "#FFF5F5",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.danger + "33",
        gap: 10,
    },
    rejectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    rejectionTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.danger,
    },
    rejectionText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.text,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.danger + "22",
    },
    rejectionHint: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.muted,
        lineHeight: 18,
    },
    stepsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 14,
    },
    stepsTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        marginBottom: 4,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    stepIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    stepConnector: {
        display: "none", // purely layout placeholder — connector is implicit via gap
    },
    stepText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    detailsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 14,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    detailIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    detailText: {
        flex: 1,
        gap: 2,
    },
    detailLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.muted,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    dashboardBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    dashboardBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
        flex: 1,
        textAlign: "center",
    },
});
