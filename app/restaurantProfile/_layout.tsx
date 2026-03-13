import { Stack } from "expo-router";

export default function RestaurantProfileLayout() {
  return (
    <Stack screenOptions={{
            headerTitleAlign: "center",
            headerShown: false
        }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
