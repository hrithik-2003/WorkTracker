import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActiveWorkout, Exercise, WorkoutExercise, WorkoutSet } from "./types";
import { randomUUID } from "expo-crypto";
import { saveWorkout } from "@/lib/api/workouts";

interface WorkoutState {
    activeWorkout: ActiveWorkout | null;
    isSaving: boolean;
    startWorkout: (name?: string, initialExercises?: Exercise[]) => void;
    finishWorkout: () => Promise<void>;
    addExercise: (exercise: Exercise & { recomendedSets?: number }) => void;
    removeExercise: (exerciseInstanceId: string) => void;
    addSet: (exerciseInstanceId: string, weight: string, reps: string) => void;
    updateSet: (exerciseInstanceId: string, setId: string, updates: Partial<WorkoutSet>) => void;
    removeSet: (exerciseInstanceId: string, setId: string) => void;
    toggleSetComplete: (exerciseInstanceId: string, setId: string) => void;
    setWorkoutNotes: (notes: string) => void;
    setWorkoutName: (name: string) => void;
}

/**
 * Get the time period of the day based on hour
 */
function getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
}

/**
 * Generate a workout name
 */
function generateWorkoutName(): string {
    return "Custom Workout";
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set, get) => ({
            activeWorkout: null,
            isSaving: false,

            startWorkout: (name?: string, initialExercises: (Exercise | (Exercise & { recomendedSets?: number }))[] = []) => {
                const workoutName = name || generateWorkoutName();

                const exercises: WorkoutExercise[] = initialExercises.map(ex => {
                    const targetSets = 'recomendedSets' in ex ? (ex.recomendedSets || 3) : 0;
                    const sets: WorkoutSet[] = [];

                    // Pre-create empty sets if starting from a template
                    if (targetSets > 0) {
                        for (let i = 0; i < targetSets; i++) {
                            sets.push({
                                id: randomUUID(),
                                reps: "",
                                weight: "",
                                completed: false, // Start as not completed
                            });
                        }
                    }

                    return {
                        id: randomUUID(),
                        exerciseId: ex.id,
                        exercise: ex,
                        sets: sets,
                    };
                });

                set({
                    activeWorkout: {
                        id: randomUUID(),
                        name: workoutName,
                        startTime: new Date().toISOString(),
                        exercises: exercises,
                        status: "active",
                    },
                });
            },

            finishWorkout: async () => {
                const workout = get().activeWorkout;
                if (!workout) return;

                set({ isSaving: true });

                const result = await saveWorkout(workout);
                if (result.success) {
                    console.log("Workout saved successfully!");
                } else {
                    console.error("Failed to save workout:", result.error);
                }

                set({ activeWorkout: null, isSaving: false });
            },

            addExercise: (exercise) => {
                set((state) => {
                    if (!state.activeWorkout) return state;

                    // Pre-populate sets if recomendedSets is provided
                    const setsCount = (exercise as any).recomendedSets || 0;
                    const initialSets: WorkoutSet[] = Array.from({ length: setsCount }, () => ({
                        id: randomUUID(),
                        reps: "",
                        weight: "",
                        completed: false,
                    }));

                    const newExercise: WorkoutExercise = {
                        id: randomUUID(),
                        exerciseId: exercise.id,
                        exercise: {
                            id: exercise.id,
                            name: exercise.name,
                            muscleGroup: exercise.muscleGroup,
                            category: exercise.category,
                        },
                        sets: initialSets,
                    };
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: [...state.activeWorkout.exercises, newExercise],
                        },
                    };
                });
            },

            removeExercise: (exerciseInstanceId) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: state.activeWorkout.exercises.filter((e) => e.id !== exerciseInstanceId),
                        },
                    };
                });
            },

            addSet: (exerciseInstanceId, weight, reps) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: state.activeWorkout.exercises.map((e) => {
                                if (e.id !== exerciseInstanceId) return e;
                                const newSet: WorkoutSet = {
                                    id: randomUUID(),
                                    reps,
                                    weight,
                                    completed: true, // Default to completed per user request
                                };
                                return { ...e, sets: [...e.sets, newSet] };
                            }),
                        },
                    };
                });
            },

            updateSet: (exerciseInstanceId, setId, updates) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: state.activeWorkout.exercises.map((e) => {
                                if (e.id !== exerciseInstanceId) return e;
                                return {
                                    ...e,
                                    sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
                                };
                            }),
                        },
                    };
                });
            },
            removeSet: (exerciseInstanceId, setId) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: state.activeWorkout.exercises.map((e) => {
                                if (e.id !== exerciseInstanceId) return e;
                                return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
                            }),
                        },
                    };
                });
            },

            toggleSetComplete: (exerciseInstanceId, setId) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            exercises: state.activeWorkout.exercises.map((e) => {
                                if (e.id !== exerciseInstanceId) return e;
                                return {
                                    ...e,
                                    sets: e.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
                                };
                            }),
                        },
                    };
                });
            },

            setWorkoutNotes: (notes: string) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            notes,
                        },
                    };
                });
            },

            setWorkoutName: (name: string) => {
                set((state) => {
                    if (!state.activeWorkout) return state;
                    return {
                        activeWorkout: {
                            ...state.activeWorkout,
                            name,
                        },
                    };
                });
            },
        }),
        {
            name: "workout-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ activeWorkout: state.activeWorkout }),
        }
    )
);
