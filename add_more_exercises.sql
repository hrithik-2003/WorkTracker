-- Insert new exercises if they don't already exist
INSERT INTO exercises (name, muscle_group, category)
SELECT * FROM (VALUES
    ('Pull Ups', 'Back', 'Bodyweight'),
    ('Rear Delt Cable Extensions', 'Shoulders', 'Cable'),
    ('Cable Rows', 'Back', 'Cable'),
    ('Wrist Extensions', 'Forearms', 'Dumbbell'),
    ('Wrist Flexions', 'Forearms', 'Dumbbell'),
    ('Overhead Cable Tricep Extensions', 'Triceps', 'Cable'),
    ('Machine Chest Fly', 'Chest', 'Machine')
) AS new_exercises(name, muscle_group, category)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = new_exercises.name
);
