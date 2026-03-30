import { Colors } from "@/constants/colors";
import { Stack } from "expo-router";

export default function StatsLayout() {
    return (
        <Stack screenOptions={{
           headerShown: false
        }}>
            <Stack.Screen name="index" options={{ title: "Analytics" }} />
        </Stack>
    );
}
