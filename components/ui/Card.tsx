import { View, ViewProps } from "react-native";
import clsx from "clsx";

export function Card({ children, className, ...props }: ViewProps) {
    return (
        <View
            className={clsx(
                "bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4",
                className
            )}
            {...props}
        >
            {children}
        </View>
    );
}
