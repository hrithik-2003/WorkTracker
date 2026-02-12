-- 1. Cleardown existing data (DISABLED FOR SAFETY)
-- DELETE FROM sets;
-- DELETE FROM workout_exercises;
-- DELETE FROM workouts;

-- 2. Add user_id column to workouts table if not exists
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid();

-- 3. Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Workouts (Crucial: User can only see their own)
DROP POLICY IF EXISTS "Users can only see their own workouts" ON workouts;
CREATE POLICY "Users can only see their own workouts"
ON workouts FOR ALL
USING (auth.uid() = user_id);

-- 5. Create Policies for Workout Exercises (Inherit from workout)
-- Since workout_exercises are children of workouts, we check if the parent workout belongs to the user
DROP POLICY IF EXISTS "Users can manage exercises of their workouts" ON workout_exercises;
CREATE POLICY "Users can manage exercises of their workouts"
ON workout_exercises FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM workouts
        WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = auth.uid()
    )
);

-- 6. Create Policies for Sets (Inherit from workout_exercise -> workout)
DROP POLICY IF EXISTS "Users can manage sets of their exercises" ON sets;
CREATE POLICY "Users can manage sets of their exercises"
ON sets FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM workout_exercises
        JOIN workouts ON workouts.id = workout_exercises.workout_id
        WHERE workout_exercises.id = sets.workout_exercise_id
        AND workouts.user_id = auth.uid()
    )
);

-- 7. Ensure templates are public OR user specific.
-- Add user_id to workout_templates too so users can save their own routines.
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own templates" ON workout_templates;
CREATE POLICY "Users can see their own templates"
ON workout_templates FOR ALL
USING (auth.uid() = user_id OR user_id IS NULL); 
-- logic: see own templates OR public templates (user_id is null)

-- 8. Protect template_exercises
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see template exercises" ON template_exercises;
CREATE POLICY "Users can see template exercises"
ON template_exercises FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM workout_templates
        WHERE workout_templates.id = template_exercises.template_id
        AND (workout_templates.user_id = auth.uid() OR workout_templates.user_id IS NULL)
    )
);

