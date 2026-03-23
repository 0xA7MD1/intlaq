/**
 * سكريبت هجرة شامل لإنشاء كافة الجداول (user, session, account, verification, weight_history, calorie_entry, meals, tasks, habit_completion, time_sessions)
 * يستخدم عند فشل drizzle-kit push
 */
import { config } from "dotenv";
config({ path: ".env" });

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL غير موجود في .env");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

const migration = `
-- 1. جدول المستخدمين
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
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
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user" ("email");

-- 2. جدول الجلسات
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

-- 3. جدول الحسابات
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
  "updated_at" timestamp NOT NULL,
  UNIQUE("provider_id", "account_id")
);

-- 4. جدول التحقق
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

-- 5. سجل الوزن
CREATE TABLE IF NOT EXISTS "weight_history" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "weight" double precision NOT NULL,
  "date" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "weight_history_user_date_idx" ON "weight_history" ("user_id", "date");

-- 6. مدخلات السعرات
CREATE TABLE IF NOT EXISTS "calorie_entry" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "calories" integer NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "calorie_entry_user_date_idx" ON "calorie_entry" ("user_id", "date");

-- 7. الوجبات
CREATE TABLE IF NOT EXISTS "meals" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "user_inputs" jsonb NOT NULL,
  "ai_analysis" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- 8. المهام
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "is_completed" boolean DEFAULT false,
  "position" integer DEFAULT 0 NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" ("user_id");

-- 9. حالة العادات
CREATE TABLE IF NOT EXISTS "habit_completion" (
  "id" text PRIMARY KEY,
  "task_id" text NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "status" text NOT NULL,
  UNIQUE("task_id", "date")
);

-- 10. جلسات الوقت
CREATE TABLE IF NOT EXISTS "time_sessions" (
  "id" text PRIMARY KEY,
  "task_id" text REFERENCES "tasks"("id") ON DELETE SET NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
`;

try {
  console.log("بدء عملية تحديث قاعدة البيانات...");
  await sql.unsafe(migration);
  console.log("تم تطبيق كافة الهجرات بنجاح! جميع الجداول جاهزة.");
} catch (e) {
  console.error("فشل تطبيق الهجرات:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
