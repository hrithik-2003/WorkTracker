import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from "react-native";
import { useState, useEffect } from "react";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, X, Search, Dumbbell } from "lucide-react-native";
import { Exercise } from "@/lib/types";

export interface TemplateFormProps {
    initialName?: string;
    initialDescription?: string;
    initialExercises?: { id: string; name: string; sets: string }[];
    allExercises: Exercise[];
    onSave: (name: string, description: string, exercises: { id: string; sets: number }[]) => Promise<void>;
    isSaving: boolean;
    title: string;
}

export function TemplateForm({
    initialName = "",
    initialDescription = "",
    initialExercises = [],
    allExercises,
    onSave,
    isSaving,
    title
}: TemplateFormProps) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [addedExercises, setAddedExercises] = useState(initialExercises);
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setName(initialName);
        setDescription(initialDescription);
        setAddedExercises(initialExercises);
    }, [initialName, initialDescription, initialExercises]);

    const handleAddExercise = (exercise: Exercise) => {
        setAddedExercises([...addedExercises, { id: exercise.id, name: exercise.name, sets: "3" }]);
        setPickerVisible(false);
        setSearch("");
    };

    const handleRemoveExercise = (index: number) => {
        const newList = [...addedExercises];
        newList.splice(index, 1);
        setAddedExercises(newList);
    };

    const updateSets = (index: number, value: string) => {
        const newList = [...addedExercises];
        newList[index].sets = value;
        setAddedExercises(newList);
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Missing Info", "Please enter a routine name.");
            return;
        }
        if (addedExercises.length === 0) {
            Alert.alert("Empty Routine", "Please add at least one exercise.");
            return;
        }

        const exercisesPayload = addedExercises.map(ex => ({
            id: ex.id,
            sets: parseInt(ex.sets, 10) || 3
        }));

        onSave(name, description, exercisesPayload);
    };

    const filteredExercises = allExercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <ScreenLayout>
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <Text className="text-white text-2xl font-bold">{title}</Text>
                <Button
                    title={isSaving ? "Saving..." : "Save"}
                    onPress={handleSave}
                    disabled={isSaving}
                    className="px-6"
                />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Card className="mb-6">
                    <Text className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Routine Name</Text>
                    <TextInput
                        className="text-white text-lg border-b border-zinc-700 pb-2 mb-4"
                        placeholder="e.g. Leg Blaster"
                        placeholderTextColor="#52525b"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Description (Optional)</Text>
                    <TextInput
                        className="text-white text-base border-b border-zinc-700 pb-2"
                        placeholder="e.g. Focus on quads"
                        placeholderTextColor="#52525b"
                        value={description}
                        onChangeText={setDescription}
                    />
                </Card>

                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-lg font-bold">Exercises</Text>
                    <TouchableOpacity
                        className="flex-row items-center bg-blue-600 px-3 py-2 rounded-lg"
                        onPress={() => setPickerVisible(true)}
                    >
                        <Plus size={16} color="white" />
                        <Text className="text-white font-semibold ml-1">Add Exercise</Text>
                    </TouchableOpacity>
                </View>

                {addedExercises.length === 0 ? (
                    <View className="items-center py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                        <Dumbbell size={40} color="#3f3f46" />
                        <Text className="text-zinc-500 mt-4">No exercises added yet</Text>
                    </View>
                ) : (
                    addedExercises.map((ex, index) => (
                        <Card key={`${ex.id}-${index}`} className="mb-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-lg">{ex.name}</Text>
                                    <View className="flex-row items-center mt-2 bg-zinc-900 self-start px-2 py-1 rounded border border-zinc-800">
                                        <Text className="text-zinc-400 text-sm mr-2">Target Sets:</Text>
                                        <TextInput
                                            className="text-white font-bold text-center w-10 border-b border-zinc-600"
                                            value={ex.sets}
                                            onChangeText={(text) => updateSets(index, text)}
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveExercise(index)}
                                    className="p-2 bg-zinc-900 rounded-full"
                                >
                                    <X size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}

                <View className="h-20" />
            </ScrollView>

            <Modal
                visible={isPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPickerVisible(false)}
            >
                <View className="flex-1 bg-black/90">
                    <View className="flex-1 bg-zinc-950 mt-12 rounded-t-3xl border-t border-zinc-800">
                        <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
                            <Text className="text-white text-xl font-bold">Add Exercise</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <X size={24} color="#a1a1aa" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                                <Search size={20} color="#71717a" />
                                <TextInput
                                    placeholder="Search..."
                                    placeholderTextColor="#71717a"
                                    className="flex-1 ml-3 text-white text-base"
                                    value={search}
                                    onChangeText={setSearch}
                                    autoFocus
                                />
                            </View>
                        </View>

                        <FlatList
                            data={filteredExercises}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="flex-row items-center justify-between p-4 border-b border-zinc-900"
                                    onPress={() => handleAddExercise(item)}
                                >
                                    <View>
                                        <Text className="text-white font-semibold text-lg">{item.name}</Text>
                                        <Text className="text-zinc-500">{item.muscleGroup}</Text>
                                    </View>
                                    <Plus size={20} color="#3b82f6" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </ScreenLayout>
    );
}
