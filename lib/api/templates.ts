import { supabase } from "@/lib/supabase";
import { Exercise } from "@/lib/types";

export interface Template {
    id: string;
    name: string;
    description: string;
    exercise_count?: number;
    is_custom: boolean;
}

export interface TemplateDetail extends Template {
    exercises: TemplateExercise[];
}

export interface TemplateExercise extends Exercise {
    recomendedSets: number;
}

/**
 * Fetch all workout templates
 */
export async function getTemplates(): Promise<Template[]> {
    try {
        const { data, error } = await supabase
            .from("workout_templates")
            .select(`
                id, 
                name, 
                description,
                is_custom,
                template_exercises (count)
            `)
            .order("created_at", { ascending: false }); // Show newest first? Or name? User said Custom above Pre saved. 

        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            is_custom: t.is_custom || false,
            exercise_count: t.template_exercises?.[0]?.count || 0,
        }));
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
}

/**
 * Fetch details for a specific template (including exercises)
 */
export async function getTemplateDetails(templateId: string): Promise<TemplateDetail | null> {
    try {
        const { data, error } = await supabase
            .from("workout_templates")
            .select(`
                id,
                name,
                description,
                is_custom,
                template_exercises (
                    order,
                    sets,
                    exercise:exercises (
                        id,
                        name,
                        muscle_group,
                        category
                    )
                )
            `)
            .eq("id", templateId)
            .single();

        if (error) throw error;

        // Map the nested response to our clean types
        const exercises: TemplateExercise[] = (data.template_exercises as any[])
            .sort((a, b) => a.order - b.order)
            .map((item) => ({
                id: item.exercise.id,
                name: item.exercise.name,
                muscleGroup: item.exercise.muscle_group || "Other",
                category: item.exercise.category || "Other",
                recomendedSets: item.sets || 3, // Default to 3 if null
            }));

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            is_custom: data.is_custom || false,
            exercises,
        };
    } catch (error) {
        console.error("Error fetching template details:", error);
        return null;
    }
}

/**
 * Create a new workout template
 */
export async function createTemplate(
    name: string,
    description: string,
    exercises: { id: string, sets: number }[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Create Template (is_custom = true)
        const { data: templateData, error: templateError } = await supabase
            .from("workout_templates")
            .insert({ name, description, is_custom: true })
            .select()
            .single();

        if (templateError) throw templateError;

        // 2. Link Exercises
        const templateExercises = exercises.map((ex, index) => ({
            template_id: templateData.id,
            exercise_id: ex.id,
            order: index,
            sets: ex.sets
        }));

        const { error: exercisesError } = await supabase
            .from("template_exercises")
            .insert(templateExercises);

        if (exercisesError) throw exercisesError;

        return { success: true };
    } catch (error: any) {
        console.error("Error creating template:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a workout template and its exercises
 */
export async function deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Delete template_exercises first (foreign key constraint)
        const { error: exercisesError } = await supabase
            .from("template_exercises")
            .delete()
            .eq("template_id", templateId);

        if (exercisesError) throw exercisesError;

        // Delete the template
        const { error: templateError } = await supabase
            .from("workout_templates")
            .delete()
            .eq("id", templateId);

        if (templateError) throw templateError;

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting template:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing workout template
 */
export async function updateTemplate(
    templateId: string,
    name: string,
    description: string,
    exercises: { id: string, sets: number }[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Update template details
        const { error: templateError } = await supabase
            .from("workout_templates")
            .update({ name, description })
            .eq("id", templateId);

        if (templateError) throw templateError;

        // 2. Delete existing exercises
        const { error: deleteError } = await supabase
            .from("template_exercises")
            .delete()
            .eq("template_id", templateId);

        if (deleteError) throw deleteError;

        // 3. Insert new exercises
        const templateExercises = exercises.map((ex, index) => ({
            template_id: templateId,
            exercise_id: ex.id,
            order: index,
            sets: ex.sets
        }));

        const { error: exercisesError } = await supabase
            .from("template_exercises")
            .insert(templateExercises);

        if (exercisesError) throw exercisesError;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating template:", error);
        return { success: false, error: error.message };
    }
}
