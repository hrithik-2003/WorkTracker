import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getWorkoutDetails, getAllWorkoutIds, WorkoutRecord } from "@/lib/api/workouts";
import { Dumbbell, Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";

export default function WorkoutDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [workout, setWorkout] = useState<WorkoutRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [allWorkoutIds, setAllWorkoutIds] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);

            const [workoutData, ids] = await Promise.all([
                getWorkoutDetails(id),
                getAllWorkoutIds()
            ]);

            setWorkout(workoutData);
            setAllWorkoutIds(ids);
            setCurrentIndex(ids.indexOf(id));
            setLoading(false);
        };
        fetchData();
    }, [id]);

    const formatWeekday = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allWorkoutIds.length - 1 && currentIndex >= 0;

    const goToPrev = () => {
        if (hasPrev) {
            router.replace(`/history/${allWorkoutIds[currentIndex - 1]}`);
        }
    };

    const goToNext = () => {
        if (hasNext) {
            router.replace(`/history/${allWorkoutIds[currentIndex + 1]}`);
        }
    };

    if (loading) {
        return (
            <ScreenLayout className="justify-center items-center">
                <Stack.Screen options={{ title: "Workout Details", headerStyle: { backgroundColor: "#09090b" }, headerTintColor: "#fff" }} />
                <ActivityIndicator size="large" color="#3b82f6" />
            </ScreenLayout>
        );
    }

    if (!workout) {
        return (
            <ScreenLayout className="justify-center items-center p-4">
                <Stack.Screen options={{ title: "Workout Not Found", headerStyle: { backgroundColor: "#09090b" }, headerTintColor: "#fff" }} />
                <Text className="text-white text-lg mb-4">Workout not found</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout>
            <Stack.Screen options={{ title: workout.name, headerStyle: { backgroundColor: "#09090b" }, headerTintColor: "#fff" }} />

            {/* Navigation Arrows */}
            <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                    onPress={goToPrev}
                    disabled={!hasPrev}
                    className="p-2"
                >
                    <ChevronLeft size={28} color={hasPrev ? "#fff" : "#3f3f46"} />
                </TouchableOpacity>
                <Text className="text-zinc-400 text-sm">
                    {currentIndex >= 0 ? `${currentIndex + 1} of ${allWorkoutIds.length}` : ""}
                </Text>
                <TouchableOpacity
                    onPress={goToNext}
                    disabled={!hasNext}
                    className="p-2"
                >
                    <ChevronRight size={28} color={hasNext ? "#fff" : "#3f3f46"} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Header Stats */}
                <View className="flex-row gap-4 mb-6">
                    <Card className="flex-1 flex-row items-center py-4 gap-3">
                        <Calendar size={24} color="#a1a1aa" />
                        <View>
                            <Text className="text-white font-bold text-base">{formatWeekday(workout.started_at)}</Text>
                            <Text className="text-zinc-400 text-sm">{formatDateShort(workout.started_at)}</Text>
                        </View>
                    </Card>
                    <Card className="flex-1 flex-row items-center py-4 gap-3">
                        <Dumbbell size={24} color="#a1a1aa" />
                        <View>
                            <Text className="text-white font-bold text-base">{workout.workout_exercises?.length || 0}</Text>
                            <Text className="text-zinc-400 text-sm">{(workout.workout_exercises?.length || 0) === 1 ? "Exercise" : "Exercises"}</Text>
                        </View>
                    </Card>
                </View>

                {/* Notes */}
                {workout.notes && (
                    <Card className="mb-6">
                        <Text className="text-zinc-500 text-xs font-bold mb-2 uppercase">Notes</Text>
                        <Text className="text-white text-base leading-6">{workout.notes}</Text>
                    </Card>
                )}

                {/* Exercises List */}
                <Text className="text-white text-lg font-bold mb-4">Exercises</Text>
                {workout.workout_exercises?.map((exercise) => (
                    <Card key={exercise.id} className="mb-4">
                        <Text className="text-white text-lg font-semibold mb-3">{exercise.exercise_name}</Text>

                        {/* Table Header */}
                        <View className="flex-row border-b border-zinc-800 pb-2 mb-2">
                            <Text className="text-zinc-500 text-xs w-10 text-center">SET</Text>
                            <Text className="text-zinc-500 text-xs flex-1 text-center">KG</Text>
                            <Text className="text-zinc-500 text-xs flex-1 text-center">REPS</Text>
                        </View>

                        {/* Sets */}
                        {exercise.sets?.map((set, index) => (
                            <View key={set.id} className="flex-row py-2 border-b border-zinc-800/50 last:border-0">
                                <View className="w-10 items-center justify-center bg-zinc-800 rounded h-6">
                                    <Text className="text-zinc-400 text-xs font-bold">{index + 1}</Text>
                                </View>
                                <Text className="text-white text-base flex-1 text-center font-medium">{set.weight}</Text>
                                <Text className="text-white text-base flex-1 text-center font-medium">{set.reps}</Text>
                            </View>
                        ))}
                    </Card>
                ))}
            </ScrollView>
        </ScreenLayout>
    );
}
