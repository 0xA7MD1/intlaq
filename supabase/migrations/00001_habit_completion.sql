-- جدول حالة العادة لكل يوم (مكتمل / فشل / فارغ)
CREATE TABLE IF NOT EXISTS "habit_completion" (
  "id" text PRIMARY KEY,
  "task_id" text NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "status" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "habit_completion_task_date_idx" ON "habit_completion" ("task_id", "date");
