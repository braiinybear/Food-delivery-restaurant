import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { authClient } from "@/lib/auth-client";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface SettingRow {
    icon: IoniconName;
    label: string;
    sublabel?: string;
    type: "nav" | "toggle" | "danger";
    value?: boolean;
    onToggle?: (v: boolean) => void;
    onPress?: () => void;
    iconBg?: string;
}

interface SettingGroup {
    title: string;
    rows: SettingRow[];
}

export default function SettingsScreen() {
    const [notifOrders, setNotifOrders] = useState(true);
    const [notifMarketing, setNotifMarketing] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoAccept, setAutoAccept] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setSigningOut(true);
                            await authClient.signOut();
                            router.replace("/login");
                        } catch (err) {
                            Alert.alert("Error", "Failed to sign out. Please try again.");
                        } finally {
                            setSigningOut(false);
                        }
                    },
                },
            ]
        );
    };

    const SETTINGS: SettingGroup[] = [
        {
            title: "Restaurant",
            rows: [
                {
                    icon: "storefront-outline",
                    label: "Restaurant Profile",
                    sublabel: "Name, address, cuisine",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Restaurant Profile"),
                },
                {
                    icon: "time-outline",
                    label: "Opening Hours",
                    sublabel: "Mon–Sun schedule",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Opening Hours"),
                },
                {
                    icon: "bicycle-outline",
                    label: "Delivery Zones",
                    sublabel: "Radius & fee configuration",
                    type: "nav",
                    iconBg: Colors.success + "22",
                    onPress: () => Alert.alert("Delivery Zones"),
                },
                {
                    icon: "flash-outline",
                    label: "Auto-Accept Orders",
                    sublabel: "Skip manual confirmation",
                    type: "toggle",
                    iconBg: Colors.warning + "22",
                    value: autoAccept,
                    onToggle: setAutoAccept,
                },
            ],
        },
        {
            title: "Notifications",
            rows: [
                {
                    icon: "notifications-outline",
                    label: "Order Alerts",
                    sublabel: "New, cancelled, delayed",
                    type: "toggle",
                    iconBg: Colors.primary + "22",
                    value: notifOrders,
                    onToggle: setNotifOrders,
                },
                {
                    icon: "volume-high-outline",
                    label: "Sound & Vibration",
                    sublabel: "Alert sounds for orders",
                    type: "toggle",
                    iconBg: Colors.primary + "22",
                    value: soundEnabled,
                    onToggle: setSoundEnabled,
                },
                {
                    icon: "megaphone-outline",
                    label: "Marketing Emails",
                    sublabel: "Promotions & tips",
                    type: "toggle",
                    iconBg: Colors.muted + "22",
                    value: notifMarketing,
                    onToggle: setNotifMarketing,
                },
            ],
        },
        {
            title: "Appearance",
            rows: [
                {
                    icon: "moon-outline",
                    label: "Dark Mode",
                    sublabel: "Currently disabled",
                    type: "toggle",
                    iconBg: Colors.light,
                    value: darkMode,
                    onToggle: setDarkMode,
                },
                {
                    icon: "color-palette-outline",
                    label: "Theme Color",
                    sublabel: "Amber (default)",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Theme Color"),
                },
            ],
        },
        {
            title: "Account & Security",
            rows: [
                {
                    icon: "person-outline",
                    label: "Account Details",
                    sublabel: "Email, phone, password",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Account Details"),
                },
                {
                    icon: "card-outline",
                    label: "Payment Info",
                    sublabel: "Bank & payout settings",
                    type: "nav",
                    iconBg: Colors.success + "22",
                    onPress: () => Alert.alert("Payment Info"),
                },
                {
                    icon: "shield-checkmark-outline",
                    label: "Privacy & Security",
                    sublabel: "2FA, data, permissions",
                    type: "nav",
                    iconBg: Colors.warning + "22",
                    onPress: () => Alert.alert("Privacy"),
                },
            ],
        },
        {
            title: "Support",
            rows: [
                {
                    icon: "help-circle-outline",
                    label: "Help Center",
                    sublabel: "FAQs & documentation",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Help"),
                },
                {
                    icon: "chatbubbles-outline",
                    label: "Contact Support",
                    sublabel: "Chat or call us",
                    type: "nav",
                    iconBg: Colors.primary + "22",
                    onPress: () => Alert.alert("Support"),
                },
                {
                    icon: "information-circle-outline",
                    label: "App Version",
                    sublabel: "v1.4.2 (latest)",
                    type: "nav",
                    iconBg: Colors.light,
                    onPress: () => {},
                },
            ],
        },
        {
            title: "Danger Zone",
            rows: [
                {
                    icon: "log-out-outline" as IoniconName,
                    label: signingOut ? "Signing out..." : "Sign Out",
                    type: "danger",
                    iconBg: Colors.danger + "18",
                    onPress: handleSignOut,
                },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                    <Ionicons name="storefront" size={32} color={Colors.primary} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>The Golden Grill</Text>
                    <Text style={styles.profileEmail}>manager@goldengrill.com</Text>
                    <View style={styles.profileBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                        <Text style={styles.profileBadgeText}>Verified Restaurant</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {SETTINGS.map((group) => (
                    <View key={group.title} style={styles.group}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupCard}>
                            {group.rows.map((row, i) => (
                                <TouchableOpacity
                                    key={row.label}
                                    style={[
                                        styles.row,
                                        i < group.rows.length - 1 && styles.rowBorder,
                                    ]}
                                    onPress={row.type !== "toggle" ? row.onPress : undefined}
                                    activeOpacity={row.type === "toggle" ? 1 : 0.7}
                                >
                                    <View
                                        style={[styles.rowIcon, { backgroundColor: row.iconBg }]}
                                    >
                                        <Ionicons
                                            name={row.icon}
                                            size={18}
                                            color={
                                                row.type === "danger" ? Colors.danger : Colors.textSecondary
                                            }
                                        />
                                    </View>
                                    <View style={styles.rowText}>
                                        <Text
                                            style={[
                                                styles.rowLabel,
                                                row.type === "danger" && { color: Colors.danger },
                                            ]}
                                        >
                                            {row.label}
                                        </Text>
                                        {row.sublabel ? (
                                            <Text style={styles.rowSublabel}>{row.sublabel}</Text>
                                        ) : null}
                                    </View>
                                    {row.type === "toggle" ? (
                                        <Switch
                                            value={row.value}
                                            onValueChange={row.onToggle}
                                            trackColor={{
                                                false: Colors.light,
                                                true: Colors.primary + "88",
                                            }}
                                            thumbColor={row.value ? Colors.primary : Colors.muted}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={
                                                row.type === "danger" ? Colors.danger : Colors.border
                                            }
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 16,
    },
    headerTitle: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xxl,
        color: Colors.text,
    },
    versionBadge: {
        backgroundColor: Colors.surface,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    versionText: {
        fontFamily: Fonts.brand,
        fontSize: 11,
        color: Colors.muted,
    },
    profileCard: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.primary + "33",
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.primary + "55",
    },
    profileInfo: { flex: 1 },
    profileName: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    profileEmail: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
    },
    profileBadgeText: {
        fontFamily: Fonts.brandMedium,
        fontSize: 11,
        color: Colors.success,
    },
    editBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    content: { paddingHorizontal: 16, paddingBottom: 24 },
    group: { marginBottom: 20 },
    groupTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: 11,
        color: Colors.muted,
        letterSpacing: 1.5,
        marginBottom: 10,
        paddingLeft: 4,
    },
    groupCard: {
        backgroundColor: Colors.surface,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 12,
        backgroundColor: Colors.white,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    rowText: { flex: 1 },
    rowLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    rowSublabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
    },
});
