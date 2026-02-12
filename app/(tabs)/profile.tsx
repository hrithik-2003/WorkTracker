import { View, Text, Image } from "react-native";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
    const { user, signOut } = useAuth();

    // Get first letter of email for avatar if no name
    const initial = user?.email?.charAt(0).toUpperCase() || "U";

    return (
        <ScreenLayout>
            <View className="items-center mt-8 mb-8">
                <View className="w-24 h-24 bg-zinc-800 rounded-full items-center justify-center mb-4 border-2 border-zinc-700">
                    <Text className="text-white text-3xl font-bold">{initial}</Text>
                </View>
                <Text className="text-white text-xl font-bold mb-1">{user?.email}</Text>
                <Text className="text-zinc-500 text-sm">Member since {new Date(user?.created_at || "").toLocaleDateString()}</Text>
            </View>

            <Card className="mb-6">
                <Text className="text-white font-semibold mb-4">Account</Text>
                <Button title="Edit Profile" variant="secondary" className="mb-3" />
                <Button title="Theme Preferences" variant="secondary" className="mb-3" />
                <Button
                    title="Sign Out"
                    variant="outline"
                    className="border-red-900/50 mt-2"
                    textClassName="text-red-400"
                    onPress={signOut}
                />
            </Card>
        </ScreenLayout>
    );
}
