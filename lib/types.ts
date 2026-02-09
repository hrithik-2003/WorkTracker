export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Cardio";
export type ExerciseCategory = "Barbell" | "Dumbbell" | "Machine" | "Weighted Bodyweight" | "Assisted Bodyweight" | "Cardio";

export interface Exercise {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    category: ExerciseCategory;
}

export interface WorkoutSet {
    id: string;
    reps: number | string; // string to allow empty input state
    weight: number | string;
    rpe?: number;
    completed: boolean;
}

export interface WorkoutExercise {
    id: string; // unique instance id
    exerciseId: string;
    exercise: Exercise;
    sets: WorkoutSet[];
    notes?: string;
}

export interface ActiveWorkout {
    id: string;
    name: string;
    startTime: string;
    exercises: WorkoutExercise[];
    notes?: string;
    status: "active" | "paused" | "finished";
}
