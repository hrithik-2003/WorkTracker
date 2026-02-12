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
    finishWorkout: () => Promise<{ success: boolean; error?: string }>;
    addExercise: (exercise: Exercise & { recommendedSets?: number }) => void;
    removeExercise: (exerciseInstanceId: string) => void;
    addSet: (exerciseInstanceId: string, weight: string, reps: string) => void;
    updateSet: (exerciseInstanceId: string, setId: string, updates: Partial<WorkoutSet>) => void;
    removeSet: (exerciseInstanceId: string, setId: string) => void;
    toggleSetComplete: (exerciseInstanceId: string, setId: string) => void;
    setWorkoutNotes: (notes: string) => void;
    setWorkoutName: (name: string) => void;

    // Rest Timer
    restTimer: {
        endTime: number | null; // Timestamp when timer ends
        isRunning: boolean;
    };
    startRestTimer: (durationSeconds: number) => void;
    stopRestTimer: () => void;
    addRestTime: (seconds: number) => void;
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
            restTimer: {
                endTime: null,
                isRunning: false,
            },

            startWorkout: (name?: string, initialExercises: (Exercise & { recommendedSets?: number })[] = []) => {
                const workoutName = name || `Workout - ${new Date().toLocaleDateString()}`;

                const exercises: WorkoutExercise[] = initialExercises.map((ex) => {
                    const targetSets = ex.recommendedSets || 0;
                    const sets: WorkoutSet[] = [];

                    // Pre-create empty sets if starting from a template
                    if (targetSets > 0) {
                        for (let i = 0; i < targetSets; i++) {
                            sets.push({
                                id: randomUUID(),
                                reps: "",
                                weight: "",
                                completed: false,
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

                const newWorkout: ActiveWorkout = {
                    id: randomUUID(),
                    name: workoutName,
                    startTime: new Date().toISOString(),
                    exercises: exercises,
                    status: "active",
                    notes: "",
                };

                set({
                    activeWorkout: newWorkout,
                    isSaving: false,
                });
            },

            finishWorkout: async () => {
                const workout = get().activeWorkout;
                if (!workout) return { success: false, error: "No active workout" };

                set({ isSaving: true });

                const result = await saveWorkout(workout);
                if (result.success) {
                    console.log("Workout saved successfully!");
                    set({ activeWorkout: null, isSaving: false });
                } else {
                    console.error("Failed to save workout:", result.error);
                    set({ isSaving: false });
                }

                return result;
            },

            addExercise: (exercise) => {
                set((state) => {
                    if (!state.activeWorkout) return state;

                    // Pre-populate sets if recommendedSets is provided
                    const setsCount = (exercise as any).recommendedSets || 0;
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

                    // Check if we are completing the set (it was previously incomplete)
                    let isBecomingComplete = false;
                    const exercise = state.activeWorkout.exercises.find((e) => e.id === exerciseInstanceId);
                    if (exercise) {
                        const s = exercise.sets.find((set) => set.id === setId);
                        if (s && !s.completed) {
                            isBecomingComplete = true;
                        }
                    }

                    // If completing a set, start the rest timer (3 mins = 180s)
                    if (isBecomingComplete) {
                        const now = Date.now();
                        // Only start if not already running or just restart it? Let's restart it for the simplified flow.
                        // Or maybe only if it's not running? User usually wants rest after EACH set.
                        // Let's set it to 5 seconds from now (for testing).
                        set({
                            restTimer: {
                                endTime: now + 5 * 1000,
                                isRunning: true,
                            }
                        });
                    }

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

            startRestTimer: (durationSeconds) => {
                set({
                    restTimer: {
                        endTime: Date.now() + durationSeconds * 1000,
                        isRunning: true,
                    }
                });
            },

            stopRestTimer: () => {
                set({
                    restTimer: {
                        endTime: null,
                        isRunning: false,
                    }
                });
            },

            addRestTime: (seconds) => {
                set((state) => {
                    if (!state.restTimer.endTime) return state;
                    return {
                        restTimer: {
                            ...state.restTimer,
                            endTime: state.restTimer.endTime + seconds * 1000,
                        }
                    };
                });
            },
        }),
        {
            name: "workout-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                activeWorkout: state.activeWorkout,
                // Persist timer state too so it survives reloads
                restTimer: state.restTimer
            }),
        }
    )
);
