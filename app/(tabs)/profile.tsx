import { View, Text, Image } from "react-native";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Profile() {
    return (
        <ScreenLayout>
            <View className="items-center mt-8 mb-8">
                <View className="w-24 h-24 bg-zinc-800 rounded-full items-center justify-center mb-4 border-2 border-zinc-700">
                    <Text className="text-white text-2xl font-bold">H</Text>
                </View>
                <Text className="text-white text-xl font-bold">Hrithik</Text>
                <Text className="text-zinc-500">Free Tier</Text>
            </View>

            <Card className="mb-6">
                <Text className="text-white font-semibold mb-4">Settings</Text>
                <Button title="Edit Profile" variant="secondary" className="mb-3" />
                <Button title="Theme Preferences" variant="secondary" className="mb-3" />
                <Button title="Logout" variant="outline" className="border-red-900/50" />
            </Card>
        </ScreenLayout>
    );
}
