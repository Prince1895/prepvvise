ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 1 NOT NULL;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "marks" integer DEFAULT 10 NOT NULL;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "topic" text;
ALTER TABLE "module_learning_sections" ADD COLUMN IF NOT EXISTS "structured_content" jsonb DEFAULT '{}'::jsonb NOT NULL;
