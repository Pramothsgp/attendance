"use server";

import { db } from "@repo/data";
import { dayEarning, isDay, PAY_TYPES, PAYMENT_TYPES, STATUSES, type PayType, type PaymentType, type Status } from "@repo/data/pay";
import { attendance, employee, payment } from "@repo/data/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "@repo/auth/next";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Server actions are public endpoints: every one checks for an admin itself.
function guard() {
  return requireAdmin(auth());
}

function text(form: FormData, key: string, max = 200): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function positive(form: FormData, key: string): number {
  const n = Number(form.get(key));
  if (!Number.isFinite(n) || n <= 0 || n > 1e9) throw new Error(`${key} must be a positive amount`);
  return Math.round(n * 100) / 100;
}

function id(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid id");
  return n;
}

function oneOf<T extends string>(list: readonly T[], value: FormDataEntryValue | null, name: string): T {
  if (!list.includes(value as T)) throw new Error(`Invalid ${name}`);
  return value as T;
}

function day(form: FormData): string {
  const value = form.get("day");
  if (!isDay(value)) throw new Error("Invalid date");
  return value;
}

// Up to a month of days in one go, for marking a person across a week.
function days(form: FormData): string[] {
  const values = [...new Set(form.getAll("day"))];
  if (values.length === 0 || values.length > 31 || !values.every(isDay)) throw new Error("Invalid date");
  return values;
}

function employeeFields(form: FormData) {
  const name = text(form, "name");
  if (!name) throw new Error("Name is required");
  return {
    name,
    phone: text(form, "phone", 30) || null,
    payType: oneOf<PayType>(PAY_TYPES, form.get("payType"), "pay type"),
    rate: positive(form, "rate").toFixed(2),
  };
}

function done() {
  revalidatePath("/", "layout");
}

export async function createEmployee(form: FormData) {
  await guard();
  await db.insert(employee).values(employeeFields(form));
  done();
}

export async function updateEmployee(form: FormData) {
  await guard();
  await db.update(employee).set(employeeFields(form)).where(eq(employee.id, id(form.get("id"))));
  done();
}

export async function setActive(form: FormData) {
  await guard();
  await db
    .update(employee)
    .set({ active: form.get("active") === "true" })
    .where(eq(employee.id, id(form.get("id"))));
  done();
}

/** Deletes the employee with all their attendance and payments. */
export async function deleteEmployee(form: FormData) {
  await guard();
  await db.delete(employee).where(eq(employee.id, id(form.get("id"))));
  done();
}

/** Marks every selected active employee on every given day. status "clear" removes the marks. */
export async function markAttendance(form: FormData) {
  await guard();
  const dates = days(form);
  const ids = [...new Set(form.getAll("ids").map(id))];
  if (ids.length === 0) return;
  const choice = form.get("status");

  if (choice === "clear") {
    await db.delete(attendance).where(and(inArray(attendance.day, dates), inArray(attendance.employeeId, ids)));
    return done();
  }

  const status = oneOf<Status>(STATUSES, choice, "status");
  const people = await db
    .select({ id: employee.id, payType: employee.payType, rate: employee.rate })
    .from(employee)
    .where(and(inArray(employee.id, ids), eq(employee.active, true)))
    .limit(ids.length);
  if (people.length === 0) return;

  await db
    .insert(attendance)
    .values(
      people.flatMap((p) =>
        dates.map((date) => ({
          employeeId: p.id,
          day: date,
          status,
          earned: dayEarning(p.payType, Number(p.rate), status).toFixed(4),
        })),
      ),
    )
    .onConflictDoUpdate({
      target: [attendance.employeeId, attendance.day],
      set: { status: sql`excluded.status`, earned: sql`excluded.earned` },
    });
  done();
}

/** Any amount, any day: payments are not capped by what has been earned. */
export async function addPayment(form: FormData) {
  await guard();
  await db.insert(payment).values({
    employeeId: id(form.get("employeeId")),
    day: day(form),
    amount: positive(form, "amount").toFixed(2),
    type: oneOf<PaymentType>(PAYMENT_TYPES, form.get("type") || "salary", "payment type"),
    note: text(form, "note") || null,
  });
  done();
}

export async function deletePayment(form: FormData) {
  await guard();
  await db.delete(payment).where(eq(payment.id, id(form.get("id"))));
  done();
}

/** Links a sign-in account to an employee (employeeId "none" unlinks it). */
export async function linkUser(form: FormData) {
  await guard();
  const userId = text(form, "userId", 100);
  if (!userId) throw new Error("Invalid user");
  const target = form.get("employeeId");
  await db.transaction(async (tx) => {
    await tx.update(employee).set({ userId: null }).where(eq(employee.userId, userId));
    if (target && target !== "none") await tx.update(employee).set({ userId }).where(eq(employee.id, id(target)));
  });
  done();
}

/** Gives or takes away employer (admin) access. Goes through the admin plugin, which checks the caller again. */
export async function setRole(form: FormData) {
  const session = await guard();
  const userId = text(form, "userId", 100);
  const role = oneOf(["admin", "user"] as const, form.get("role"), "role");
  if (userId === session.user.id) throw new Error("You can't change your own access");
  await auth().api.setRole({ headers: await headers(), body: { userId, role } });
  done();
}
