import { isMonth, money, today, shortDate } from "@repo/data/pay";
import { paymentsIn, summaries } from "@repo/data/payroll";
import { Input, Label, MonthNav, Panel, Picker } from "@repo/ui";
import { addPayment, deletePayment } from "@/app/actions";
import { ConfirmButton, SubmitButton } from "@/components/client";

const TYPE_STYLE = {
  salary: "bg-secondary text-secondary-foreground",
  bonus: "bg-present/15 text-present",
  advance: "bg-half/15 text-half",
} as const;
const TYPE_LABEL = { salary: "Salary", bonus: "Bonus", advance: "Advance" } as const;

export default async function Payments({ searchParams }: { searchParams: Promise<{ month?: string; employee?: string }> }) {
  const sp = await searchParams;
  const month = isMonth(sp.month) ? sp.month : today().slice(0, 7);
  const [people, rows] = await Promise.all([summaries(month), paymentsIn(month)]);
  const total = (type: string) => rows.filter((r) => r.type === type).reduce((t, r) => t + Number(r.amount), 0);
  const preselect = people.some((p) => p.id === Number(sp.employee)) ? sp.employee : "";

  return (
    <>
      <h1 className="text-2xl font-bold">Pay someone</h1>
      <Panel>
        <form action={addPayment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="employeeId">Who</Label>
            <Picker
              id="employeeId"
              name="employeeId"
              required
              defaultValue={preselect}
              placeholder="Choose a person"
              options={people.map((p) => ({
                value: String(p.id),
                label: p.name,
                hint: p.balance >= 0 ? `${money(p.balance)} to pay` : `${money(-p.balance)} paid ahead`,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required className="h-11 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Picker
              id="type"
              name="type"
              defaultValue="salary"
              options={[
                { value: "salary", label: "Salary" },
                { value: "advance", label: "Advance or loan" },
                { value: "bonus", label: "Bonus" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="day">Date</Label>
            <Input id="day" name="day" type="date" required defaultValue={today()} className="h-11 text-base" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" maxLength={200} placeholder="Optional" className="h-11 text-base" />
          </div>
          <SubmitButton size="lg" className="self-end rounded-xl">
            Save payment
          </SubmitButton>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Salary and advances count against what someone has earned, with no limit. Paying more than earned leaves them paid
          ahead, and later work pays it off. Bonus is extra and doesn&apos;t change what they&apos;re owed.
        </p>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Paid in</h2>
        <MonthNav month={month} path="/payments" />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {(["salary", "advance", "bonus"] as const).map((t) => (
          <div key={t} className="rounded-2xl border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{TYPE_LABEL[t]}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">{money(total(t))}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No payments in this month.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{r.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[r.type]}`}>{TYPE_LABEL[r.type]}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {shortDate(r.day)}
                  {r.note ? `, ${r.note}` : ""}
                </div>
              </div>
              <div className="font-display font-semibold tabular-nums">{money(Number(r.amount))}</div>
              <form action={deletePayment}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton variant="ghost" size="sm" message={`Delete this ${r.type} of ${money(Number(r.amount))} for ${r.name}?`}>
                  Delete
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
