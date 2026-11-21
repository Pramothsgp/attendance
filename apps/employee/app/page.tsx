import { SignOutButton } from "@repo/auth/components";
import { requireSession } from "@repo/auth/next";
import { isMonth, money, PAYMENT_LABEL, today, shortDate } from "@repo/data/pay";
import { attendanceFor, employeeForUser, paymentsIn, summaries } from "@repo/data/payroll";
import { InstallHint, MonthCalendar, MonthNav, Panel, PayStrip, StatusKey } from "@repo/ui";
import { auth } from "@/lib/auth";

export default async function Me({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await requireSession(auth());
  // Only ever the employee linked to this account; there is no id in the URL to change.
  const linked = await employeeForUser(session.user.id);
  if (!linked) {
    return (
      <Panel className="space-y-4">
        <h1 className="text-2xl font-bold">Hi {session.user.name}</h1>
        <p className="text-muted-foreground">
          Your account ({session.user.email}) isn&apos;t linked to your work record yet. Ask your employer to link it, then
          open this page again.
        </p>
        <SignOutButton />
      </Panel>
    );
  }
  const id = linked.id;
  const now = today();
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : now.slice(0, 7);

  const [[me], paid] = await Promise.all([summaries(month, id), paymentsIn(month, id)]);
  if (!me) return null;
  const days = await attendanceFor(id, month, me.paidTotal - me.openingBalance);

  return (
    <>
      <InstallHint appName="My pay" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hi {me.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">
            {money(me.rate)} per {me.payType === "daily" ? "day" : "month (30 days)"}
          </p>
        </div>
        <MonthNav month={month} path="/" />
      </div>

      <PayStrip
        opening={me.opening}
        earned={me.earnedMonth}
        salary={me.salaryMonth}
        advance={me.advanceMonth}
        saved={me.savingMonth}
        bonus={me.bonusMonth}
        savings={me.savings}
        worker
      />

      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusKey />
          <span className="text-sm text-muted-foreground">
            {me.full} full, {me.half} half, {me.leave} leave
          </span>
        </div>
        <MonthCalendar
          month={month}
          today={now}
          days={days}
          payments={paid.filter((p) => p.type !== "saving").map((p) => ({ day: p.day, amount: Number(p.amount), label: PAYMENT_LABEL[p.type] }))}
        />
      </Panel>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Money received</h2>
        {paid.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Nothing received in this month yet.</p>
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

      <div className="pt-2">
        <SignOutButton />
      </div>
    </>
  );
}
