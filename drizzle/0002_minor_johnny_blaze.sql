ALTER TABLE "payments" ADD COLUMN "idempotency_key" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");