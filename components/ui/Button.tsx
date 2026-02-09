import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import clsx from "clsx";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: "primary" | "secondary" | "outline";
    loading?: boolean;
    textClassName?: string;
}

export function Button({ title, variant = "primary", loading, className, textClassName, ...props }: ButtonProps) {
    if (variant === "primary") {
        return (
            <TouchableOpacity activeOpacity={0.8} {...props}>
                <LinearGradient
                    colors={["#2563eb", "#3b82f6"]} // Blue-600 to Blue-500
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className={clsx("rounded-xl p-4 items-center justify-center", className)}
                    style={{ borderRadius: 12 }} // Ensure rounding works on all platforms
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className={clsx("text-white font-semibold text-lg", textClassName)}>{title}</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            className={clsx(
                "rounded-xl p-4 items-center justify-center border",
                variant === "secondary" ? "bg-zinc-800 border-zinc-700" : "bg-transparent border-zinc-700",
                className
            )}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={clsx("text-white font-semibold text-lg", textClassName)}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
