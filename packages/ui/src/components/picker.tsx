"use client";

import { cn } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type PickerOption = { value: string; label: string; hint?: string; disabled?: boolean };

/**
 * Styled dropdown that still works in plain server-action forms: with `name`, Radix
 * renders a hidden <select> that submits the value. Option values can't be "".
 */
export function Picker({
  name,
  options,
  defaultValue,
  placeholder = "Choose",
  required,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  name: string;
  options: PickerOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    // Keyed by the saved value: after a form action React resets fields to their first
    // default, so remount when the server sends a new one.
    <Select key={defaultValue} name={name} defaultValue={defaultValue || undefined} required={required}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "h-11 rounded-lg bg-card text-base data-[placeholder]:text-muted-foreground sm:text-sm [&>span]:text-left",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[min(24rem,var(--radix-select-content-available-height))] rounded-xl p-1">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled} className="rounded-lg py-2.5 text-base sm:text-sm">
            <span>{o.label}</span>
            {o.hint && <span className="ml-2 text-muted-foreground">{o.hint}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
