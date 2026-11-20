import { SignOutButton } from "@repo/auth/components";
import { requireAdmin } from "@repo/auth/next";
import Link from "next/link";
import { auth } from "@/lib/auth";

const NAV = [
  ["/", "Summary"],
  ["/attendance", "Attendance"],
  ["/payments", "Payments"],
  ["/employees", "Employees"],
  ["/users", "Users & access"],
] as const;

// Page guard only. Server actions check again on their own (see app/actions.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin(auth());
  return (
    <>
      <header className="border-b bg-background">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
          <span className="mr-4 font-semibold">Attendance &amp; Pay</span>
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {label}
            </Link>
          ))}
          <span className="ml-auto mr-2 text-sm text-muted-foreground">{session.user.email}</span>
          <SignOutButton />
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{children}</main>
    </>
  );
}
