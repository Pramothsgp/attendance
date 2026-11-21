ALTER TYPE "public"."payment_type" ADD VALUE 'saving';--> statement-breakpoint
ALTER TYPE "public"."payment_type" ADD VALUE 'saving_return';--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL;