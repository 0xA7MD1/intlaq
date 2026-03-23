/**
 * سكريبت لحذف كافة جلسات التركيز السابقة (تنظيف البيانات الخاطئة)
 * استخدم: pnpm db:clear:focus
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

try {
  console.log("بدء عملية تنظيف قاعدة البيانات...");
  await sql`DELETE FROM "time_sessions"`;
  await sql`DELETE FROM "weight_history"`;
  await sql`DELETE FROM "calorie_entry"`;
  await sql`DELETE FROM "meals"`;
  await sql`DELETE FROM "habit_completion"`;
  console.log("تم حذف كافة البيانات (الجلسات، الوزن، السعرات، الوجبات، العادات) بنجاح! قاعدة البيانات الآن نظيفة.");
} catch (e) {
  console.error("فشل عملية التنظيف:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
