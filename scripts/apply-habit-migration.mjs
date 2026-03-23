/**
 * تشغيل migration جدول habit_completion يدوياً (بديل عند فشل drizzle-kit push)
 * استخدم: pnpm db:migrate:habit
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
CREATE TABLE IF NOT EXISTS "habit_completion" (
  "id" text PRIMARY KEY,
  "task_id" text NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "status" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "habit_completion_task_date_idx" ON "habit_completion" ("task_id", "date");
`;

try {
  await sql.unsafe(migration);
  console.log("تم تطبيق migration جدول habit_completion بنجاح.");
} catch (e) {
  console.error("فشل تطبيق الـ migration:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
