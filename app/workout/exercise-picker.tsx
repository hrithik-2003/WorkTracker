import { View, Text, SectionList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { router, Stack } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { useWorkoutStore } from "@/lib/store";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Search, Filter, SortAsc } from "lucide-react-native";
import { getExercises } from "@/lib/api/workouts";
import { Exercise, MuscleGroup, ExerciseCategory } from "@/lib/types";

type SortType = "name" | "muscle" | "category";

const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];
const CATEGORIES: ExerciseCategory[] = ["Barbell", "Dumbbell", "Machine", "Weighted Bodyweight", "Assisted Bodyweight", "Cardio"];

export default function ExercisePicker() {
    const [search, setSearch] = useState("");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortType>("name");
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | null>(null);
    const [filterCategory, setFilterCategory] = useState<ExerciseCategory | null>(null);

    const addExercise = useWorkoutStore((state) => state.addExercise);

    useEffect(() => {
        const fetchExercises = async () => {
            const res = await getExercises();
            if (res.success && res.data) {
                // Map database fields to our Exercise type
                const mapped: Exercise[] = res.data.map((ex: any) => ({
                    id: ex.id,
                    name: ex.name,
                    muscleGroup: ex.muscle_group || "Other",
                    category: ex.category || "Other",
                }));
                setExercises(mapped);
            } else {
                console.error("Failed to fetch exercises:", res.error);
            }
            setLoading(false);
        };
        fetchExercises();
    }, []);

    const groupedExercises = useMemo(() => {
        let filtered = exercises.filter((ex) =>
            ex.name.toLowerCase().includes(search.toLowerCase())
        );

        if (filterMuscle) {
            filtered = filtered.filter(ex => ex.muscleGroup === filterMuscle);
        }

        if (filterCategory) {
            filtered = filtered.filter(ex => ex.category === filterCategory);
        }

        if (sortBy === "name") {
            const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
            return [{ title: "All Exercises", data: sorted }];
        }

        if (sortBy === "muscle") {
            const groups: { [key: string]: Exercise[] } = {};
            filtered.forEach(ex => {
                const group = ex.muscleGroup;
                if (!groups[group]) groups[group] = [];
                groups[group].push(ex);
            });

            return Object.keys(groups).sort().map(key => ({
                title: key,
                data: groups[key].sort((a, b) => a.name.localeCompare(b.name)) // Sort by name within group
            }));
        }

        if (sortBy === "category") {
            const groups: { [key: string]: Exercise[] } = {};
            filtered.forEach(ex => {
                const group = ex.category;
                if (!groups[group]) groups[group] = [];
                groups[group].push(ex);
            });

            return Object.keys(groups).sort().map(key => ({
                title: key,
                data: groups[key].sort((a, b) => a.name.localeCompare(b.name))
            }));
        }

        return [];
    }, [exercises, search, sortBy, filterMuscle, filterCategory]);

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

            {/* Sort Options */}
            <View className="mb-3">
                <Text className="text-zinc-500 text-xs mb-2">Group By</Text>
                <View className="flex-row gap-2">
                    {(["name", "muscle", "category"] as SortType[]).map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setSortBy(type)}
                            className={`px-3 py-1.5 rounded-full border ${sortBy === type ? "bg-zinc-800 border-zinc-700" : "border-zinc-800 bg-transparent"}`}
                        >
                            <Text className={`text-xs capitalize ${sortBy === type ? "text-white" : "text-zinc-500"}`}>
                                {type === "name" ? "Alphabetical" : type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Filters */}
            <View className="mb-4">
                <Text className="text-zinc-500 text-xs mb-2">Filters</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                    <TouchableOpacity
                        onPress={() => setFilterMuscle(null)}
                        className={`px-3 py-1.5 rounded-full border ${!filterMuscle ? "bg-zinc-800 border-zinc-700" : "border-zinc-800"}`}
                    >
                        <Text className={`text-xs ${!filterMuscle ? "text-white" : "text-zinc-500"}`}>All Muscles</Text>
                    </TouchableOpacity>
                    {MUSCLE_GROUPS.map((m) => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => setFilterMuscle(m === filterMuscle ? null : m)}
                            className={`px-3 py-1.5 rounded-full border ${filterMuscle === m ? "bg-blue-900/40 border-blue-800" : "border-zinc-800"}`}
                        >
                            <Text className={`text-xs ${filterMuscle === m ? "text-blue-400" : "text-zinc-500"}`}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => setFilterCategory(null)}
                        className={`px-3 py-1.5 rounded-full border ${!filterCategory ? "bg-zinc-800 border-zinc-700" : "border-zinc-800"}`}
                    >
                        <Text className={`text-xs ${!filterCategory ? "text-white" : "text-zinc-500"}`}>All Equipment</Text>
                    </TouchableOpacity>
                    {CATEGORIES.map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => setFilterCategory(c === filterCategory ? null : c)}
                            className={`px-3 py-1.5 rounded-full border ${filterCategory === c ? "bg-blue-900/40 border-blue-800" : "border-zinc-800"}`}
                        >
                            <Text className={`text-xs ${filterCategory === c ? "text-blue-400" : "text-zinc-500"}`}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <SectionList
                sections={groupedExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950"
                        onPress={() => handleSelect(item)}
                    >
                        <View>
                            <Text className="text-white font-semibold text-lg">{item.name}</Text>
                            <Text className="text-zinc-500 text-sm">{item.muscleGroup} • {item.category}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                renderSectionHeader={({ section: { title } }) => (
                    sortBy !== "name" ? (
                        <View className="bg-zinc-900/90 py-2 px-4 border-b border-zinc-800">
                            <Text className="text-blue-400 font-bold text-sm tracking-wider uppercase">{title}</Text>
                        </View>
                    ) : null
                )}
                stickySectionHeadersEnabled={true}
                ListEmptyComponent={
                    <View className="items-center py-8">
                        <Text className="text-zinc-500">No exercises found</Text>
                    </View>
                }
            />
        </ScreenLayout>
    );
}
