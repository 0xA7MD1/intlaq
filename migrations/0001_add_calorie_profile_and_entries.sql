ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "bmr" integer,
  ADD COLUMN IF NOT EXISTS "tdee" integer,
  ADD COLUMN IF NOT EXISTS "daily_calorie_target" integer,
  ADD COLUMN IF NOT EXISTS "calorie_target_formula" text,
  ADD COLUMN IF NOT EXISTS "calorie_target_calculated_at" timestamp;

CREATE TABLE IF NOT EXISTS "calorie_entry" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id"),
  "date" text NOT NULL,
  "calories" integer NOT NULL,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_calorie_entry_user_date" ON "calorie_entry"("user_id", "date");

