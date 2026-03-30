import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

export default function Skeleton({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.skeleton, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
});