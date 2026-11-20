import { requireAdmin } from "@repo/auth/next";
import { listEmployees } from "@repo/data/payroll";
import { Badge, Button, NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { linkUser, setRole } from "@/app/actions";
import { BanButton } from "@/components/ban-button";
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
      <div>
        <h1 className="text-2xl font-bold">Users &amp; access ({total})</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People sign up in the employee app. Link their account to an employee so they can see their attendance and pay, or
          make them an admin to give them this employer app (they sign in here with the same email and password).
        </p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const linked = byUser.get(u.id);
              const isAdmin = u.role === "admin";
              const self = u.id === session.user.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Admin" : "Employee"}</Badge>
                    {u.banned && (
                      <Badge variant="destructive" className="ml-2">
                        banned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <form action={linkUser} className="flex gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <NativeSelect name="employeeId" defaultValue={linked?.id ?? ""} className="h-9 min-w-40">
                        <option value="">Not linked</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id} disabled={Boolean(p.userId && p.userId !== u.id)}>
                            {p.name}
                            {p.userId && p.userId !== u.id ? " (linked)" : ""}
                            {p.active ? "" : " (disabled)"}
                          </option>
                        ))}
                      </NativeSelect>
                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    {!self && (
                      <div className="flex justify-end gap-2">
                        <form action={setRole}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="role" value={isAdmin ? "user" : "admin"} />
                          <Button type="submit" variant="outline" size="sm">
                            {isAdmin ? "Remove admin" : "Make admin"}
                          </Button>
                        </form>
                        <BanButton userId={u.id} banned={Boolean(u.banned)} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
    </>
  );
}
