/**
 * تشغيل migration جدول weight_history يدوياً (بديل عند فشل drizzle-kit push)
 * استخدم: pnpm db:migrate:weight
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
CREATE TABLE IF NOT EXISTS "weight_history" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "weight" double precision NOT NULL,
  "date" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "weight_history_user_date_idx" ON "weight_history" ("user_id", "date");
`;

try {
  await sql.unsafe(migration);
  console.log("تم تطبيق migration جدول weight_history بنجاح.");
} catch (e) {
  console.error("فشل تطبيق الـ migration:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
