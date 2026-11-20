import { isDay, today, type Status } from "@repo/data/pay";
import { activeEmployees, attendanceOn } from "@repo/data/payroll";
import { Button, cn } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { markAttendance } from "@/app/actions";
import { BulkBar, SubmitButton } from "@/components/client";

const CHOICES: { status: Status; label: string; on: string }[] = [
  { status: "full", label: "Full", on: "bg-present text-white dark:text-background border-present" },
  { status: "half", label: "Half", on: "bg-half text-white dark:text-background border-half" },
  { status: "leave", label: "Leave", on: "bg-leave text-white dark:text-background border-leave" },
];

function shift(day: string, by: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

export default async function Attendance({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const sp = await searchParams;
  const now = today();
  const day = isDay(sp.day) ? sp.day : now;
  const [people, marks] = await Promise.all([activeEmployees(), attendanceOn(day)]);
  const unmarked = people.filter((p) => !marks.has(p.id));
  const label = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const arrow = "grid size-11 place-items-center rounded-full border bg-card hover:bg-muted";

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Link href={`/attendance?day=${shift(day, -1)}`} className={arrow} aria-label="Previous day">
          <ChevronLeft className="size-5" />
        </Link>
        <form className="text-center">
          <h1 className="text-xl font-bold sm:text-2xl">{day === now ? "Today" : label}</h1>
          <label className="text-sm text-muted-foreground">
            <span className="sr-only">Pick a date</span>
            {day === now && <span>{label} </span>}
            <input
              type="date"
              name="day"
              defaultValue={day}
              max={now}
              className="ml-1 rounded-md border bg-card px-2 py-0.5 text-sm"
              aria-label="Pick a date"
            />
            <button type="submit" className="ml-1 text-primary">Go</button>
          </label>
        </form>
        {day < now ? (
          <Link href={`/attendance?day=${shift(day, 1)}`} className={arrow} aria-label="Next day">
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </div>

      {people.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="mb-3 text-muted-foreground">Add people first, then mark them here.</p>
          <Button asChild>
            <Link href="/employees">Add employees</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {unmarked.length > 0 ? (
              <form action={markAttendance}>
                <input type="hidden" name="day" value={day} />
                <input type="hidden" name="status" value="full" />
                {unmarked.map((p) => (
                  <input key={p.id} type="hidden" name="ids" value={p.id} />
                ))}
                <SubmitButton className="rounded-full bg-present text-white dark:text-background hover:bg-present/90">
                  Mark {unmarked.length} not marked as full day
                </SubmitButton>
              </form>
            ) : (
              <p className="text-sm font-medium text-present">Everyone is marked for this day.</p>
            )}
            <form id="bulk" action={markAttendance}>
              <input type="hidden" name="day" value={day} />
              <BulkBar total={people.length} />
            </form>
          </div>

          <ul className="space-y-2">
            {people.map((p) => {
              const current = marks.get(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                  <input
                    type="checkbox"
                    form="bulk"
                    name="ids"
                    value={p.id}
                    id={`e${p.id}`}
                    className="size-5 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <label htmlFor={`e${p.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.payType === "daily" ? "Daily wage" : "Monthly salary"}</span>
                  </label>
                  <form action={markAttendance} className="flex shrink-0 gap-1" aria-label={`Mark ${p.name}`}>
                    <input type="hidden" name="day" value={day} />
                    <input type="hidden" name="ids" value={p.id} />
                    {CHOICES.map((c) => (
                      <button
                        key={c.status}
                        type="submit"
                        name="status"
                        value={current === c.status ? "clear" : c.status}
                        aria-pressed={current === c.status}
                        title={current === c.status ? `Tap again to clear ${c.label.toLowerCase()}` : `Mark ${c.label.toLowerCase()}`}
                        className={cn(
                          "h-10 min-w-12 rounded-xl border px-2 text-sm font-medium transition-colors active:scale-95",
                          current === c.status ? c.on : "bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
