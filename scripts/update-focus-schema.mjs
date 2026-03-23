/**
 * سكريبت هجرة لإضافة حقل type لجدول time_sessions
 * استخدم: pnpm db:migrate:focus
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
ALTER TABLE "time_sessions" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'focus';
`;

try {
  await sql.unsafe(migration);
  console.log("تم تحديث جدول time_sessions بنجاح.");
} catch (e) {
  console.error("فشل التحديث:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
