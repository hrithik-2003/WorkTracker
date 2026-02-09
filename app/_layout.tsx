import "../global.css";
import { Stack } from "expo-router";
import { View } from "react-native";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";

const customDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: "#09090b", // zinc-950
        card: "#09090b",
    },
};

export default function RootLayout() {
    return (
        <ThemeProvider value={customDarkTheme}>
            <View style={{ flex: 1, backgroundColor: "#09090b" }}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "#09090b" },
                        animation: "fade",
                    }}
                >
                    <Stack.Screen name="index" />
                </Stack>
            </View>
        </ThemeProvider>
    );
}
