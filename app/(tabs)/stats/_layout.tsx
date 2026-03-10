import { Colors } from "@/constants/colors";
import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack screenOptions={{
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: Colors.primary },
            headerTitleStyle: { color: Colors.white },
            headerTintColor: Colors.white,
        }}>
            <Stack.Screen name="index" options={{ title: "Analytics" }} />
        </Stack>
    );
}
