import { googleEnabled } from "@repo/auth";
import { AuthForm } from "@repo/auth/components";
import { getSession } from "@repo/auth/next";
import { ThemeToggle } from "@repo/ui";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// No sign-up here: admins are the verified emails in ADMIN_EMAILS (sign in with Google).
export default async function SignInPage() {
  if (await getSession(auth())) redirect("/");
  return (
    <main className="relative px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <h1 className="text-center text-2xl font-bold">Attendance &amp; Pay</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">For employers. Sign in with an admin account.</p>
      <AuthForm mode="signin" google={googleEnabled()} allowSignup={false} />
    </main>
  );
}
