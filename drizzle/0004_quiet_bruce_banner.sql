CREATE TABLE "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"attempt_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"summary" text NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_analyses_attempt_feature_idx" ON "ai_analyses" USING btree ("attempt_id","feature");--> statement-breakpoint
CREATE INDEX "ai_analyses_user_id_idx" ON "ai_analyses" USING btree ("user_id");