CREATE TABLE "module_learning_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"duration_minutes" integer DEFAULT 8 NOT NULL,
	"access" "practice_set_access" DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_learning_sections" ADD CONSTRAINT "module_learning_sections_module_id_assessment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."assessment_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "module_learning_sections_module_position_idx" ON "module_learning_sections" USING btree ("module_id","position");--> statement-breakpoint
CREATE INDEX "module_learning_sections_module_id_idx" ON "module_learning_sections" USING btree ("module_id");