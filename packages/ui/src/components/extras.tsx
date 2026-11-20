import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

/** Native <select> styled like Input. Works in plain server-rendered forms. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

/** One figure with a label. */
export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "good" && "text-emerald-600", tone === "bad" && "text-red-600")}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** GET form that switches the page to another month (?month=YYYY-MM). */
export function MonthPicker({ month, hidden }: { month: string; hidden?: Record<string, string> }) {
  return (
    <form className="flex items-center gap-2">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        type="month"
        name="month"
        defaultValue={month}
        aria-label="Month"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      />
      <Button type="submit" variant="outline" size="sm">
        Show
      </Button>
    </form>
  );
}
