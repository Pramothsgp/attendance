"use client";

import { Button, Input, Label, Picker } from "@repo/ui";
import { useEffect, useRef, useState, useTransition } from "react";

type Person = { id: number; name: string; balance: number };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, trailingZeroDisplay: "stripIfInteger" });

/** What to pre-fill for a person: what they're owed (paise only if any), or nothing if they've been paid ahead. */
export function payable(person: Person | undefined): string {
  return person && person.balance > 0 ? String(Math.round(person.balance * 100) / 100) : "";
}

/**
 * Pay form. Choosing a person fills in what they're owed (editable). Submits through
 * onSubmit rather than the form action so React doesn't reset the fields behind the
 * controlled dropdown.
 */
export function PaymentForm({
  people,
  preselect,
  today,
  action,
}: {
  people: Person[];
  preselect?: number;
  today: string;
  action: (form: FormData) => Promise<void>;
}) {
  const find = (id: string) => people.find((p) => String(p.id) === id);
  const [person, setPerson] = useState(preselect ? String(preselect) : "");
  const [amount, setAmount] = useState(() => payable(find(person)));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // A link like /payments?employee=3 changes preselect without remounting.
  useEffect(() => {
    if (!preselect) return;
    setPerson(String(preselect));
    setAmount(payable(people.find((p) => p.id === preselect)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect]);

  function choose(id: string) {
    setPerson(id);
    setAmount(payable(find(id)));
    setSaved(null);
  }

  return (
    <form
      id="pay"
      ref={formRef}
      className="grid scroll-mt-24 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const who = find(person);
        start(async () => {
          await action(form);
          setSaved(`Saved ${inr.format(Number(form.get("amount")))} for ${who?.name ?? "them"}.`);
          setAmount("");
          const note = formRef.current?.elements.namedItem("note");
          if (note instanceof HTMLInputElement) note.value = "";
        });
      }}
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="employeeId">Who</Label>
        <Picker
          id="employeeId"
          name="employeeId"
          required
          value={person || undefined}
          onValueChange={choose}
          placeholder="Choose a person"
          options={people.map((p) => ({
            value: String(p.id),
            label: p.name,
            hint: p.balance >= 0 ? `${inr.format(p.balance)} to pay` : `${inr.format(-p.balance)} paid ahead`,
          }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 text-base"
        />
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
        <Input id="day" name="day" type="date" required defaultValue={today} className="h-11 text-base" />
      </div>
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" maxLength={200} placeholder="Optional" className="h-11 text-base" />
      </div>
      <Button type="submit" size="lg" disabled={pending} className="self-end rounded-xl">
        {pending ? "Saving…" : "Save payment"}
      </Button>
      {saved && (
        <p role="status" className="text-sm font-medium text-present sm:col-span-2 lg:col-span-4">
          {saved}
        </p>
      )}
    </form>
  );
}
