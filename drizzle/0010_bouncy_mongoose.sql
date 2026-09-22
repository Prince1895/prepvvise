CREATE TABLE "typing_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" uuid,
	"duration_seconds" integer NOT NULL,
	"typed_characters" integer NOT NULL,
	"correct_characters" integer NOT NULL,
	"wpm" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "typing_results" ADD CONSTRAINT "typing_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_results" ADD CONSTRAINT "typing_results_module_id_assessment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."assessment_modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "typing_results_user_id_idx" ON "typing_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "typing_results_wpm_idx" ON "typing_results" USING btree ("wpm");