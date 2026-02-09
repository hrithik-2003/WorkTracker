-- Run this in Supabase SQL Editor

-- Add is_custom column to workout_templates
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS "is_custom" BOOLEAN DEFAULT FALSE;

-- Update existing templates to be system templates (is_custom = false)
UPDATE workout_templates SET "is_custom" = FALSE WHERE "is_custom" IS NULL;
