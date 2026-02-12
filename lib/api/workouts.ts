import { supabase } from "@/lib/supabase";
import { ActiveWorkout } from "@/lib/types";

// Types for database responses
export interface WorkoutRecord {
    id: string;
    name: string;
    started_at: string;
    ended_at: string | null;
    created_at: string;
    notes?: string;
    workout_exercises: WorkoutExerciseRecord[];
}

export interface WorkoutExerciseRecord {
    id: string;
    exercise_name: string;
    order: number;
    sets: SetRecord[];
}

export interface SetRecord {
    id: string;
    weight: number;
    reps: number;
    order: number;
}

/**
 * Save a completed workout to Supabase
 */
export async function saveWorkout(workout: ActiveWorkout): Promise<{ success: boolean; error?: string }> {
    try {
        console.log("Saving workout atomically:", workout.id);

        // Prepare the payload
        const payload = {
            id: workout.id,
            name: workout.name,
            started_at: workout.startTime,
            ended_at: new Date().toISOString(),
            notes: workout.notes,
            exercises: workout.exercises.map((ex, i) => ({
                id: ex.id,
                exercise_id: ex.exerciseId,
                name: ex.exercise.name,
                order: i,
                sets: ex.sets
                    .filter(s => s.completed || (s.weight && s.reps)) // Filter out empty/incomplete sets
                    .map((s, j) => ({
                        id: s.id,
                        weight: parseFloat(String(s.weight)) || 0,
                        reps: parseInt(String(s.reps), 10) || 0,
                        order: j
                    }))
            }))
        };

        const { data, error } = await supabase.rpc('save_full_workout', { payload });

        if (error) {
            console.error("Error invoking save_full_workout:", error);
            throw error;
        }

        if (data && !data.success) {
            throw new Error(data.error || "Unknown error during save");
        }

        console.log("Workout saved successfully via RPC!");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving workout:", error);
        return { success: false, error: error.message };
    }
}

// Helper type for consistent API responses
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * Fetch workout history
 */
export async function getWorkoutHistory(): Promise<ApiResponse<WorkoutRecord[]>> {
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select(`
                id,
                name,
                started_at,
                ended_at,
                created_at,
                notes,
                workout_exercises (
                    id,
                    exercise_name,
                    order,
                    sets (
                        id,
                        weight,
                        reps,
                        order
                    )
                )
            `)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) throw error;

        return { success: true, data: data as WorkoutRecord[] };
    } catch (error: any) {
        console.error("Error fetching workout history:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch details for a specific workout
 */
export async function getWorkoutDetails(id: string): Promise<ApiResponse<WorkoutRecord>> {
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select(`
                id,
                name,
                started_at,
                ended_at,
                created_at,
                notes,
                workout_exercises (
                    id,
                    exercise_name,
                    order,
                    sets (
                        id,
                        weight,
                        reps,
                        order
                    )
                )
            `)
            .eq("id", id)
            .single();

        if (error) throw error;

        // Sort exercises and sets
        if (data.workout_exercises) {
            data.workout_exercises.sort((a: any, b: any) => a.order - b.order);
            data.workout_exercises.forEach((ex: any) => {
                if (ex.sets) {
                    ex.sets.sort((a: any, b: any) => a.order - b.order);
                }
            });
        }

        return { success: true, data: data as WorkoutRecord };
    } catch (error: any) {
        console.error("Error fetching workout details:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch exercises from database
 */
export async function getExercises(): Promise<ApiResponse<any[]>> {
    try {
        const { data, error } = await supabase
            .from("exercises")
            .select("id, name, muscle_group, category")
            .order("name");

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching exercises:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get count of workouts completed this month
 */
export async function getMonthlyWorkoutCount(): Promise<ApiResponse<number>> {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from("workouts")
            .select("*", { count: "exact", head: true })
            .gte("started_at", startOfMonth);

        if (error) throw error;
        return { success: true, data: count || 0 };
    } catch (error: any) {
        console.error("Error fetching monthly workout count:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all workout IDs in chronological order (for navigation)
 */
export async function getAllWorkoutIds(): Promise<ApiResponse<string[]>> {
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select("id")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data: data?.map(w => w.id) || [] };
    } catch (error: any) {
        console.error("Error fetching workout IDs:", error);
        return { success: false, error: error.message };
    }
}
