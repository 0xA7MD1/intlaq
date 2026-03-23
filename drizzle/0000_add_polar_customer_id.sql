DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user'
			AND column_name = 'polar_customer_id'
	) THEN
		ALTER TABLE "user" ADD COLUMN "polar_customer_id" text;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_polar_customer_id_idx" ON "user" USING btree ("polar_customer_id");