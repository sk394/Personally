DO $$ BEGIN
 CREATE TYPE "public"."project_type" AS ENUM('loan', 'splitwise', 'general');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "project_type" "project_type" DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD COLUMN "notification_read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD COLUMN "notification_dismissed" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Update existing projects with appropriate project types based on associated data
-- Projects with loan records should be 'loan' type
UPDATE "project" 
SET "project_type" = 'loan' 
WHERE "id" IN (
    SELECT DISTINCT "project_id" 
    FROM "loan" 
    WHERE "project_id" IS NOT NULL
);--> statement-breakpoint

-- Projects with splitwise settings should be 'splitwise' type
UPDATE "project" 
SET "project_type" = 'splitwise' 
WHERE "id" IN (
    SELECT DISTINCT "project_id" 
    FROM "splitwise_setting" 
    WHERE "project_id" IS NOT NULL
);--> statement-breakpoint

-- Projects with expenses (but no loans) should be 'splitwise' type
UPDATE "project" 
SET "project_type" = 'splitwise' 
WHERE "id" IN (
    SELECT DISTINCT "project_id" 
    FROM "expense" 
    WHERE "project_id" IS NOT NULL
    AND "project_id" NOT IN (
        SELECT DISTINCT "project_id" 
        FROM "loan" 
        WHERE "project_id" IS NOT NULL
    )
);--> statement-breakpoint

-- Projects with balances (but no loans or expenses) should be 'splitwise' type
UPDATE "project" 
SET "project_type" = 'splitwise' 
WHERE "id" IN (
    SELECT DISTINCT "project_id" 
    FROM "balance" 
    WHERE "project_id" IS NOT NULL
    AND "project_id" NOT IN (
        SELECT DISTINCT "project_id" 
        FROM "loan" 
        WHERE "project_id" IS NOT NULL
    )
    AND "project_id" NOT IN (
        SELECT DISTINCT "project_id" 
        FROM "expense" 
        WHERE "project_id" IS NOT NULL
    )
);