import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";

export function ScreenLayout({ children, className, ...props }: ViewProps) {
    return (
        <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'left', 'right']}>
            <View className={clsx("flex-1 px-4", className)} {...props}>
                {children}
            </View>
        </SafeAreaView>
    );
}
