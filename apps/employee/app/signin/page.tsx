import { googleEnabled } from "@repo/auth";
import { AuthForm } from "@repo/auth/components";
import { getSession } from "@repo/auth/next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  if (await getSession(auth())) redirect("/");
  return (
    <div className="pb-6">
      <p className="text-center text-sm text-muted-foreground">See the days you worked and the pay you&apos;re owed.</p>
      <AuthForm mode="signin" google={googleEnabled()} />
    </div>
  );
}
