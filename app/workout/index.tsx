import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Stack, router } from "expo-router";
import { useState, useEffect } from "react";
import { useWorkoutStore } from "@/lib/store";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { getTemplates, getTemplateDetails, Template } from "@/lib/api/templates";
import { ChevronDown, FolderOpen, Plus, X } from "lucide-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RestTimer } from "@/components/workout/RestTimer";

export default function ActiveWorkoutScreen() {
    const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
    const finishWorkout = useWorkoutStore((state) => state.finishWorkout);
    const addExercise = useWorkoutStore((state) => state.addExercise);

    const [templates, setTemplates] = useState<Template[]>([]);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
    const [showNotes, setShowNotes] = useState(false);

    useEffect(() => {
        getTemplates().then((res) => {
            if (res.success && res.data) {
                setTemplates(res.data);
            } else {
                Alert.alert("Error", res.error || "Failed to load templates");
            }
        });
    }, []);

    const handleLoadTemplate = async (templateId: string) => {
        setLoadingTemplateId(templateId);
        const res = await getTemplateDetails(templateId);

        if (res.success && res.data) {
            const details = res.data;

            // Update workout name to template name
            useWorkoutStore.getState().setWorkoutName(details.name);

            // Add each exercise from the template
            details.exercises.forEach((exercise) => {
                addExercise({
                    id: exercise.id,
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    category: exercise.category,
                    recommendedSets: exercise.recommendedSets,
                });
            });
            setShowTemplatePicker(false);
        }
        setLoadingTemplateId(null);
    };

    if (!activeWorkout) {
        return (
            <ScreenLayout className="justify-center items-center">
                <Text className="text-white text-xl">No active workout</Text>
                <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
            </ScreenLayout>
        );
    }

    const handleFinish = () => {
        const hasCompletedSet = activeWorkout.exercises.some((exercise) =>
            exercise.sets.some((set) => set.completed)
        );

        if (!hasCompletedSet) {
            Alert.alert(
                "Cannot Finish",
                "Please complete at least one set before finishing the workout."
            );
            return;
        }

        Alert.alert("Finish Workout", "Are you sure you want to finish?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Finish",
                style: "default",
                onPress: async () => {
                    const result = await finishWorkout();
                    if (result.success) {
                        router.replace("/(tabs)/history");
                    } else {
                        Alert.alert("Error Saving Workout", result.error || "An unknown error occurred. Please try again.");
                    }
                },
            },
        ]);
    };

    const customTemplates = templates.filter(t => t.is_custom);

    return (
        <ScreenLayout>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 mt-2">
                <View>
                    <Text className="text-zinc-400 text-sm">Active Workout</Text>
                    <Text className="text-white text-2xl font-bold">{activeWorkout.name}</Text>
                </View>
                <Button title="Finish" onPress={handleFinish} className="px-4 py-2" />
            </View>

            {/* Template Picker Dropdown */}
            {customTemplates.length > 0 && (
                <View className="mb-4">
                    <TouchableOpacity
                        className="flex-row items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                        onPress={() => setShowTemplatePicker(!showTemplatePicker)}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center gap-2">
                            <FolderOpen size={18} color="#71717a" />
                            <Text className="text-zinc-400">Load from Routine</Text>
                        </View>
                        <View style={{ transform: [{ rotate: showTemplatePicker ? '180deg' : '0deg' }] }}>
                            <ChevronDown size={20} color="#71717a" />
                        </View>
                    </TouchableOpacity>

                    {showTemplatePicker && (
                        <View className="bg-zinc-900 border border-zinc-800 rounded-xl mt-2 overflow-hidden">
                            {customTemplates.map((template) => (
                                <TouchableOpacity
                                    key={template.id}
                                    className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
                                    onPress={() => handleLoadTemplate(template.id)}
                                    disabled={loadingTemplateId !== null}
                                >
                                    <View>
                                        <Text className="text-white font-medium">{template.name}</Text>
                                        <Text className="text-zinc-500 text-xs">{template.exercise_count} exercises</Text>
                                    </View>
                                    {loadingTemplateId === template.id ? (
                                        <ActivityIndicator size="small" color="#3b82f6" />
                                    ) : (
                                        <Text className="text-blue-500 text-sm">Load</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={120}
                enableOnAndroid={true}
            >
                {activeWorkout.exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}

                <Button
                    title="+ Add Exercise"
                    variant="outline"
                    className="mb-6 border-dashed border-zinc-600"
                    onPress={() => router.push("/workout/exercise-picker")}
                />

                {/* Notes Section */}
                <View className="mb-8">
                    {!showNotes && !activeWorkout.notes ? (
                        <TouchableOpacity
                            className="flex-row items-center border border-dashed border-zinc-700 rounded-lg p-4 justify-center"
                            onPress={() => setShowNotes(true)}
                        >
                            <Plus size={20} color="#71717a" />
                            <Text className="text-zinc-400 ml-2">Add Notes (Optional)</Text>
                        </TouchableOpacity>
                    ) : (
                        <View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-zinc-400 text-sm">Workout Notes</Text>
                                <TouchableOpacity onPress={() => setShowNotes(false)}>
                                    <X size={20} color="#71717a" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                className="bg-zinc-900/80 text-white p-4 rounded-lg min-h-[100px] border border-zinc-800"
                                placeholder="How did it feel? Any pain or PRs?"
                                placeholderTextColor="#52525b"
                                multiline
                                textAlignVertical="top"
                                value={activeWorkout.notes}
                                onChangeText={(text) => useWorkoutStore.getState().setWorkoutNotes(text)}
                                autoFocus={showNotes && !activeWorkout.notes}
                            />
                        </View>
                    )}
                </View>
            </KeyboardAwareScrollView>
            <RestTimer />
        </ScreenLayout>
    );
}
