import { money } from "@repo/data/pay";
import { listEmployees } from "@repo/data/payroll";
import { cn, Input, Label, Picker } from "@repo/ui";
import { ChevronDown, KeyRound } from "lucide-react";
import Link from "next/link";
import { createEmployee, deleteEmployee, setActive, updateEmployee } from "@/app/actions";
import { ConfirmButton, SubmitButton } from "@/components/client";

type Defaults = { name?: string; phone?: string | null; payType?: string; rate?: string; openingBalance?: string };

function EmployeeFields({ d = {}, prefix }: { d?: Defaults; prefix: string }) {
  const opening = Number(d.openingBalance ?? 0);
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input id={`${prefix}-name`} name="name" required maxLength={200} defaultValue={d.name} autoComplete="off" className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-phone`}>Phone (optional)</Label>
        <Input id={`${prefix}-phone`} name="phone" type="tel" inputMode="tel" maxLength={30} defaultValue={d.phone ?? ""} className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-pay`}>Paid by</Label>
        <Picker
          id={`${prefix}-pay`}
          name="payType"
          defaultValue={d.payType ?? "daily"}
          options={[
            { value: "daily", label: "Daily wage" },
            { value: "monthly", label: "Monthly salary", hint: "30-day month" },
          ]}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-rate`}>Amount per day or month (₹)</Label>
        <Input id={`${prefix}-rate`} name="rate" type="number" inputMode="decimal" min="0.01" step="0.01" required defaultValue={d.rate} className="h-11 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-opening`}>Opening balance (₹)</Label>
        <Input
          id={`${prefix}-opening`}
          name="opening"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0"
          defaultValue={opening ? String(Math.abs(opening)) : ""}
          className="h-11 text-base"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-owed`}>Opening balance is</Label>
        <Picker
          id={`${prefix}-owed`}
          name="openingOwedBy"
          defaultValue={opening < 0 ? "worker" : "employer"}
          options={[
            { value: "employer", label: "Owed to them", hint: "from before" },
            { value: "worker", label: "Owed by them", hint: "e.g. an old loan" },
          ]}
        />
      </div>
    </>
  );
}

export default async function Employees() {
  const people = await listEmployees();
  const active = people.filter((p) => p.active).length;

  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        <span className="text-sm text-muted-foreground">
          {active} working{people.length > active ? `, ${people.length - active} disabled` : ""}
        </span>
      </div>

      <Link
        href="/users"
        className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:bg-muted/60"
      >
        <KeyRound className="size-5 text-primary" />
        <span className="flex-1">
          <span className="block font-medium">Logins and access</span>
          <span className="text-sm text-muted-foreground">Link a worker&apos;s login to their record, or make someone an admin</span>
        </span>
      </Link>

      <details className="group rounded-2xl border bg-card" open={people.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
          Add a person
          <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
        </summary>
        <form action={createEmployee} className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
          <EmployeeFields prefix="new" />
          <SubmitButton size="lg" className="rounded-xl sm:col-span-2">
            Add person
          </SubmitButton>
        </form>
      </details>

      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className={cn("rounded-2xl border bg-card", !p.active && "opacity-60")}>
            <div className="flex items-center gap-3 p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-display font-semibold text-secondary-foreground">
                {p.name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  {money(Number(p.rate))} per {p.payType === "daily" ? "day" : "month"}
                  {p.phone ? `, ${p.phone}` : ""}
                </div>
                {Number(p.openingBalance) !== 0 && (
                  <div className="text-xs text-muted-foreground">
                    Opening balance: {money(Math.abs(Number(p.openingBalance)))} {Number(p.openingBalance) > 0 ? "owed to them" : "owed by them"}
                  </div>
                )}
                <Link href="/users" className={cn("text-xs", p.email ? "text-muted-foreground" : "text-primary")}>
                  {p.email ? `Login: ${p.email}` : "No login linked"}
                </Link>
              </div>
              <form action={setActive}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(!p.active)} />
                <button
                  type="submit"
                  role="switch"
                  aria-checked={p.active}
                  aria-label={`${p.name} is ${p.active ? "working" : "disabled"}`}
                  className={cn("relative h-7 w-12 rounded-full transition-colors", p.active ? "bg-present" : "bg-muted-foreground/40")}
                >
                  <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-all", p.active ? "left-6" : "left-1")} />
                </button>
              </form>
            </div>
            <details className="group border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm text-primary">
                Edit or delete
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <form action={updateEmployee} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={p.id} />
                  <EmployeeFields d={p} prefix={`e${p.id}`} />
                  <p className="text-xs text-muted-foreground sm:col-span-2">A new amount applies to days you mark from now on.</p>
                  <SubmitButton className="rounded-xl sm:col-span-2">Save changes</SubmitButton>
                </form>
                <form action={deleteEmployee}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton
                    variant="ghost"
                    className="w-full text-leave hover:bg-leave/10 hover:text-leave"
                    message={`Delete ${p.name} with all their attendance and payments? This can't be undone. To keep their history, switch them off instead.`}
                  >
                    Delete {p.name}
                  </ConfirmButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
      {people.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Switched-off people are hidden from marking, pay and totals. Their history is kept.
        </p>
      )}
    </>
  );
}
