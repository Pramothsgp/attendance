import { isMonth, money, PAYMENT_LABEL, PAYMENT_TYPES, today, shortDate } from "@repo/data/pay";
import { paymentsIn, summaries } from "@repo/data/payroll";
import { cn, MonthNav, Panel } from "@repo/ui";
import Link from "next/link";
import { addPayment, deletePayment } from "@/app/actions";
import { ConfirmButton } from "@/components/client";
import { PaymentForm } from "@/components/payment-form";

const TYPE_STYLE = {
  salary: "bg-secondary text-secondary-foreground",
  bonus: "bg-present/15 text-present",
  advance: "bg-half/15 text-half",
  saving: "bg-primary/10 text-primary",
  saving_return: "bg-primary/10 text-primary",
} as const;

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
        <PaymentForm
          people={people.map((p) => ({ id: p.id, name: p.name, balance: p.balance, savings: p.savings }))}
          preselect={preselect ? Number(preselect) : undefined}
          today={today()}
          action={addPayment}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Salary, advances and money put into savings count against what someone has earned, with no limit. Paying more than
          earned leaves them paid ahead, and later work pays it off. Bonus is extra and doesn&apos;t change what they&apos;re owed.
          Giving savings back only lowers the savings held for them.
        </p>
      </Panel>


      {people.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Who to pay</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {people
              .toSorted((x, y) => y.balance - x.balance)
              .map((p) => (
                <li key={p.id} className={cn("flex items-center gap-3 px-4 py-3", String(p.id) === preselect && "bg-secondary/60")}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className={cn("text-sm", p.balance > 0 ? "text-muted-foreground" : "text-present")}>
                      {p.balance > 0 ? `${money(p.balance)} to pay` : p.balance < 0 ? `${money(-p.balance)} paid ahead` : "All paid"}
                    </div>
                    {p.savings > 0 && <div className="text-xs text-primary">Savings held: {money(p.savings)}</div>}
                  </div>
                  <Link
                    href={`/payments?employee=${p.id}&month=${month}#pay`}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Pay
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Paid in</h2>
        <MonthNav month={month} path="/payments" />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {PAYMENT_TYPES.filter((t) => t === "salary" || t === "advance" || t === "bonus" || total(t) > 0).map((t) => (
          <div key={t} className="rounded-2xl border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{PAYMENT_LABEL[t]}</dt>
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
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[r.type]}`}>{PAYMENT_LABEL[r.type]}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {shortDate(r.day)}
                  {r.note ? `, ${r.note}` : ""}
                </div>
              </div>
              <div className="font-display font-semibold tabular-nums">{money(Number(r.amount))}</div>
              <form action={deletePayment}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton variant="ghost" size="sm" message={`Delete this ${PAYMENT_LABEL[r.type].toLowerCase()} payment of ${money(Number(r.amount))} for ${r.name}?`}>
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
