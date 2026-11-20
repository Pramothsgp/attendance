import { isMonth, money, today } from "@repo/data/pay";
import { paymentsIn, summaries } from "@repo/data/payroll";
import { Badge, Button, Input, Label, MonthPicker, NativeSelect, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { addPayment, deletePayment } from "@/app/actions";
import { ConfirmButton } from "@/components/client";

const TONE = { salary: "default", bonus: "secondary", advance: "destructive" } as const;

export default async function Payments({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : today().slice(0, 7);
  const [people, rows] = await Promise.all([summaries(month), paymentsIn(month)]);
  const total = (type: string) => rows.filter((r) => r.type === type).reduce((t, r) => t + Number(r.amount), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Payments</h1>
        <MonthPicker month={month} />
      </div>

      <form action={addPayment} className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-6 md:items-end">
        <div className="space-y-1 md:col-span-2">
          <Label>Employee</Label>
          <NativeSelect name="employeeId" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.balance >= 0 ? `due ${money(p.balance)}` : `paid ahead ${money(-p.balance)}`})
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label>Amount</Label>
          <Input name="amount" type="number" min="0.01" step="0.01" required />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <NativeSelect name="type" defaultValue="salary">
            <option value="salary">Salary</option>
            <option value="bonus">Bonus</option>
            <option value="advance">Advance / loan</option>
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input name="day" type="date" required defaultValue={today()} />
        </div>
        <Button type="submit">Add payment</Button>
        <div className="space-y-1 md:col-span-6">
          <Label>Note</Label>
          <Input name="note" maxLength={200} placeholder="Optional" />
        </div>
      </form>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Salary" value={money(total("salary"))} />
        <Stat label="Advance / loan" value={money(total("advance"))} />
        <Stat label="Bonus" value={money(total("bonus"))} />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums">{r.day}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <Badge variant={TONE[r.type]}>{r.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.note}</TableCell>
                <TableCell className="text-right tabular-nums">{money(Number(r.amount))}</TableCell>
                <TableCell className="text-right">
                  <form action={deletePayment}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmButton variant="ghost" size="sm" message="Delete this payment?">
                      Delete
                    </ConfirmButton>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No payments in {month}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Salary and advances count against what the worker has earned, with no cap: paying more than earned leaves a negative
        balance that later work pays off. Bonus is extra and does not change the balance.
      </p>
    </>
  );
}
