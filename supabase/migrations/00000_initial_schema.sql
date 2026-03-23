-- =============================================================================
-- هيكل قاعدة البيانات الكامل لـ Supabase (Intlaq + Better Auth)
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor أو عبر drizzle-kit
-- =============================================================================

-- 1) المستخدم (Better Auth + ملف Intlaq)
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL,
  "image" text,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  "polar_customer_id" text,
  "gender" text,
  "age" integer,
  "height" integer,
  "weight" double precision,
  "activity_level" text,
  "goal" text,
  "bmr" integer,
  "tdee" integer,
  "daily_calorie_target" integer,
  "calorie_target_formula" text,
  "calorie_target_calculated_at" timestamp,
  "onboarding_completed" boolean DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email");
CREATE INDEX IF NOT EXISTS "user_polar_customer_id_idx" ON "user" ("polar_customer_id");
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user" ("email");

-- 2) الجلسات (Better Auth)
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token");
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");
CREATE INDEX IF NOT EXISTS "session_expires_at_idx" ON "session" ("expires_at");

-- 3) الحسابات المرتبطة (Better Auth - Google, Email/Password)
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_idx" ON "account" ("provider_id", "account_id");

-- 4) التحقق (Better Auth - إعادة تعيين كلمة المرور وغيرها)
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

-- 5) مدخلات السعرات
CREATE TABLE IF NOT EXISTS "calorie_entry" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "calories" integer NOT NULL,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "calorie_entry_user_date_idx" ON "calorie_entry" ("user_id", "date");

-- 6) الوجبات (صورة + تحليل AI)
CREATE TABLE IF NOT EXISTS "meals" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "user_inputs" jsonb NOT NULL,
  "ai_analysis" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "meals_user_created_at_idx" ON "meals" ("user_id", "created_at" DESC);

-- 7) المهام
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "is_completed" boolean DEFAULT false,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" ("user_id");

-- 8) جلسات الوقت (Timer)
CREATE TABLE IF NOT EXISTS "time_sessions" (
  "id" text PRIMARY KEY,
  "task_id" text REFERENCES "tasks"("id") ON DELETE SET NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "time_sessions_user_id_idx" ON "time_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "time_sessions_task_id_idx" ON "time_sessions" ("task_id");

-- حالة العادة لكل يوم (مكتمل / فشل / فارغ)
CREATE TABLE IF NOT EXISTS "habit_completion" (
  "id" text PRIMARY KEY,
  "task_id" text NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "status" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "habit_completion_task_date_idx" ON "habit_completion" ("task_id", "date");
