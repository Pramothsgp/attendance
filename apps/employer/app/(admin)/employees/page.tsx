import { money } from "@repo/data/pay";
import { listEmployees } from "@repo/data/payroll";
import { Badge, Button, Input, Label, NativeSelect, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { createEmployee, deleteEmployee, setActive, updateEmployee } from "@/app/actions";
import { ConfirmButton } from "@/components/client";

type Defaults = { name?: string; phone?: string | null; payType?: string; rate?: string };

function EmployeeFields({ d = {} }: { d?: Defaults }) {
  return (
    <>
      <div className="space-y-1">
        <Label>Name</Label>
        <Input name="name" required maxLength={200} defaultValue={d.name} />
      </div>
      <div className="space-y-1">
        <Label>Phone</Label>
        <Input name="phone" maxLength={30} defaultValue={d.phone ?? ""} />
      </div>
      <div className="space-y-1">
        <Label>Pay type</Label>
        <NativeSelect name="payType" defaultValue={d.payType ?? "daily"}>
          <option value="daily">Daily wage</option>
          <option value="monthly">Monthly salary (30 days)</option>
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label>Amount (per day or per month)</Label>
        <Input name="rate" type="number" min="0.01" step="0.01" required defaultValue={d.rate} />
      </div>
    </>
  );
}

export default async function Employees() {
  const people = await listEmployees();

  return (
    <>
      <h1 className="text-2xl font-bold">Employees</h1>

      <form action={createEmployee} className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-5 md:items-end">
        <EmployeeFields />
        <Button type="submit">Add employee</Button>
      </form>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((p) => (
              <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                <TableCell className="font-medium align-top">{p.name}</TableCell>
                <TableCell className="align-top">{p.phone}</TableCell>
                <TableCell className="align-top">
                  {money(Number(p.rate))} / {p.payType === "daily" ? "day" : "month"}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Enabled" : "Disabled"}</Badge>
                </TableCell>
                <TableCell className="space-y-2 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={setActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={String(!p.active)} />
                      <Button type="submit" variant="outline" size="sm">
                        {p.active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteEmployee}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton
                        variant="destructive"
                        size="sm"
                        message={`Delete ${p.name} and all their attendance and payments? This cannot be undone.`}
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                  <details className="text-left">
                    <summary className="cursor-pointer text-right text-sm text-primary">Edit</summary>
                    <form action={updateEmployee} className="mt-2 grid gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <EmployeeFields d={p} />
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <p className="text-xs text-muted-foreground">A new amount applies to days marked from now on.</p>
                    </form>
                  </details>
                </TableCell>
              </TableRow>
            ))}
            {people.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No employees yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Disabled employees are hidden from attendance, payments and the summary. Their history is kept.
      </p>
    </>
  );
}
