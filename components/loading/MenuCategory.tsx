import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

export default function MenuCategorySkeleton() {
  return (
    <View style={styles.chip}>
      <Skeleton style={styles.image} />
      <View style={{ gap: 4 }}>
        <Skeleton style={styles.title} />
        <Skeleton style={styles.subtitle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  title: {
    width: 70,
    height: 12,
  },
  subtitle: {
    width: 50,
    height: 10,
  },
});