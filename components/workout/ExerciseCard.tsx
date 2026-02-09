import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MoreVertical, Check, Trash2 } from "lucide-react-native";
import { WorkoutExercise } from "@/lib/types";
import { useWorkoutStore } from "@/lib/store";

interface ExerciseCardProps {
    exercise: WorkoutExercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
    const removeExercise = useWorkoutStore((state) => state.removeExercise);
    const addSet = useWorkoutStore((state) => state.addSet);
    const removeSet = useWorkoutStore((state) => state.removeSet);
    const updateSet = useWorkoutStore((state) => state.updateSet);
    const toggleSetComplete = useWorkoutStore((state) => state.toggleSetComplete);

    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    // Filter to only allow numeric input (including decimals for weight)
    const filterNumeric = (text: string, allowDecimal: boolean = false) => {
        if (allowDecimal) {
            return text.replace(/[^0-9.]/g, '').replace(/(\.[^.]*)\..*/, '$1');
        }
        return text.replace(/[^0-9]/g, '');
    };

    const handleAddSet = () => {
        if (!weight || !reps) return; // Simple validation
        addSet(exercise.id, weight, reps);
        setReps("");
        // Keep weight populated for convenience? Or clear. User said "shows empty box", so clear.
    };

    return (
        <Card className="mb-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-bold">{exercise.exercise.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                    <MoreVertical size={20} color="#52525b" />
                </TouchableOpacity>
            </View>

            {/* Column Headers */}
            {exercise.sets.length > 0 && (
                <View className="flex-row mb-2 px-2 items-center">
                    <Text className="text-zinc-500 text-xs w-8 text-center">Set</Text>
                    <Text className="text-zinc-500 text-xs flex-1 text-center">kg</Text>
                    <Text className="text-zinc-500 text-xs flex-1 text-center">Reps</Text>
                    <View className="w-16 flex-row justify-end" />
                </View>
            )}

            {/* Existing Sets List */}
            {exercise.sets.map((set, index) => (
                <View
                    key={set.id}
                    className={`flex-row items-center mb-2 p-2 rounded-lg ${set.completed ? "bg-green-900/20" : "bg-zinc-950/50"
                        }`}
                >
                    <Text className={`w-8 text-center font-semibold text-sm ${set.completed ? "text-green-500" : "text-zinc-400"
                        }`}>
                        {index + 1}
                    </Text>

                    {/* Editable Weight */}
                    <TextInput
                        className={`flex-1 text-center font-semibold p-1 mx-1 rounded ${set.completed ? "text-green-100" : "text-white bg-zinc-900/50"
                            }`}
                        value={String(set.weight)}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { weight: filterNumeric(text, true) })}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor="#52525b"
                    />

                    {/* Editable Reps */}
                    <TextInput
                        className={`flex-1 text-center font-semibold p-1 mx-1 rounded ${set.completed ? "text-green-100" : "text-white bg-zinc-900/50"
                            }`}
                        value={String(set.reps)}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { reps: filterNumeric(text) })}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor="#52525b"
                    />

                    {/* Action Buttons */}
                    <View className="w-16 flex-row justify-end items-center gap-1">
                        {/* Toggle Complete */}
                        <TouchableOpacity
                            className={`w-7 h-7 items-center justify-center rounded ${set.completed ? "bg-green-500" : "bg-zinc-800"
                                }`}
                            onPress={() => toggleSetComplete(exercise.id, set.id)}
                        >
                            <Check size={14} color="white" />
                        </TouchableOpacity>

                        {/* Delete */}
                        <TouchableOpacity
                            className="w-7 h-7 items-center justify-center rounded bg-zinc-900"
                            onPress={() => removeSet(exercise.id, set.id)}
                        >
                            <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {/* Add New Set Row */}
            <View className="flex-row items-center mt-2 p-2 bg-zinc-800/50 rounded-lg">
                <Text className="text-zinc-500 w-8 text-center text-xs">New</Text>
                <TextInput
                    className="flex-1 bg-zinc-900 text-white text-center p-2 rounded mx-1"
                    keyboardType="numeric"
                    placeholder="kg"
                    placeholderTextColor="#52525b"
                    value={weight}
                    onChangeText={(text) => setWeight(filterNumeric(text, true))}
                />
                <TextInput
                    className="flex-1 bg-zinc-900 text-white text-center p-2 rounded mx-1"
                    keyboardType="numeric"
                    placeholder="Reps"
                    placeholderTextColor="#52525b"
                    value={reps}
                    onChangeText={(text) => setReps(filterNumeric(text))}
                    onSubmitEditing={handleAddSet}
                />
                <TouchableOpacity
                    className="w-16 h-8 bg-blue-600 items-center justify-center rounded ml-1"
                    onPress={handleAddSet}
                >
                    <Text className="text-white font-bold text-xs">+ ADD</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
}
