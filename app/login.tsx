import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signInWithGoogle } = useAuth();

    const handleAuth = async () => {
        setLoading(true);
        const trimmedEmail = email.trim(); // Trim whitespace
        try {
            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password,
                });
                if (error) throw error;
                // Success is handled by AuthContext listening to state change
            } else {
                const { error } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password,
                });
                if (error) throw error;
                Alert.alert("Check your inbox", "Account created! Please confirm your email before signing in.");
                setMode("signin"); // Switch back to signin after creating account
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Google Sign-In failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenLayout className="justify-center">
            <View className="mb-8">
                <Text className="text-white text-3xl font-bold mb-2">
                    {mode === "signin" ? "Welcome Back" : "Create Account"}
                </Text>
                <Text className="text-zinc-400">
                    {mode === "signin"
                        ? "Sign in to access your workouts"
                        : "Start your fitness journey today"}
                </Text>
            </View>

            <View className="space-y-4 mb-6">
                <View>
                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-1 ml-1">Email</Text>
                    <TextInput
                        className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl"
                        placeholder="you@example.com"
                        placeholderTextColor="#52525b"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View>
                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-1 ml-1">Password</Text>
                    <TextInput
                        className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl"
                        placeholder="••••••••"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
            </View>

            <Button
                title={loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
                onPress={handleAuth}
                disabled={loading}
                className="mb-4"
            />

            <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-zinc-800" />
                <Text className="text-zinc-500 mx-4">OR</Text>
                <View className="flex-1 h-[1px] bg-zinc-800" />
            </View>

            <Button
                title="Continue with Google"
                variant="outline"
                onPress={handleGoogleSignIn}
                disabled={loading}
                className="mb-8 bg-zinc-900"
            // icon={<GoogleIcon />} // You could add a google icon here
            />

            <View className="flex-row justify-center">
                <Text className="text-zinc-400">
                    {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
                    <Text className="text-blue-500 font-bold">
                        {mode === "signin" ? "Sign Up" : "Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );
}
