import { Stack } from "expo-router";

export default function RestaurantFormLayout() {
  return (
    <Stack screenOptions={{
            headerTitleAlign: "center",
            headerShown: false
        }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
