import { isMonth, money, today } from "@repo/data/pay";
import { SignOutButton } from "@repo/auth/components";
import { requireSession } from "@repo/auth/next";
import { attendanceFor, employeeForUser, paymentsIn, summaries } from "@repo/data/payroll";
import { Badge, MonthPicker, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { auth } from "@/lib/auth";

const LABEL = { full: "Full day", half: "Half day", leave: "Leave" } as const;
const TONE = { full: "default", half: "outline", leave: "destructive" } as const;

export default async function Me({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await requireSession(auth());
  // Only ever the employee linked to this account; there is no id in the URL to change.
  const linked = await employeeForUser(session.user.id);
  if (!linked) {
    return (
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h1 className="text-xl font-bold">Hi {session.user.name}</h1>
        <p className="text-muted-foreground">
          Your account ({session.user.email}) isn&apos;t linked to an employee yet. Ask your employer to link it, then
          reload this page.
        </p>
        <SignOutButton />
      </div>
    );
  }
  const id = linked.id;
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : today().slice(0, 7);

  const [[me], days, paid] = await Promise.all([summaries(month, id), attendanceFor(id, month), paymentsIn(month, id)]);
  if (!me) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{me.name}</h1>
          <p className="text-sm text-muted-foreground">
            {money(me.rate)} per {me.payType === "daily" ? "day" : "month (30 days)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker month={month} />
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Days this month" value={`${me.full} / ${me.half} / ${me.leave}`} hint="full / half / leave" />
        <Stat label="Earned this month" value={money(me.earnedMonth)} />
        <Stat label="Received this month" value={money(me.salaryMonth + me.advanceMonth)} hint="salary + advance" />
        <Stat label="Bonus this month" value={money(me.bonusMonth)} />
        <Stat
          label={me.balance >= 0 ? "Still to receive" : "Paid ahead"}
          value={money(Math.abs(me.balance))}
          hint="All time"
          tone={me.balance >= 0 ? "good" : "bad"}
        />
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Attendance</h2>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableBody>
              {days.map((d) => (
                <TableRow key={d.day}>
                  <TableCell className="tabular-nums">{d.day}</TableCell>
                  <TableCell>
                    <Badge variant={TONE[d.status]}>{LABEL[d.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(Number(d.earned))}</TableCell>
                </TableRow>
              ))}
              {days.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-muted-foreground">Nothing marked in {month}.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Money received</h2>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paid.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="tabular-nums">{p.day}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell className="text-muted-foreground">{p.note}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(Number(p.amount))}</TableCell>
                </TableRow>
              ))}
              {paid.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No payments in {month}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
