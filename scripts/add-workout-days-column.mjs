/**
 * إضافة عمود أيام التمرين إلى جدول workout_groups
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
  console.log("إضافة عمود days إلى workout_groups...");
  await sql.unsafe(`ALTER TABLE "workout_groups" ADD COLUMN IF NOT EXISTS "days" jsonb DEFAULT '[]';`);
  console.log("تمت الإضافة بنجاح!");
} catch (e) {
  console.error("فشل:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
