"use client";

import { cn } from "@repo/ui";
import { CalendarDays, ClipboardCheck, House, IndianRupee, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const TABS = [
  { href: "/", label: "Today", icon: House },
  { href: "/attendance", label: "Mark", icon: ClipboardCheck },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/payments", label: "Pay", icon: IndianRupee },
  { href: "/employees", label: "People", icon: Users },
] as const;

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

/** Desktop: links in the header. */
export function TopNav() {
  const active = useActive();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            active(href) && "bg-secondary text-secondary-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Phones: fixed tab bar within thumb reach. */
export function BottomNav() {
  const active = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                active(href) && "text-primary",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", active(href) && "bg-secondary")}>
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
