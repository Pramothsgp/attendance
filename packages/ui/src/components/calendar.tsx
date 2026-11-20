"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";

type Status = "full" | "half" | "leave";
export type CalendarDay = { day: string; status: Status; earned: number };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LABEL: Record<Status, string> = { full: "Full day", half: "Half day", leave: "Leave" };

const CELL: Record<Status, string> = {
  full: "bg-present text-white dark:text-background border-present",
  half: "border-half bg-[linear-gradient(135deg,hsl(var(--half)/.85)_50%,transparent_50%)]",
  leave: "border-leave text-leave",
};

/**
 * Month grid. With `action`, tapping a day opens a sheet to mark it
 * (the action gets day, ids=employeeId, status like the attendance form).
 */
export function MonthCalendar({
  month,
  today,
  days,
  action,
  employeeId,
}: {
  month: string;
  today: string;
  days: CalendarDay[];
  action?: (form: FormData) => Promise<void>;
  employeeId?: number;
}) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const byDay = new Map(days.map((d) => [d.day, d]));
  const [open, setOpen] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  function mark(status: Status | "clear") {
    if (!action || !open || employeeId === undefined) return;
    const form = new FormData();
    form.set("day", open);
    form.set("ids", String(employeeId));
    form.set("status", status);
    start(async () => {
      await action(form);
      setOpen(null);
    });
  }

  const cells = Array.from({ length: count }, (_, i) => {
    const day = `${month}-${String(i + 1).padStart(2, "0")}`;
    const entry = byDay.get(day);
    const future = day > today;
    const body = (
      <>
        <span className="text-sm font-semibold leading-none">{i + 1}</span>
        {entry && entry.earned > 0 && (
          <span className="text-[10px] leading-none tabular-nums opacity-90 sm:text-xs">₹{Math.round(entry.earned)}</span>
        )}
        {entry?.status === "leave" && <span className="text-[10px] font-medium leading-none sm:text-xs">Leave</span>}
      </>
    );
    const cls = cn(
      "flex aspect-square flex-col justify-between rounded-xl border p-1.5 text-left sm:p-2",
      entry ? CELL[entry.status] : future ? "border-dashed text-muted-foreground/60" : "bg-card",
      day === today && "ring-2 ring-primary ring-offset-2 ring-offset-background",
    );
    const title = `${day}: ${entry ? LABEL[entry.status] : "not marked"}`;
    return action && !future ? (
      <button key={day} type="button" className={cn(cls, "transition-transform active:scale-95")} title={title} onClick={() => setOpen(day)}>
        {body}
      </button>
    ) : (
      <div key={day} className={cls} title={title}>
        {body}
      </div>
    );
  });

  return (
    <>
      <div className="grid grid-cols-7 gap-1 sm:gap-2" role="grid" aria-label="Attendance calendar">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {cells}
      </div>

      {action && (
        <DialogPrimitive.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 space-y-4 rounded-t-3xl border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
              <DialogPrimitive.Title className="font-display text-lg font-semibold">
                {open &&
                  new Date(`${open}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {open && byDay.get(open) ? `Marked as ${LABEL[byDay.get(open)!.status].toLowerCase()}.` : "Not marked yet."}
              </DialogPrimitive.Description>
              <div className="grid grid-cols-3 gap-2">
                <SheetButton disabled={pending} onClick={() => mark("full")} className="bg-present text-white dark:text-background">Full day</SheetButton>
                <SheetButton disabled={pending} onClick={() => mark("half")} className="bg-half text-white dark:text-background">Half day</SheetButton>
                <SheetButton disabled={pending} onClick={() => mark("leave")} className="bg-leave text-white dark:text-background">Leave</SheetButton>
              </div>
              <SheetButton disabled={pending} onClick={() => mark("clear")} className="w-full border bg-transparent">
                Clear this day
              </SheetButton>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </>
  );
}

function SheetButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("h-12 rounded-xl font-medium transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
