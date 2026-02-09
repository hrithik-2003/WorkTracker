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
        console.log("Saving workout:", workout.id, "with", workout.exercises.length, "exercises");

        // 1. Insert the workout
        const { data: workoutData, error: workoutError } = await supabase
            .from("workouts")
            .insert({
                id: workout.id,
                name: workout.name,
                started_at: workout.startTime,
                ended_at: new Date().toISOString(),
                notes: workout.notes,
            })
            .select()
            .single();

        if (workoutError) {
            console.error("Workout insert error:", workoutError);
            throw workoutError;
        }
        console.log("Workout inserted:", workoutData);

        // 2. Insert workout_exercises and sets
        for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            console.log("Inserting exercise:", exercise.id, exercise.exercise.name, "exerciseId:", exercise.exerciseId);

            const { data: exerciseData, error: exerciseError } = await supabase
                .from("workout_exercises")
                .insert({
                    id: exercise.id,
                    workout_id: workout.id,
                    exercise_id: exercise.exerciseId,
                    exercise_name: exercise.exercise.name,
                    order: i,
                })
                .select()
                .single();

            if (exerciseError) {
                console.error("Exercise insert error:", exerciseError);
                throw exerciseError;
            }
            console.log("Exercise inserted:", exerciseData);

            // 3. Insert sets for this exercise
            const setsToInsert = exercise.sets.map((set, index) => ({
                id: set.id,
                workout_exercise_id: exercise.id,
                weight: parseFloat(String(set.weight)) || 0,
                reps: parseInt(String(set.reps), 10) || 0,
                order: index,
            }));

            console.log("Sets to insert:", setsToInsert.length);

            if (setsToInsert.length > 0) {
                const { error: setsError } = await supabase.from("sets").insert(setsToInsert);
                if (setsError) {
                    console.error("Sets insert error:", setsError);
                    throw setsError;
                }
                console.log("Sets inserted successfully");
            }
        }

        console.log("Workout saved successfully!");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving workout:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch workout history
 */
/**
 * Fetch workout history
 */
export async function getWorkoutHistory(): Promise<WorkoutRecord[]> {
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

        return data as WorkoutRecord[];
    } catch (error) {
        console.error("Error fetching workout history:", error);
        return [];
    }
}

/**
 * Fetch details for a specific workout
 */
export async function getWorkoutDetails(id: string): Promise<WorkoutRecord | null> {
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

        return data as WorkoutRecord;
    } catch (error) {
        console.error("Error fetching workout details:", error);
        return null;
    }
}

/**
 * Fetch exercises from database
 */
export async function getExercises() {
    try {
        const { data, error } = await supabase
            .from("exercises")
            .select("id, name, muscle_group, category")
            .order("name");

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return [];
    }
}

/**
 * Get count of workouts completed this month
 */
export async function getMonthlyWorkoutCount(): Promise<number> {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error } = await supabase
            .from("workouts")
            .select("*", { count: "exact", head: true })
            .gte("started_at", startOfMonth);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error("Error fetching monthly workout count:", error);
        return 0;
    }
}

/**
 * Get all workout IDs in chronological order (for navigation)
 */
export async function getAllWorkoutIds(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from("workouts")
            .select("id")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data?.map(w => w.id) || [];
    } catch (error) {
        console.error("Error fetching workout IDs:", error);
        return [];
    }
}
