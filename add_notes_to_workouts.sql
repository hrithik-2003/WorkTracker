-- Run this in Supabase SQL Editor

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS notes TEXT;
