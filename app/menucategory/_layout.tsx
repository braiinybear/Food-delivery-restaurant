import { Stack } from "expo-router";

export default function MenuCategoryLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" options={{headerShown:false}} />
        </Stack>
    );
}