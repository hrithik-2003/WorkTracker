import { Alert } from "react-native";
import { useState, useEffect } from "react";
import { Stack, router } from "expo-router";
import { createTemplate } from "@/lib/api/templates";
import { getExercises as fetchExercises } from "@/lib/api/workouts";
import { Exercise } from "@/lib/types";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function CreateTemplateScreen() {
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isSaving, setSaving] = useState(false);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        const res = await fetchExercises();
        if (res.success && res.data) {
            const mapped: Exercise[] = res.data.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscle_group || "Other",
                category: ex.category || "Other",
            }));
            setAllExercises(mapped);
        } else {
            console.error("Failed to load exercises:", res.error);
        }
    };

    const handleSave = async (name: string, description: string, exercises: { id: string; sets: number }[]) => {
        setSaving(true);
        const result = await createTemplate(name, description, exercises);
        setSaving(false);

        if (result.success) {
            Alert.alert("Success", "Routine created!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } else {
            Alert.alert("Error", "Failed to save routine. Please try again.");
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: "New Routine", headerBackTitle: "Back" }} />
            <TemplateForm
                title="Create Routine"
                allExercises={allExercises}
                onSave={handleSave}
                isSaving={isSaving}
            />
        </>
    );
}
