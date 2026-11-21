import { isDay, today, type Status } from "@repo/data/pay";
import { activeEmployees, attendanceBetween, attendanceOn } from "@repo/data/payroll";
import { Button, cn } from "@repo/ui";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { markAttendance } from "@/app/actions";
import { BulkBar, DayPicker, SubmitButton } from "@/components/client";

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

function format(day: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
}

/** Seven days around `day`, never past today. */
function week(day: string, now: string) {
  const plus3 = shift(day, 3);
  const end = plus3 < now ? plus3 : now;
  return Array.from({ length: 7 }, (_, i) => shift(end, i - 6));
}

/** Full / Half / Leave buttons for one person on one or more days. Tapping the lit one clears it. */
function Choices({ id, days, current, label }: { id: number; days: string[]; current?: Status; label: string }) {
  return (
    <form action={markAttendance} className="flex shrink-0 gap-1" aria-label={label}>
      {days.map((d) => (
        <input key={d} type="hidden" name="day" value={d} />
      ))}
      <input type="hidden" name="ids" value={id} />
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
  );
}

export default async function Attendance({ searchParams }: { searchParams: Promise<{ day?: string; person?: string }> }) {
  const sp = await searchParams;
  const now = today();
  const day = isDay(sp.day) && sp.day <= now ? sp.day : now;
  const days = week(day, now);
  const people = await activeEmployees();
  const person = people.find((p) => p.id === Number(sp.person));
  const base = person ? `/attendance?person=${person.id}&day=` : "/attendance?day=";
  const arrow = "grid size-10 shrink-0 place-items-center rounded-full border bg-card hover:bg-muted";

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold sm:text-2xl">{day === now ? "Today" : format(day, { weekday: "long", day: "numeric", month: "long" })}</h1>
        <DayPicker day={day} max={now} href={base} />
      </div>
      <nav aria-label="Choose a day" className="flex items-center gap-1">
        <Link href={`${base}${shift(day, -7)}`} className={arrow} aria-label="Previous week">
          <ChevronLeft className="size-5" />
        </Link>
        <ul className="grid flex-1 grid-cols-7 gap-1">
          {days.map((d) => (
            <li key={d}>
              <Link
                href={`${base}${d}`}
                aria-current={d === day ? "date" : undefined}
                className={cn(
                  "flex flex-col items-center rounded-xl border py-1.5 text-xs",
                  d === day ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                  d === now && d !== day && "border-primary",
                )}
              >
                <span>{format(d, { weekday: "short" })}</span>
                <span className="text-base font-semibold">{format(d, { day: "numeric" })}</span>
              </Link>
            </li>
          ))}
        </ul>
        {days[6]! < now ? (
          <Link href={`${base}${shift(day, 7) < now ? shift(day, 7) : now}`} className={arrow} aria-label="Next week">
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <span className="size-10 shrink-0" />
        )}
      </nav>
    </div>
  );

  if (people.length === 0) {
    return (
      <>
        {header}
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="mb-3 text-muted-foreground">Add people first, then mark them here.</p>
          <Button asChild>
            <Link href="/employees">Add employees</Link>
          </Button>
        </div>
      </>
    );
  }

  // One person across the seven days in the strip.
  if (person) {
    const marks = await attendanceBetween(person.id, days[0]!, days[6]!);
    const first = marks.get(days[0]!);
    const same = first && days.every((d) => marks.get(d) === first) ? first : undefined;
    return (
      <>
        {header}
        <div className="flex items-center gap-3">
          <Link href={`/attendance?day=${day}`} className={arrow} aria-label="Back to everyone">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{person.name}</h2>
            <p className="text-xs text-muted-foreground">
              {format(days[0]!, { day: "numeric", month: "short" })} to {format(days[6]!, { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-primary bg-card p-3">
          <span className="flex-1 font-medium">All 7 days</span>
          <Choices id={person.id} days={days} current={same} label={`Mark ${person.name} for all 7 days`} />
        </div>
        <ul className="space-y-2">
          {days.map((d) => (
            <li key={d} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3", d === day && "border-primary")}>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{d === now ? "Today" : format(d, { weekday: "long" })}</span>
                <span className="text-xs text-muted-foreground">{format(d, { day: "numeric", month: "long" })}</span>
              </span>
              <Choices id={person.id} days={[d]} current={marks.get(d)} label={`Mark ${person.name} on ${d}`} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  const marks = await attendanceOn(day);
  const unmarked = people.filter((p) => !marks.has(p.id));

  return (
    <>
      {header}
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
      <p className="text-xs text-muted-foreground">Tap a name to mark that person for the whole week.</p>

      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <input
              type="checkbox"
              form="bulk"
              name="ids"
              value={p.id}
              aria-label={`Select ${p.name}`}
              className="size-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <Link href={`/attendance?person=${p.id}&day=${day}`} className="min-w-0 flex-1 hover:underline">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.payType === "daily" ? "Daily wage" : "Monthly salary"}</span>
            </Link>
            <Choices id={p.id} days={[day]} current={marks.get(p.id)} label={`Mark ${p.name}`} />
          </li>
        ))}
      </ul>
    </>
  );
}
