import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

/** Sets the theme class before first paint, so dark mode never flashes light. */
export function ThemeScript() {
  const js = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

/** A surface for grouping content. Quiet: a hairline border, no shadow. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)} {...props} />;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (n: number) => inr.format(Math.round(n));

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Previous / next month links around the month name. `query` keeps other params (e.g. employee). */
export function MonthNav({ month, path, query = {} }: { month: string; path: string; query?: Record<string, string> }) {
  const href = (m: string) => `${path}?${new URLSearchParams({ ...query, month: m })}`;
  const arrow = "grid size-10 place-items-center rounded-full border bg-card hover:bg-muted";
  return (
    <div className="flex items-center gap-2">
      <a href={href(shiftMonth(month, -1))} className={arrow} aria-label="Previous month">
        <ChevronLeft className="size-5" />
      </a>
      <span className="min-w-36 text-center font-display text-lg font-semibold">{monthLabel(month)}</span>
      <a href={href(shiftMonth(month, 1))} className={arrow} aria-label="Next month">
        <ChevronRight className="size-5" />
      </a>
    </div>
  );
}

/**
 * The ledger line for a month: carried in + earned - salary - advance - savings kept = still to pay.
 * Each kind of payment is its own line, so an advance shows as paid ahead rather than vanishing into "paid".
 */
export function PayStrip({
  opening,
  earned,
  salary,
  advance = 0,
  saved = 0,
  bonus,
  savings,
  worker = false,
}: {
  opening: number;
  earned: number;
  salary: number;
  advance?: number;
  /** Kept aside into savings this month. */
  saved?: number;
  bonus?: number;
  /** Savings held for them in all (kept aside minus given back). */
  savings?: number;
  /** Word it for the person being paid ("to receive") instead of the employer ("to pay"). */
  worker?: boolean;
}) {
  const owed = opening + earned;
  const paid = salary + advance + saved;
  const due = owed - paid;
  const share = owed > 0 ? Math.min(100, Math.max(0, (paid / owed) * 100)) : paid > 0 ? 100 : 0;
  return (
    <Panel className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{due >= 0 ? (worker ? "Still to receive" : "Still to pay") : worker ? "Received ahead" : "Paid ahead"}</div>
          <div className={cn("font-display text-4xl font-bold tabular-nums", due > 0 ? "text-foreground" : "text-present")}>
            {rupees(Math.abs(due))}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {rupees(paid)} {worker ? "received" : "paid"} of {rupees(Math.max(owed, 0))}
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${Math.round(share)}% paid`}>
        <div className="h-full rounded-full bg-present transition-[width] duration-500" style={{ width: `${share}%` }} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Figure label={opening >= 0 ? "Carried in" : worker ? "Received ahead before" : "Paid ahead before"} value={rupees(Math.abs(opening))} />
        <Figure label="Earned" value={`+ ${rupees(earned)}`} />
        <Figure label={worker ? "Salary received" : "Salary paid"} value={`− ${rupees(salary)}`} />
        {advance > 0 && <Figure label="Advance (paid ahead)" value={`− ${rupees(advance)}`} />}
        {saved > 0 && <Figure label="Kept in savings" value={`− ${rupees(saved)}`} />}
      </dl>
      {bonus ? <p className="text-sm text-muted-foreground">Bonus this month: {rupees(bonus)} (extra, not counted above)</p> : null}
      {savings ? <p className="text-sm text-muted-foreground">Savings held{worker ? " for you" : ""}: {rupees(savings)}</p> : null}
    </Panel>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** One figure with a label. */
export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", tone === "good" && "text-present", tone === "bad" && "text-leave")}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Coloured swatch + label, matching how the calendar draws each state. */
export function StatusKey() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-present" />Full day</li>
      <li className="flex items-center gap-1.5"><span className="size-3 rounded border-2 border-half bg-[linear-gradient(135deg,hsl(var(--half))_50%,transparent_50%)]" />Half day</li>
      <li className="flex items-center gap-1.5"><span className="size-3 rounded border-2 border-leave" />Leave</li>
      <li className="flex items-center gap-1.5"><Check className="size-3.5 text-present" strokeWidth={3} />Day paid for</li>
      <li className="flex items-center gap-1.5"><span className="rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground">₹</span>Payment made</li>
    </ul>
  );
}
