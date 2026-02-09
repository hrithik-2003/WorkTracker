import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, router } from "expo-router";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Card } from "@/components/ui/Card";
import { getWorkoutHistory, WorkoutRecord } from "@/lib/api/workouts";
import { Dumbbell, Clock } from "lucide-react-native";

export default function History() {
    const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = useCallback(async () => {
        const data = await getWorkoutHistory();
        setWorkouts(data);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory();
    }, [fetchHistory]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return "—";
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    if (loading) {
        return (
            <ScreenLayout className="justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout>
            <Text className="text-white text-2xl font-bold mb-6 mt-4">History</Text>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {workouts.length === 0 ? (
                    <Card className="items-center py-8">
                        <Dumbbell size={40} color="#52525b" />
                        <Text className="text-zinc-500 mt-4">No workouts yet</Text>
                        <Text className="text-zinc-600 text-sm">Complete a workout to see it here</Text>
                    </Card>
                ) : (
                    workouts.map((workout) => (
                        <TouchableOpacity
                            key={workout.id}
                            onPress={() => router.push(`/history/${workout.id}`)}
                            activeOpacity={0.7}
                        >
                            <Card className="mb-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white text-lg font-bold">{workout.name}</Text>
                                    <Text className="text-zinc-500 text-sm">{formatDate(workout.started_at)}</Text>
                                </View>
                                <View className="flex-row gap-4 mb-2">
                                    <View className="flex-row items-center">
                                        <Dumbbell size={14} color="#71717a" />
                                        <Text className="text-zinc-400 text-sm ml-1">
                                            {workout.workout_exercises?.length || 0} exercises
                                        </Text>
                                    </View>
                                </View>
                                {/* Exercise summary */}
                                <View className="mt-2 pt-2 border-t border-zinc-800">
                                    {workout.workout_exercises?.slice(0, 3).map((ex) => (
                                        <Text key={ex.id} className="text-zinc-500 text-sm">
                                            • {ex.exercise_name} ({ex.sets?.length || 0} sets)
                                        </Text>
                                    ))}
                                    {workout.workout_exercises?.length > 3 && (
                                        <Text className="text-zinc-600 text-sm">
                                            +{workout.workout_exercises.length - 3} more
                                        </Text>
                                    )}
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </ScreenLayout>
    );
}
