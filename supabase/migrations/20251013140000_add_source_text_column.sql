-- Add missing source_text column and update constraints
-- This fixes the missing column error and adjusts length constraints for development

-- Add source_text column to generations table
ALTER TABLE public.generations 
ADD COLUMN source_text text;

-- Update length constraints to allow shorter texts for development
ALTER TABLE public.generations 
DROP CONSTRAINT IF EXISTS generations_source_text_length_check;

ALTER TABLE public.generations 
ADD CONSTRAINT generations_source_text_length_check 
CHECK (source_text_length between 50 and 10000);

-- Update error logs table constraints as well
ALTER TABLE public.generation_error_logs 
DROP CONSTRAINT IF EXISTS generation_error_logs_source_text_length_check;

ALTER TABLE public.generation_error_logs 
ADD CONSTRAINT generation_error_logs_source_text_length_check 
CHECK (source_text_length between 50 and 10000);
