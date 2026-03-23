# إعداد Supabase للمشروع

المشروع يستخدم **Supabase** كقاعدة بيانات (PostgreSQL) بدلاً من Neon.

## 1. إنشاء مشروع Supabase

1. ادخل [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً.
2. من **Project Settings** → **Database** انسخ **Connection string**.
3. استخدم نوع **Connection pooling** (وضع **Transaction**) لأن المشروع يعمل على Serverless (مثل Vercel).
   - البورت يكون `6543` في رابط الـ pooler.

## 2. متغيرات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم. أهم متغير لـ Supabase:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

- استبدل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات (من نفس صفحة Database).
- الرابط يكون جاهزاً في لوحة Supabase تحت "Connection string" → "URI" مع تفعيل "Use connection pooling".

## 3. تطبيق الجداول على Supabase

**الطريقة الأولى (موصى بها):** من المشروع عبر Drizzle:

```bash
pnpm drizzle-kit push
```

**الطريقة الثانية:** تشغيل الـ migration يدوياً في Supabase:

1. افتح Supabase → **SQL Editor**.
2. انسخ محتوى الملف `supabase/migrations/00000_initial_schema.sql`.
3. الصق في المحرر ثم **Run**.

**إذا ظهر خطأ في `drizzle-kit push`** (مثل `Cannot read properties of undefined (reading 'replace')`): هذه مشكلة معروفة مع قيود CHECK في Supabase. استخدم أحد الخيارين:
- تشغيل الـ migrations يدوياً من مجلد `supabase/migrations/` في SQL Editor.
- أو تشغيل سكريبت المشروع: `pnpm db:migrate:habit` لإضافة جدول العادات فقط (بعد أن تكون الجداول الأساسية موجودة).

بعدها ضع بقية متغيرات البيئة (Better Auth، Polar، Cloudinary، Gemini) كما في `.env.example`.
