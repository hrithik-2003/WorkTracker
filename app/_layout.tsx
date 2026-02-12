import "../global.css";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const customDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: "#09090b", // zinc-950
        card: "#09090b",
    },
};

function ProtectedLayout() {
    const { session, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "login";

        if (!session && !inAuthGroup) {
            // Redirect to the login page if not authenticated
            router.replace("/login");
        } else if (session && inAuthGroup) {
            // Redirect to the home page if authenticated
            router.replace("/(tabs)");
        }
    }, [session, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#09090b" }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#09090b" },
                animation: "fade",
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider value={customDarkTheme}>
            <AuthProvider>
                <ProtectedLayout />
            </AuthProvider>
        </ThemeProvider>
    );
}
