import { View, Text, TouchableOpacity, PanResponder, Animated, Vibration, Dimensions } from "react-native";
import { useWorkoutStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import { Plus, X } from "lucide-react-native";
import { Audio } from 'expo-av';

export function RestTimer() {
    const restTimer = useWorkoutStore((state) => state.restTimer);
    const stopRestTimer = useWorkoutStore((state) => state.stopRestTimer);
    const addRestTime = useWorkoutStore((state) => state.addRestTime);

    // Local state for smooth countdown
    const [timeLeft, setTimeLeft] = useState(0);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Draggable position
    // Initial position is 0,0 relative to the container. We can center it initially using layout.
    const pan = useRef(new Animated.ValueXY()).current;

    // Create PanResponder
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false, // Allow touches to pass through initially
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only claim responder if dragged more than 5 pixels
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                // When touch starts, setting offset allows us to continue fro where we left off
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset(); // Start from this new position next time
            }
        })
    ).current;

    async function playAlarm() {
        try {
            // Unload previous sound if exists
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                // Simple beep sound URL. Fallback to vibration if fails.
                { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
                { shouldPlay: true }
            );
            setSound(newSound);

            // Vibrate pattern: wait 0ms, vibrate 500ms, wait 200ms, vibrate 500ms
            Vibration.vibrate([0, 500, 200, 500]);
        } catch (error) {
            console.log("Error playing sound", error);
            Vibration.vibrate(500); // Fallback
        }
    }

    // Cleanup sound on unmount or when sound changes
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Timer Logic
    useEffect(() => {
        if (!restTimer.isRunning || !restTimer.endTime) {
            setTimeLeft(0);
            return;
        }

        const tick = () => {
            const now = Date.now();
            const remaining = Math.ceil((restTimer.endTime! - now) / 1000);

            if (remaining <= 0) {
                // Timer finished
                stopRestTimer();
                setTimeLeft(0);
                playAlarm();
            } else {
                setTimeLeft(remaining);
            }
        };

        // Initial tick
        tick();

        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [restTimer.endTime, restTimer.isRunning, stopRestTimer]);

    if (!restTimer.isRunning && timeLeft <= 0) {
        return null;
    }

    // Don't render anything if not running, except maybe we want to keep it visible while animating out? 
    // For now, simple return null is fine as per previous logic.

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                bottom: 100, // Starting Y position
                alignSelf: 'center', // Center horizontally initially
                zIndex: 9999, // Ensure it's on top
            }}
            {...panResponder.panHandlers}
        >
            {/* Wrap in a View that catches touches for the PanResponder, but maybe pass touches to children? */}
            {/* Actually, PanResponder on the parent View handles the drag. Buttons need to handle their own presses. */}
            {/* React Native PanResponder usually captures touches. We might need logic to distinguish tap vs drag. */}
            {/* However, for a simple floating bubble, dragging smoothly is key. Buttons might require precise taps or `onPanResponderTerminate`. */}
            {/* Let's try simple nesting first. */}

            <View className="bg-zinc-900 border border-zinc-700 flex-row items-center px-4 py-3 rounded-full shadow-lg shadow-black/50">
                {/* Time Display */}
                <View className="mr-4">
                    <Text className="text-zinc-400 text-[10px] text-center font-bold uppercase tracking-widest">Rest</Text>
                    <Text className="text-white text-xl font-bold font-mono min-w-[60px] text-center">{formattedTime}</Text>
                </View>

                {/* Vertical Divider */}
                <View className="h-8 w-[1px] bg-zinc-800 mr-2" />

                {/* Controls */}
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-full flex-row items-center active:bg-zinc-600"
                        onPress={() => addRestTime(30)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Plus size={16} color="#e4e4e7" />
                        <Text className="text-zinc-200 text-xs font-semibold ml-1">30s</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-zinc-800/50 p-2 rounded-full active:bg-red-900/40"
                        onPress={() => stopRestTimer()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={20} color="#71717a" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}
