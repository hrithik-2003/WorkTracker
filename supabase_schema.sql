-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Exercises catalog
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    muscle_group TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some exercises
INSERT INTO exercises (name, muscle_group, category) VALUES
    ('Bench Press', 'Chest', 'Barbell'),
    ('Squat', 'Legs', 'Barbell'),
    ('Deadlift', 'Back', 'Barbell'),
    ('Overhead Press', 'Shoulders', 'Barbell'),
    ('Barbell Row', 'Back', 'Barbell'),
    ('Pull Up', 'Back', 'Bodyweight'),
    ('Dumbbell Curl', 'Biceps', 'Dumbbell'),
    ('Tricep Pushdown', 'Triceps', 'Cable'),
    ('Leg Press', 'Legs', 'Machine'),
    ('Lat Pulldown', 'Back', 'Cable')
ON CONFLICT DO NOTHING;

-- Completed workouts
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- nullable for now (no auth)
    name TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within a workout
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    exercise_name TEXT, -- denormalized for convenience
    "order" INT DEFAULT 0
);

-- Individual sets
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
    weight DECIMAL,
    reps INT,
    "order" INT DEFAULT 0
);

-- Enable Row Level Security (optional, for future auth)
-- ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
