-- Run this in Supabase SQL Editor

-- Workout Templates (e.g., Push, Pull, Legs)
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises in a Template
CREATE TABLE IF NOT EXISTS template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    "order" INT DEFAULT 0
);

-- Seed more exercises if needed
INSERT INTO exercises (name, muscle_group, category) VALUES
    ('Incline Dumbbell Press', 'Chest', 'Dumbbell'),
    ('Calf Raise', 'Legs', 'Machine'),
    ('Face Pull', 'Shoulders', 'Cable'),
    ('Hammer Curl', 'Biceps', 'Dumbbell'),
    ('Romanian Deadlift', 'Legs', 'Barbell'),
    ('Lateral Raise', 'Shoulders', 'Dumbbell')
ON CONFLICT DO NOTHING;

-- Seed Templates (using a DO block to get IDs dynamically)
DO $$
DECLARE
    push_id UUID;
    pull_id UUID;
    legs_id UUID;
    bench_id UUID;
    ohp_id UUID;
    tricep_id UUID;
    lateral_id UUID;
    deadlift_id UUID;
    pullup_id UUID;
    row_id UUID;
    curl_id UUID;
    squat_id UUID;
    legpress_id UUID;
    rdl_id UUID;
    calf_id UUID;
BEGIN
    -- 1. Create Templates
    INSERT INTO workout_templates (name, description) VALUES ('Push Day', 'Chest, Shoulders, and Triceps focus') RETURNING id INTO push_id;
    INSERT INTO workout_templates (name, description) VALUES ('Pull Day', 'Back and Biceps focus') RETURNING id INTO pull_id;
    INSERT INTO workout_templates (name, description) VALUES ('Leg Day', 'Quads, Hamstrings, and Calves') RETURNING id INTO legs_id;

    -- 2. Get Exercise IDs
    SELECT id INTO bench_id FROM exercises WHERE name = 'Bench Press';
    SELECT id INTO ohp_id FROM exercises WHERE name = 'Overhead Press';
    SELECT id INTO tricep_id FROM exercises WHERE name = 'Tricep Pushdown';
    SELECT id INTO lateral_id FROM exercises WHERE name = 'Lateral Raise';

    SELECT id INTO deadlift_id FROM exercises WHERE name = 'Deadlift';
    SELECT id INTO pullup_id FROM exercises WHERE name = 'Pull Up';
    SELECT id INTO row_id FROM exercises WHERE name = 'Barbell Row';
    SELECT id INTO curl_id FROM exercises WHERE name = 'Bicep Curl';

    SELECT id INTO squat_id FROM exercises WHERE name = 'Squat';
    SELECT id INTO legpress_id FROM exercises WHERE name = 'Leg Press';
    SELECT id INTO rdl_id FROM exercises WHERE name = 'Romanian Deadlift';
    SELECT id INTO calf_id FROM exercises WHERE name = 'Calf Raise';

    -- 3. Link Exercises to Templates
    -- Push Day
    IF bench_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (push_id, bench_id, 0); END IF;
    IF ohp_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (push_id, ohp_id, 1); END IF;
    IF lateral_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (push_id, lateral_id, 2); END IF;
    IF tricep_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (push_id, tricep_id, 3); END IF;

    -- Pull Day
    IF deadlift_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (pull_id, deadlift_id, 0); END IF;
    IF pullup_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (pull_id, pullup_id, 1); END IF;
    IF row_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (pull_id, row_id, 2); END IF;
    IF curl_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (pull_id, curl_id, 3); END IF;

    -- Leg Day
    IF squat_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (legs_id, squat_id, 0); END IF;
    IF rdl_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (legs_id, rdl_id, 1); END IF;
    IF legpress_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (legs_id, legpress_id, 2); END IF;
    IF calf_id IS NOT NULL THEN INSERT INTO template_exercises (template_id, exercise_id, "order") VALUES (legs_id, calf_id, 3); END IF;

END $$;
