CREATE TYPE "public"."practice_set_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."speaking_submission_status" AS ENUM('recorded', 'analyzed', 'error');--> statement-breakpoint
ALTER TYPE "public"."practice_set_type" ADD VALUE 'mock';--> statement-breakpoint
ALTER TYPE "public"."practice_set_type" ADD VALUE 'daily';--> statement-breakpoint
CREATE TABLE "coding_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid,
	"practice_set_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starter_code" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"buggy_code" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"test_cases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"attempt_id" uuid,
	"question_id" uuid,
	"prompt" text NOT NULL,
	"audio_data_url" text,
	"audio_mime_type" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"transcript" text,
	"status" "speaking_submission_status" DEFAULT 'recorded' NOT NULL,
	"feedback" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "user_plan" NOT NULL,
	"display_name" text NOT NULL,
	"practice_set_access_limit" integer,
	"mock_access_limit" integer,
	"daily_access_limit" integer,
	"unlimited_attempts" boolean DEFAULT false NOT NULL,
	"ai_analysis" boolean DEFAULT false NOT NULL,
	"ai_analysis_daily_limit" integer,
	"ai_coach_daily_limit" integer,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "attempt_limit" integer;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "status" "practice_set_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "total_marks" integer;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD COLUMN "available_date" date;--> statement-breakpoint
ALTER TABLE "coding_problems" ADD CONSTRAINT "coding_problems_module_id_assessment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."assessment_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_problems" ADD CONSTRAINT "coding_problems_practice_set_id_practice_sets_id_fk" FOREIGN KEY ("practice_set_id") REFERENCES "public"."practice_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_problems_slug_idx" ON "coding_problems" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "coding_problems_practice_set_id_idx" ON "coding_problems" USING btree ("practice_set_id");--> statement-breakpoint
CREATE INDEX "coding_problems_module_id_idx" ON "coding_problems" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "speaking_submissions_user_id_idx" ON "speaking_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "speaking_submissions_attempt_id_idx" ON "speaking_submissions" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_slug_idx" ON "subscription_plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "practice_sets_type_idx" ON "practice_sets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "practice_sets_available_date_idx" ON "practice_sets" USING btree ("available_date");