"use client";

import { Button, type ButtonProps } from "@repo/ui";

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

/** Ticks or unticks every checkbox named `name` in the same form. */
export function SelectAll({ name }: { name: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Select all"
      className="size-4"
      onChange={(e) => {
        const boxes = e.currentTarget.form?.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
        boxes?.forEach((box) => (box.checked = e.currentTarget.checked));
      }}
    />
  );
}
