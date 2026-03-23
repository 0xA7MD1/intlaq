import { type Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

export default {
  schema: "./src/server/db/schema.ts", // تأكد أن ملف السكيما موجود في هذا المسار
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // للـ Supabase: استخدم Connection string من Dashboard → Project Settings → Database
} satisfies Config;