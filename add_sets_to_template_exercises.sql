-- Run this in Supabase SQL Editor

-- Add sets column to template_exercises
ALTER TABLE template_exercises 
ADD COLUMN IF NOT EXISTS "sets" INT DEFAULT 3;

-- Update existing rows to have default 3 sets if null (though default handles new ones)
UPDATE template_exercises SET "sets" = 3 WHERE "sets" IS NULL;
