import { Colors } from "@/constants/colors";
import { Stack } from "expo-router";

export default function OrderLayout() {
    return (
       <Stack screenOptions={{
           headerShown: false
        }}>
            <Stack.Screen name="index" options={{ title: "Orders"}} />
            <Stack.Screen
                name="[id]"
                options={{ title: "Order Details", headerBackTitle: "Orders",headerTintColor: '#fff', }}
            />
        </Stack>
    );
}