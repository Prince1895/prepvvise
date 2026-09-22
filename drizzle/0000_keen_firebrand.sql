CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."coding_submission_status" AS ENUM('queued', 'running', 'passed', 'failed', 'error', 'timed_out');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."practice_set_access" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."practice_set_type" AS ENUM('focused', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('created', 'active', 'cancelled', 'paused', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"usage_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"practice_set_id" uuid NOT NULL,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"score" integer,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_answers_attempt_id_question_id_pk" PRIMARY KEY("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "coding_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"language" text NOT NULL,
	"source_code" text NOT NULL,
	"status" "coding_submission_status" DEFAULT 'queued' NOT NULL,
	"test_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"provider" text NOT NULL,
	"provider_order_id" text,
	"provider_payment_id" text,
	"amount_paise" integer NOT NULL,
	"currency" text NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"name" text NOT NULL,
	"access" "practice_set_access" DEFAULT 'free' NOT NULL,
	"type" "practice_set_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_set_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"kind" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"explanation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_subscription_id" text,
	"status" "subscription_status" DEFAULT 'created' NOT NULL,
	"current_period_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"best_score" integer,
	"completed_sets" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text,
	"email" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_practice_set_id_practice_sets_id_fk" FOREIGN KEY ("practice_set_id") REFERENCES "public"."practice_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD CONSTRAINT "practice_sets_module_id_assessment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."assessment_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_practice_set_id_practice_sets_id_fk" FOREIGN KEY ("practice_set_id") REFERENCES "public"."practice_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_module_id_assessment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."assessment_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_user_feature_date_idx" ON "ai_usage" USING btree ("user_id","feature","usage_date");--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_user_id_idx" ON "assessment_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_practice_set_id_idx" ON "assessment_attempts" USING btree ("practice_set_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_user_status_idx" ON "assessment_attempts" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_modules_slug_idx" ON "assessment_modules" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "attempt_answers_question_id_idx" ON "attempt_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "coding_submissions_attempt_id_idx" ON "coding_submissions" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "coding_submissions_user_id_idx" ON "coding_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_order_id_idx" ON "payments" USING btree ("provider","provider_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_sets_module_number_idx" ON "practice_sets" USING btree ("module_id","set_number");--> statement-breakpoint
CREATE INDEX "practice_sets_module_id_idx" ON "practice_sets" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_options_question_position_idx" ON "question_options" USING btree ("question_id","position");--> statement-breakpoint
CREATE INDEX "question_options_question_id_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_set_position_idx" ON "questions" USING btree ("practice_set_id","position");--> statement-breakpoint
CREATE INDEX "questions_practice_set_id_idx" ON "questions" USING btree ("practice_set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_provider_id_idx" ON "subscriptions" USING btree ("provider","provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_module_idx" ON "user_progress" USING btree ("user_id","module_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_id_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_id_idx" ON "webhook_events" USING btree ("provider","event_id");