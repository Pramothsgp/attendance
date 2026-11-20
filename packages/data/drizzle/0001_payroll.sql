CREATE TYPE "public"."attendance_status" AS ENUM('full', 'half', 'leave');--> statement-breakpoint
CREATE TYPE "public"."pay_type" AS ENUM('daily', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('salary', 'bonus', 'advance');--> statement-breakpoint
CREATE TABLE "attendance" (
	"employee_id" integer NOT NULL,
	"day" date NOT NULL,
	"status" "attendance_status" NOT NULL,
	"earned" numeric(14, 4) NOT NULL,
	CONSTRAINT "attendance_employee_id_day_pk" PRIMARY KEY("employee_id","day")
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"pay_type" "pay_type" NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"day" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" "payment_type" DEFAULT 'salary' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_day_idx" ON "attendance" USING btree ("day");--> statement-breakpoint
CREATE INDEX "payment_employee_day_idx" ON "payment" USING btree ("employee_id","day");