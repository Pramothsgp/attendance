import { isMonth, money, today } from "@repo/data/pay";
import { attendanceOn, summaries } from "@repo/data/payroll";
import { MonthPicker, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";

export default async function Summary({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : today().slice(0, 7);
  const [rows, marks] = await Promise.all([summaries(month), attendanceOn(today())]);

  const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((t, r) => t + pick(r), 0);
  const due = sum((r) => Math.max(r.balance, 0));
  const owed = sum((r) => Math.max(-r.balance, 0));
  const todayCounts = { full: 0, half: 0, leave: 0 };
  for (const r of rows) {
    const s = marks.get(r.id);
    if (s) todayCounts[s]++;
  }
  const unmarked = rows.length - todayCounts.full - todayCounts.half - todayCounts.leave;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Summary</h1>
        <MonthPicker month={month} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active employees" value={rows.length} />
        <Stat label="Earned this month" value={money(sum((r) => r.earnedMonth))} />
        <Stat label="Salary paid this month" value={money(sum((r) => r.salaryMonth))} />
        <Stat label="Advances this month" value={money(sum((r) => r.advanceMonth))} />
        <Stat label="Bonus this month" value={money(sum((r) => r.bonusMonth))} />
        <Stat label="Still to pay (all time)" value={money(due)} tone={due > 0 ? "bad" : undefined} />
        <Stat label="Owed by workers" value={money(owed)} hint="Paid more than earned" />
        <Stat
          label="Today"
          value={`${todayCounts.full} / ${todayCounts.half} / ${todayCounts.leave}`}
          hint={`full / half / leave, ${unmarked} not marked`}
        />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead className="text-right">Full</TableHead>
              <TableHead className="text-right">Half</TableHead>
              <TableHead className="text-right">Leave</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Salary + advance</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {money(r.rate)} / {r.payType === "daily" ? "day" : "month"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.full}</TableCell>
                <TableCell className="text-right tabular-nums">{r.half}</TableCell>
                <TableCell className="text-right tabular-nums">{r.leave}</TableCell>
                <TableCell className="text-right tabular-nums">{money(r.earnedMonth)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(r.salaryMonth + r.advanceMonth)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(r.bonusMonth)}</TableCell>
                <TableCell className={`text-right font-medium tabular-nums ${r.balance < 0 ? "text-red-600" : ""}`}>
                  {money(r.balance)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No active employees. Add some on the Employees page.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Columns are for the chosen month. Balance is all time: everything earned minus salary and advances paid. A negative
        balance means the worker has been paid ahead. Bonus does not reduce the balance.
      </p>
    </>
  );
}
