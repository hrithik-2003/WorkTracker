import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { useWorkoutStore } from "@/lib/store";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Search } from "lucide-react-native";
import { getExercises } from "@/lib/api/workouts";
import { Exercise } from "@/lib/types";

export default function ExercisePicker() {
    const [search, setSearch] = useState("");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const addExercise = useWorkoutStore((state) => state.addExercise);

    useEffect(() => {
        const fetchExercises = async () => {
            const data = await getExercises();
            // Map database fields to our Exercise type
            const mapped: Exercise[] = data.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscle_group || "Other",
                category: ex.category || "Other",
            }));
            setExercises(mapped);
            setLoading(false);
        };
        fetchExercises();
    }, []);

    const filteredExercises = exercises.filter((ex) =>
        ex.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (exercise: Exercise) => {
        addExercise(exercise);
        router.back();
    };

    if (loading) {
        return (
            <ScreenLayout className="justify-center items-center">
                <Stack.Screen options={{ title: "Add Exercise", presentation: "modal", headerStyle: { backgroundColor: "#09090b" }, headerTintColor: "#fff" }} />
                <ActivityIndicator size="large" color="#3b82f6" />
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout>
            <Stack.Screen options={{ title: "Add Exercise", presentation: "modal", headerStyle: { backgroundColor: "#09090b" }, headerTintColor: "#fff" }} />

            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-3 mb-4 border border-zinc-800">
                <Search size={20} color="#71717a" />
                <TextInput
                    placeholder="Search exercises..."
                    placeholderTextColor="#71717a"
                    className="flex-1 ml-3 text-white text-base"
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                />
            </View>

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 border-b border-zinc-900"
                        onPress={() => handleSelect(item)}
                    >
                        <View>
                            <Text className="text-white font-semibold text-lg">{item.name}</Text>
                            <Text className="text-zinc-500">{item.muscleGroup} • {item.category}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center py-8">
                        <Text className="text-zinc-500">No exercises found</Text>
                    </View>
                }
            />
        </ScreenLayout>
    );
}
