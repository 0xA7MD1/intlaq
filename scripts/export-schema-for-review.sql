-- ============================================================
-- تشغيل هذا الملف في Neon SQL Editor ثم نسخ النتائج وإرسالها
-- Run in Neon → SQL Editor → paste each section or full file → Run
-- ============================================================

-- (1) الجداول والأعمدة - Tables & Columns
SELECT
  c.table_name AS "table",
  c.column_name AS "column",
  c.data_type AS "type",
  c.character_maximum_length AS "max_len",
  c.is_nullable AS "nullable",
  c.column_default AS "default"
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_catalog = current_database()
ORDER BY c.table_name, c.ordinal_position;


-- (2) المفاتيح الأساسية - Primary Keys
SELECT
  tc.table_name AS "table",
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS "primary_key"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name
ORDER BY tc.table_name;


-- (3) المفاتيح الأجنبية - Foreign Keys
SELECT
  tc.table_name AS "from_table",
  kcu.column_name AS "from_column",
  ccu.table_name AS "to_table",
  ccu.column_name AS "to_column",
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;


-- (4) الفهارس - Indexes (غير التابعة لـ PK/Unique)
SELECT
  schemaname AS "schema",
  tablename AS "table",
  indexname AS "index_name",
  indexdef AS "definition"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- (5) Unique constraints
SELECT
  tc.table_name AS "table",
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS "unique_columns",
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;


-- (6) ملخص سريع: أسماء الجداول فقط (للتأكد من الموجود)
SELECT table_name AS "table"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
