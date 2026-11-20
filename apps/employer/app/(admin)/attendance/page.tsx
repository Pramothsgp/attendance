import { isDay, today, type Status } from "@repo/data/pay";
import { activeEmployees, attendanceOn } from "@repo/data/payroll";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { markAttendance } from "@/app/actions";
import { SelectAll } from "@/components/client";

const LABEL: Record<Status, string> = { full: "Full day", half: "Half day", leave: "Leave" };
const TONE = { full: "default", half: "outline", leave: "destructive" } as const;

export default async function Attendance({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const sp = await searchParams;
  const day = isDay(sp.day) ? sp.day : today();
  const [people, marks] = await Promise.all([activeEmployees(), attendanceOn(day)]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="day"
            defaultValue={day}
            aria-label="Day"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button type="submit" variant="outline" size="sm">
            Show
          </Button>
        </form>
      </div>

      <form action={markAttendance} className="space-y-3">
        <input type="hidden" name="day" value={day} />
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
          <span className="mr-2 text-sm text-muted-foreground">Mark selected for {day} as</span>
          <Button type="submit" name="status" value="full">
            Full day
          </Button>
          <Button type="submit" name="status" value="half" variant="outline">
            Half day
          </Button>
          <Button type="submit" name="status" value="leave" variant="destructive">
            Leave
          </Button>
          <Button type="submit" name="status" value="clear" variant="ghost">
            Clear
          </Button>
        </div>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <SelectAll name="ids" />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((p) => {
                const status = marks.get(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <input type="checkbox" name="ids" value={p.id} id={`e${p.id}`} className="size-4" />
                    </TableCell>
                    <TableCell>
                      <label htmlFor={`e${p.id}`} className="block cursor-pointer font-medium">
                        {p.name}
                      </label>
                    </TableCell>
                    <TableCell>
                      {status ? <Badge variant={TONE[status]}>{LABEL[status]}</Badge> : <span className="text-sm text-muted-foreground">Not marked</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {people.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No active employees.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </form>
    </>
  );
}
