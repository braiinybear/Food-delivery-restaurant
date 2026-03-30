import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

export default function MenuItemSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.strip} />
      <Skeleton style={styles.image} />

      <View style={styles.body}>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={styles.badge} />
          <Skeleton style={styles.title} />
          <Skeleton style={styles.desc} />
          <Skeleton style={styles.small} />
        </View>

        <View style={styles.right}>
          <Skeleton style={styles.price} />
          <Skeleton style={styles.button} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  strip: {
    width: 4,
  },
  image: {
    width: 80,
    height: 110,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
  },
  badge: {
    width: 60,
    height: 12,
  },
  title: {
    width: "70%",
    height: 14,
  },
  desc: {
    width: "90%",
    height: 10,
  },
  small: {
    width: 50,
    height: 10,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  price: {
    width: 50,
    height: 16,
  },
  button: {
    width: 70,
    height: 20,
  },
});