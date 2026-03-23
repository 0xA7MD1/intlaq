/**
 * سكريبت هجرة لإضافة جداول التمارين
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
-- 1. جدول مجموعات التمارين
CREATE TABLE IF NOT EXISTS "workout_groups" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "icon" text NOT NULL DEFAULT '🏋️‍♂️',
  "days" jsonb DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_groups_user_id_idx" ON "workout_groups" ("user_id");

-- 2. جدول التمارين
CREATE TABLE IF NOT EXISTS "exercises" (
  "id" text PRIMARY KEY,
  "group_id" text NOT NULL REFERENCES "workout_groups"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "sets" integer NOT NULL DEFAULT 3,
  "reps" integer NOT NULL DEFAULT 10,
  "duration_seconds" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "exercises_group_id_idx" ON "exercises" ("group_id");

-- 3. جدول سجلات التمارين
CREATE TABLE IF NOT EXISTS "workout_logs" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "group_id" text NOT NULL REFERENCES "workout_groups"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "status" text NOT NULL DEFAULT 'completed',
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "workout_logs_user_date_idx" ON "workout_logs" ("user_id", "date");
`;

try {
  console.log("بدء عملية إضافة جداول التمارين...");
  await sql.unsafe(migration);
  console.log("تم إضافة جداول التمارين بنجاح!");
} catch (e) {
  console.error("فشل تطبيق الهجرة:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
