import { user } from "./auth.ts";
import { boolean, date, index, integer, numeric, pgEnum, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const payType = pgEnum("pay_type", ["daily", "monthly"]);
export const attendanceStatus = pgEnum("attendance_status", ["full", "half", "leave"]);
// advance = money given ahead of earnings (a debt). It counts against the balance like salary.
// saving = pay kept aside for the worker (counts against the balance, goes into their savings).
// saving_return = savings handed back (only lowers savings, not the balance).
export const paymentType = pgEnum("payment_type", ["salary", "bonus", "advance", "saving", "saving_return"]);

export const employee = pgTable("employee", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  payType: payType("pay_type").notNull(),
  // Daily wage, or monthly salary (a month counts as 30 days).
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
  // Owed from before the app was used: positive = owed to them, negative = they owe.
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  // Sign-in account that sees this employee in the employee app. One account per employee.
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendance = pgTable(
  "attendance",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    status: attendanceStatus("status").notNull(),
    // What the day earned at the rate in force when it was marked, so a later rate change
    // doesn't rewrite past pay. Four decimals so 30 days of monthly/30 add back to the salary.
    earned: numeric("earned", { precision: 14, scale: 4 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.employeeId, t.day] }), index("attendance_day_idx").on(t.day)],
);

export const payment = pgTable(
  "payment",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: paymentType("type").notNull().default("salary"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payment_employee_day_idx").on(t.employeeId, t.day)],
);
