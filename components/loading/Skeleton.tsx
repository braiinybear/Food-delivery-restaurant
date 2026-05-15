import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function Skeleton({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const { Colors } = useTheme();
  return <View style={[styles.skeleton, { backgroundColor: Colors.border }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 8,
  },
});