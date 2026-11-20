// Pure pay rules, shared by both apps and the queries.
export const PAY_TYPES = ["daily", "monthly"] as const;
export const STATUSES = ["full", "half", "leave"] as const;
export const PAYMENT_TYPES = ["salary", "bonus", "advance"] as const;
export type PayType = (typeof PAY_TYPES)[number];
export type Status = (typeof STATUSES)[number];
export type PaymentType = (typeof PAYMENT_TYPES)[number];

const DAYS_IN_PAY_MONTH = 30;

/** What one marked day earns. Monthly salary is paid per day as salary / 30. */
export function dayEarning(type: PayType, rate: number, status: Status): number {
  const perDay = type === "daily" ? rate : rate / DAYS_IN_PAY_MONTH;
  const share = status === "full" ? 1 : status === "half" ? 0.5 : 0;
  return Math.round(perDay * share * 10_000) / 10_000; // matches numeric(14,4)
}

/** "2026-11" -> first and last day of that month as YYYY-MM-DD. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

// Dates are kept as plain YYYY-MM-DD in the business's time zone.
const TZ = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; // rejects 2026-02-31
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

/** "2026-11-15" -> "15 Nov" */
export function shortDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}
