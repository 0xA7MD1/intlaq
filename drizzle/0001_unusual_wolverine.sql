CREATE TABLE "habit_completion" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weight" double precision NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "calorie_entry" DROP CONSTRAINT "calorie_entry_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "meals" DROP CONSTRAINT "meals_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "time_sessions" DROP CONSTRAINT "time_sessions_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "time_sessions" DROP CONSTRAINT "time_sessions_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "habit_completion" ADD CONSTRAINT "habit_completion_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_history" ADD CONSTRAINT "weight_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_completion_task_date_idx" ON "habit_completion" USING btree ("task_id","date");--> statement-breakpoint
CREATE INDEX "weight_history_user_date_idx" ON "weight_history" USING btree ("user_id","date");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie_entry" ADD CONSTRAINT "calorie_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "calorie_entry_user_date_idx" ON "calorie_entry" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "meals_user_created_at_idx" ON "meals" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_sessions_user_id_idx" ON "time_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_sessions_task_id_idx" ON "time_sessions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");