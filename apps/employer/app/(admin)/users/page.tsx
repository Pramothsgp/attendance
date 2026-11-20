import { SignOutButton } from "@repo/auth/components";
import { requireAdmin } from "@repo/auth/next";
import { listEmployees } from "@repo/data/payroll";
import { Button, cn, NativeSelect, Panel } from "@repo/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { linkUser, setRole } from "@/app/actions";
import { BanButton } from "@/components/ban-button";
import { SubmitButton } from "@/components/client";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 50;

export default async function Users({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAdmin(auth());
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ users, total }, people] = await Promise.all([
    auth().api.listUsers({
      headers: await headers(),
      query: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sortBy: "createdAt", sortDirection: "desc" },
    }),
    listEmployees(),
  ]);
  const byUser = new Map(people.filter((p) => p.userId).map((p) => [p.userId!, p]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users and access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </div>
      <Panel className="text-sm text-muted-foreground">
        People sign up in the employee app. Link their account to a person here so they can see their own attendance and
        pay. Make someone an admin to give them this app; they sign in with the same email and password.
      </Panel>

      <ul className="space-y-2">
        {users.map((u) => {
          const linked = byUser.get(u.id);
          const isAdmin = u.role === "admin";
          const self = u.id === session.user.id;
          return (
            <li key={u.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                    {isAdmin ? "Admin" : "Employee"}
                  </span>
                  {u.banned && <span className="rounded-full bg-leave/15 px-2.5 py-0.5 text-xs font-medium text-leave">Banned</span>}
                </div>
              </div>
              <form action={linkUser} className="flex gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <NativeSelect name="employeeId" defaultValue={linked?.id ?? ""} aria-label={`Person linked to ${u.email}`} className="flex-1">
                  <option value="">Not linked to anyone</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id} disabled={Boolean(p.userId && p.userId !== u.id)}>
                      {p.name}
                      {p.userId && p.userId !== u.id ? " (linked to someone else)" : ""}
                      {p.active ? "" : " (switched off)"}
                    </option>
                  ))}
                </NativeSelect>
                <SubmitButton variant="outline" className="h-11 rounded-lg">
                  Link
                </SubmitButton>
              </form>
              {!self && (
                <div className="flex gap-2">
                  <form action={setRole} className="flex-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="role" value={isAdmin ? "user" : "admin"} />
                    <SubmitButton variant="outline" size="sm" className="w-full rounded-lg">
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </SubmitButton>
                  </form>
                  <BanButton userId={u.id} banned={Boolean(u.banned)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/users?page=${page - 1}`}>Previous</Link>
            </Button>
          )}
          {page < pages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/users?page=${page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
