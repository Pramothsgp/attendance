"use client";

import { Button, type ButtonProps, cn } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that asks first. */
export function ConfirmButton({ message, ...props }: ButtonProps & { message: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    />
  );
}

/** Submit button that dims while its form is saving. */
export function SubmitButton({ className, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className={cn(pending && "opacity-60", className)} {...props} />;
}

/**
 * Sticky bar for marking many people at once. Checkboxes anywhere on the page join the
 * form with form="bulk"; the bar counts them and offers select all.
 */
export function BulkBar({ total }: { total: number }) {
  const [count, setCount] = useState(0);
  const { pending } = useFormStatus();

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>('input[form="bulk"][name="ids"]'));
    const update = () => setCount(boxes().filter((b) => b.checked).length);
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, []);

  // Untick everything once a bulk save finishes, so the next pick starts clean.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) setAll(false);
    wasPending.current = pending;
  });

  function setAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>('input[form="bulk"][name="ids"]').forEach((b) => (b.checked = checked));
    setCount(checked ? total : 0);
  }

  if (count === 0) {
    return (
      <button type="button" onClick={() => setAll(true)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Select everyone
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border bg-card p-3 shadow-lg md:static md:inset-auto md:shadow-none">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{count} selected</span>
        <button type="button" onClick={() => setAll(count < total)} className="text-primary">
          {count < total ? "Select all" : "Clear selection"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button type="submit" name="status" value="full" disabled={pending} className="bg-present text-white dark:text-background hover:bg-present/90">Full</Button>
        <Button type="submit" name="status" value="half" disabled={pending} className="bg-half text-white dark:text-background hover:bg-half/90">Half</Button>
        <Button type="submit" name="status" value="leave" disabled={pending} className="bg-leave text-white dark:text-background hover:bg-leave/90">Leave</Button>
        <Button type="submit" name="status" value="clear" disabled={pending} variant="outline">Clear</Button>
      </div>
    </div>
  );
}

/** Date input that opens the picked day straight away. `href` gets the day appended. */
export function DayPicker({ day, max, href }: { day: string; max: string; href: string }) {
  const router = useRouter();
  return (
    <input
      key={day}
      type="date"
      defaultValue={day}
      max={max}
      aria-label="Pick a date"
      className="rounded-md border bg-card px-2 py-0.5 text-sm"
      onChange={(e) => {
        const v = e.target.value;
        if (v && v <= max) router.push(`${href}${v}`);
      }}
    />
  );
}
