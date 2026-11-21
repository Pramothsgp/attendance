// Read queries shared by the employer and employee apps.
import { and, asc, desc, eq, getTableColumns, gte, lte, sql } from "drizzle-orm";
import { db } from "./client.ts";
import { monthRange, type PayType } from "./pay.ts";
import { attendance, employee, payment, user } from "./schema/index.ts";

const MAX_EMPLOYEES = 1000;
const MAX_ROWS = 1000;

export type EmployeeSummary = {
  id: number;
  name: string;
  phone: string | null;
  payType: PayType;
  rate: number;
  full: number;
  half: number;
  leave: number;
  earnedMonth: number;
  salaryMonth: number;
  advanceMonth: number;
  savingMonth: number; // kept aside into savings this month
  bonusMonth: number;
  openingBalance: number; // owed from before the app; negative means they owed
  earnedTotal: number;
  salaryTotal: number;
  advanceTotal: number;
  paidTotal: number; // salary + advance + savings kept, all time
  bonusTotal: number;
  savings: number; // kept aside minus given back: what is held for them
  balance: number; // openingBalance + earnedTotal - paidTotal; negative means paid ahead
  opening: number; // still to pay at the start of the month
};

/** Month figures plus the all-time balance, for active employees (or one employee). */
export async function summaries(month: string, employeeId?: number): Promise<EmployeeSummary[]> {
  const { from, to } = monthRange(month);
  const inMonth = sql`day between ${from} and ${to}`;
  const before = sql`day < ${from}`;
  const filter = employeeId === undefined ? sql`e.active` : sql`e.id = ${employeeId} and e.active`;
  const { rows } = await db.execute(sql`
    select e.id, e.name, e.phone, e.pay_type, e.rate, e.opening_balance,
      coalesce(a.full_days, 0) as full_days, coalesce(a.half_days, 0) as half_days, coalesce(a.leave_days, 0) as leave_days,
      coalesce(a.earned_month, 0) as earned_month, coalesce(a.earned_total, 0) as earned_total,
      coalesce(p.salary_month, 0) as salary_month, coalesce(p.advance_month, 0) as advance_month,
      coalesce(p.saving_month, 0) as saving_month, coalesce(p.bonus_month, 0) as bonus_month,
      coalesce(p.salary_total, 0) as salary_total, coalesce(p.advance_total, 0) as advance_total,
      coalesce(p.paid_total, 0) as paid_total, coalesce(p.bonus_total, 0) as bonus_total,
      coalesce(p.savings, 0) as savings,
      e.opening_balance + coalesce(a.earned_before, 0) - coalesce(p.paid_before, 0) as opening
    from employee e
    left join (
      select employee_id,
        count(*) filter (where status = 'full' and ${inMonth}) as full_days,
        count(*) filter (where status = 'half' and ${inMonth}) as half_days,
        count(*) filter (where status = 'leave' and ${inMonth}) as leave_days,
        sum(earned) filter (where ${inMonth}) as earned_month,
        sum(earned) as earned_total,
        sum(earned) filter (where ${before}) as earned_before
      from attendance group by employee_id
    ) a on a.employee_id = e.id
    left join (
      select employee_id,
        sum(amount) filter (where type = 'salary' and ${inMonth}) as salary_month,
        sum(amount) filter (where type = 'advance' and ${inMonth}) as advance_month,
        sum(amount) filter (where type = 'saving' and ${inMonth}) as saving_month,
        sum(amount) filter (where type = 'bonus' and ${inMonth}) as bonus_month,
        sum(amount) filter (where type = 'salary') as salary_total,
        sum(amount) filter (where type = 'advance') as advance_total,
        sum(amount) filter (where type in ('salary', 'advance', 'saving')) as paid_total,
        sum(amount) filter (where type = 'bonus') as bonus_total,
        sum(case type when 'saving' then amount when 'saving_return' then -amount else 0 end) as savings,
        sum(amount) filter (where type in ('salary', 'advance', 'saving') and ${before}) as paid_before
      from payment group by employee_id
    ) p on p.employee_id = e.id
    where ${filter}
    order by e.name
    limit ${MAX_EMPLOYEES}
  `);
  return rows.map((r) => {
    const earnedTotal = Number(r.earned_total);
    const paidTotal = Number(r.paid_total);
    const openingBalance = Number(r.opening_balance);
    return {
      id: Number(r.id),
      name: String(r.name),
      phone: (r.phone as string | null) ?? null,
      payType: r.pay_type as PayType,
      rate: Number(r.rate),
      full: Number(r.full_days),
      half: Number(r.half_days),
      leave: Number(r.leave_days),
      earnedMonth: Number(r.earned_month),
      salaryMonth: Number(r.salary_month),
      advanceMonth: Number(r.advance_month),
      savingMonth: Number(r.saving_month),
      bonusMonth: Number(r.bonus_month),
      openingBalance,
      earnedTotal,
      salaryTotal: Number(r.salary_total),
      advanceTotal: Number(r.advance_total),
      paidTotal,
      bonusTotal: Number(r.bonus_total),
      savings: Number(r.savings),
      balance: Math.round((openingBalance + earnedTotal - paidTotal) * 100) / 100,
      opening: Math.round(Number(r.opening) * 100) / 100,
    };
  });
}

/** Everyone, working first, with the email of the login linked to them (if any). */
export function listEmployees() {
  return db
    .select({ ...getTableColumns(employee), email: user.email })
    .from(employee)
    .leftJoin(user, eq(user.id, employee.userId))
    .orderBy(desc(employee.active), asc(employee.name))
    .limit(MAX_EMPLOYEES);
}

export function activeEmployees() {
  return db.select().from(employee).where(eq(employee.active, true)).orderBy(asc(employee.name)).limit(MAX_EMPLOYEES);
}

export async function getEmployee(id: number) {
  const [row] = await db.select().from(employee).where(eq(employee.id, id)).limit(1);
  return row;
}

/** Attendance for one day, keyed by employee id. */
export async function attendanceOn(day: string) {
  const rows = await db.select().from(attendance).where(eq(attendance.day, day)).limit(MAX_EMPLOYEES);
  return new Map(rows.map((r) => [r.employeeId, r.status]));
}

/** One person's attendance between two days (inclusive), keyed by day. */
export async function attendanceBetween(employeeId: number, from: string, to: string) {
  const rows = await db
    .select({ day: attendance.day, status: attendance.status })
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), gte(attendance.day, from), lte(attendance.day, to)))
    .limit(31);
  return new Map(rows.map((r) => [r.day, r.status]));
}

export function attendanceFor(employeeId: number, month: string) {
  const { from, to } = monthRange(month);
  return db
    .select()
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), gte(attendance.day, from), lte(attendance.day, to)))
    .orderBy(asc(attendance.day))
    .limit(31);
}

/** Payments in a month, newest first, optionally for one employee. */
export function paymentsIn(month: string, employeeId?: number) {
  const { from, to } = monthRange(month);
  return db
    .select({
      id: payment.id,
      employeeId: payment.employeeId,
      name: employee.name,
      day: payment.day,
      amount: payment.amount,
      type: payment.type,
      note: payment.note,
    })
    .from(payment)
    .innerJoin(employee, eq(employee.id, payment.employeeId))
    .where(
      and(
        gte(payment.day, from),
        lte(payment.day, to),
        employeeId === undefined ? undefined : eq(payment.employeeId, employeeId),
      ),
    )
    .orderBy(desc(payment.day), desc(payment.id))
    .limit(MAX_ROWS);
}

/** The active employee linked to a sign-in account, if any. */
export async function employeeForUser(userId: string) {
  const [row] = await db
    .select({ id: employee.id })
    .from(employee)
    .where(and(eq(employee.userId, userId), eq(employee.active, true)))
    .limit(1);
  return row;
}
