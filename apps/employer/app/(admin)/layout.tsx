import { SignOutButton } from "@repo/auth/components";
import { requireAdmin } from "@repo/auth/next";
import { ThemeToggle } from "@repo/ui";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BottomNav, TopNav } from "@/components/nav";
import { auth } from "@/lib/auth";

// Page guard only. Server actions check again on their own (see app/actions.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(auth());
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="mr-2 font-display text-lg font-bold">
            Attendance &amp; Pay
          </Link>
          <TopNav />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/users"
              aria-label="Users and access"
              className="grid size-10 place-items-center rounded-full border bg-card hover:bg-muted"
            >
              <ShieldCheck className="size-5" />
            </Link>
            <ThemeToggle />
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-28 pt-5 md:pb-12">{children}</main>
      <BottomNav />
    </>
  );
}
