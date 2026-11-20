import { isMonth, money, today } from "@repo/data/pay";
import { attendanceOn, summaries } from "@repo/data/payroll";
import { Button, InstallHint, MonthNav, Panel, PayStrip } from "@repo/ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function Today({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const day = today();
  const month = isMonth(sp.month) ? sp.month : day.slice(0, 7);
  const [rows, marks] = await Promise.all([summaries(month), attendanceOn(day)]);

  const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((t, r) => t + pick(r), 0);
  const counts = { full: 0, half: 0, leave: 0 };
  for (const r of rows) {
    const s = marks.get(r.id);
    if (s) counts[s]++;
  }
  const marked = counts.full + counts.half + counts.leave;
  const pct = (n: number) => (rows.length ? `${(n / rows.length) * 100}%` : "0%");
  const dateLabel = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <>
      <InstallHint appName="Attendance" />
      <Panel className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <h1 className="mt-1 text-3xl font-bold">
              {rows.length === 0 ? "No one on the team yet" : marked === rows.length ? "Everyone is marked" : `${marked} of ${rows.length} marked`}
            </h1>
          </div>
          {rows.length > 0 && (
            <Button asChild size="lg" className="shrink-0 rounded-full">
              <Link href="/attendance">{marked === rows.length ? "Review" : "Mark now"}</Link>
            </Button>
          )}
        </div>
        {rows.length > 0 ? (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${counts.full} full, ${counts.half} half, ${counts.leave} leave, ${rows.length - marked} not marked`}>
              <div className="bg-present" style={{ width: pct(counts.full) }} />
              <div className="bg-half" style={{ width: pct(counts.half) }} />
              <div className="bg-leave" style={{ width: pct(counts.leave) }} />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <li><span className="font-semibold text-present">{counts.full}</span> full day</li>
              <li><span className="font-semibold text-half">{counts.half}</span> half day</li>
              <li><span className="font-semibold text-leave">{counts.leave}</span> on leave</li>
              <li className="text-muted-foreground">{rows.length - marked} not marked</li>
            </ul>
          </>
        ) : (
          <Button asChild>
            <Link href="/employees">Add your first employee</Link>
          </Button>
        )}
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Money</h2>
        <MonthNav month={month} path="/" />
      </div>
      <PayStrip
        opening={sum((r) => r.opening)}
        earned={sum((r) => r.earnedMonth)}
        paid={sum((r) => r.salaryMonth + r.advanceMonth)}
        bonus={sum((r) => r.bonusMonth)}
      />

      {rows.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">People</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {rows.map((r) => {
              const due = r.opening + r.earnedMonth - r.salaryMonth - r.advanceMonth;
              const status = marks.get(r.id);
              return (
                <li key={r.id}>
                  <Link href={`/calendar?employee=${r.id}&month=${month}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${status === "full" ? "bg-present" : status === "half" ? "bg-half" : status === "leave" ? "bg-leave" : "bg-border"}`}
                      title={status ? `Today: ${status}` : "Today: not marked"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {r.full} full, {r.half} half, {r.leave} leave
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-display font-semibold tabular-nums ${due < 0 ? "text-leave" : ""}`}>{money(Math.abs(due))}</div>
                      <div className="text-xs text-muted-foreground">{due < 0 ? "paid ahead" : "to pay"}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
