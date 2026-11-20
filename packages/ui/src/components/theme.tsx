"use client";

import { Moon, Sun } from "lucide-react";

/** Flips light/dark and remembers the choice. ThemeScript applies it on the next load. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Switch light or dark theme"
      className="grid size-10 place-items-center rounded-full border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        try {
          localStorage.setItem("theme", dark ? "dark" : "light");
        } catch {
          // Private mode: the toggle still works for this page.
        }
      }}
    >
      <Sun className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </button>
  );
}
