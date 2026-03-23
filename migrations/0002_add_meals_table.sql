CREATE TABLE IF NOT EXISTS "meals" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "image_url" text NOT NULL,
  "user_inputs" jsonb NOT NULL,
  "ai_analysis" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "meals_user_id_created_at_idx" ON "meals" ("user_id", "created_at" DESC);

