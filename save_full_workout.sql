-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Create a function to save a full workout atomically
CREATE OR REPLACE FUNCTION save_full_workout(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    workout_id UUID;
    exercise_record JSONB;
    set_record JSONB;
    w_exercise_id UUID;
    v_user_id UUID;
BEGIN
    -- get user_id from auth context
    v_user_id := auth.uid();
    
    -- 1. Insert Workout
    INSERT INTO workouts (
        id,
        user_id,
        name,
        started_at,
        ended_at,
        notes
    ) VALUES (
        (payload->>'id')::UUID,
        v_user_id,
        payload->>'name',
        (payload->>'started_at')::TIMESTAMPTZ,
        (payload->>'ended_at')::TIMESTAMPTZ,
        payload->>'notes'
    )
    RETURNING id INTO workout_id;

    -- 2. Loop through exercises
    FOR exercise_record IN SELECT * FROM jsonb_array_elements(payload->'exercises')
    LOOP
        INSERT INTO workout_exercises (
            id,
            workout_id,
            exercise_id,
            exercise_name,
            "order"
        ) VALUES (
            (exercise_record->>'id')::UUID,
            workout_id,
            (exercise_record->>'exercise_id')::UUID,
            exercise_record->>'name',
            (exercise_record->>'order')::INT
        )
        RETURNING id INTO w_exercise_id;

        -- 3. Loop through sets for this exercise
        FOR set_record IN SELECT * FROM jsonb_array_elements(exercise_record->'sets')
        LOOP
            INSERT INTO sets (
                id,
                workout_exercise_id,
                weight,
                reps,
                "order"
            ) VALUES (
                (set_record->>'id')::UUID,
                w_exercise_id,
                (set_record->>'weight')::DECIMAL,
                (set_record->>'reps')::INT,
                (set_record->>'order')::INT
            );
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'workout_id', workout_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
