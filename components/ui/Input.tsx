import { TextInput, TextInputProps, View, Text } from "react-native";
import clsx from "clsx";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
    return (
        <View className="mb-4">
            {label && <Text className="text-zinc-400 mb-1.5 ml-1">{label}</Text>}
            <TextInput
                placeholderTextColor="#71717a" // zinc-500
                className={clsx(
                    "bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white text-base",
                    "focus:border-blue-500",
                    error && "border-red-500",
                    className
                )}
                {...props}
            />
            {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
        </View>
    );
}
