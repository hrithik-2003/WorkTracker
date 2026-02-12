import { Alert, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ScreenLayout } from "@/components/ui/ScreenLayout";
import { getTemplateDetails, updateTemplate } from "@/lib/api/templates";
import { getExercises as fetchExercises } from "@/lib/api/workouts";
import { Exercise } from "@/lib/types";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function EditTemplateScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [addedExercises, setAddedExercises] = useState<{ id: string; name: string; sets: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [isSaving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const [exercisesRes, templateRes] = await Promise.all([
            fetchExercises(),
            id ? getTemplateDetails(id) : null
        ]);

        if (exercisesRes.success && exercisesRes.data) {
            // Map exercises
            const mapped: Exercise[] = exercisesRes.data.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscle_group || "Other",
                category: ex.category || "Other",
            }));
            setAllExercises(mapped);
        }

        // Pre-populate template data
        if (templateRes && templateRes.success && templateRes.data) {
            const templateData = templateRes.data;
            setName(templateData.name);
            setDescription(templateData.description || "");
            setAddedExercises(
                templateData.exercises.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    sets: String(ex.recommendedSets || 3),
                }))
            );
        }
        setLoading(false);
    };

    const handleSave = async (name: string, description: string, exercises: { id: string; sets: number }[]) => {
        if (!id) return;

        setSaving(true);
        const result = await updateTemplate(id, name, description, exercises);
        setSaving(false);

        if (result.success) {
            Alert.alert("Success", "Routine updated!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } else {
            Alert.alert("Error", "Failed to update routine. Please try again.");
        }
    };

    if (loading) {
        return (
            <ScreenLayout className="justify-center items-center">
                <Stack.Screen options={{ title: "Edit Routine", headerBackTitle: "Back" }} />
                <ActivityIndicator size="large" color="#3b82f6" />
            </ScreenLayout>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: "Edit Routine", headerBackTitle: "Back" }} />
            <TemplateForm
                title="Edit Routine"
                initialName={name}
                initialDescription={description}
                initialExercises={addedExercises}
                allExercises={allExercises}
                onSave={handleSave}
                isSaving={isSaving}
            />
        </>
    );
}
