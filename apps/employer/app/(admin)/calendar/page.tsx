import { isMonth, money, PAYMENT_LABEL, today, shortDate } from "@repo/data/pay";
import { activeEmployees, attendanceFor, paymentsIn, summaries } from "@repo/data/payroll";
import { Button, cn, MonthCalendar, MonthNav, Panel, PayStrip, StatusKey } from "@repo/ui";
import Link from "next/link";
import { markAttendance } from "@/app/actions";

export default async function Calendar({ searchParams }: { searchParams: Promise<{ month?: string; employee?: string }> }) {
  const sp = await searchParams;
  const now = today();
  const month = isMonth(sp.month) ? sp.month : now.slice(0, 7);
  const people = await activeEmployees();
  if (people.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="mb-3 text-muted-foreground">The calendar fills in once you add people and mark attendance.</p>
        <Button asChild>
          <Link href="/employees">Add employees</Link>
        </Button>
      </div>
    );
  }
  const picked = people.find((p) => p.id === Number(sp.employee)) ?? people[0]!;
  const [[me], paid] = await Promise.all([summaries(month, picked.id), paymentsIn(month, picked.id)]);
  const days = await attendanceFor(picked.id, month, me ? me.paidTotal - me.openingBalance : 0);

  return (
    <>
      <nav aria-label="Choose a person" className="-mx-4 overflow-x-auto px-4 pb-1">
        <ul className="flex w-max gap-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/calendar?employee=${p.id}&month=${month}`}
                aria-current={p.id === picked.id ? "true" : undefined}
                className={cn(
                  "block rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap",
                  p.id === picked.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{picked.name}</h1>
          <p className="text-sm text-muted-foreground">
            {money(Number(picked.rate))} per {picked.payType === "daily" ? "day" : "month (30 days)"}
          </p>
        </div>
        <MonthNav month={month} path="/calendar" query={{ employee: String(picked.id) }} />
      </div>

      {me && (
        <PayStrip
          opening={me.opening}
          earned={me.earnedMonth}
          salary={me.salaryMonth}
          advance={me.advanceMonth}
          saved={me.savingMonth}
          bonus={me.bonusMonth}
          savings={me.savings}
        />
      )}

      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusKey />
          <span className="text-sm text-muted-foreground">
            {me ? `${me.full} full, ${me.half} half, ${me.leave} leave` : ""}
          </span>
        </div>
        <MonthCalendar
          month={month}
          today={now}
          employeeId={picked.id}
          action={markAttendance}
          days={days}
          payments={paid.filter((p) => p.type !== "saving").map((p) => ({ day: p.day, amount: Number(p.amount), label: PAYMENT_LABEL[p.type] }))}
        />
        <p className="text-xs text-muted-foreground">Tap a day to mark or change it.</p>
      </Panel>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payments this month</h2>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/payments?employee=${picked.id}`}>Pay {picked.name.split(" ")[0]}</Link>
          </Button>
        </div>
        {paid.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Nothing paid in this month yet.</p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {paid.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium">{PAYMENT_LABEL[p.type]}</div>
                  <div className="text-xs text-muted-foreground">
                    {shortDate(p.day)}
                    {p.note ? `, ${p.note}` : ""}
                  </div>
                </div>
                <div className="font-display font-semibold tabular-nums">{money(Number(p.amount))}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
