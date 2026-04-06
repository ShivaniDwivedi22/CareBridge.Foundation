import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODS = [
  { key: "morning",   label: "Morning",   sub: "6am – 12pm" },
  { key: "afternoon", label: "Afternoon", sub: "12pm – 6pm"  },
  { key: "evening",   label: "Evening",   sub: "6pm – 10pm"  },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export type AvailabilityPickerProps = {
  value: string;
  onChange: (val: string) => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function toKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function slotKey(d: Date, period: Period): string {
  return `${toKey(d)}:${period}`;
}

function parseSlots(val: string): Set<string> {
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return new Set<string>(parsed);
  } catch {}
  return new Set<string>();
}

function serialize(slots: Set<string>): string {
  return JSON.stringify(Array.from(slots).sort());
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const days = useMemo(() => getNext14Days(), []);
  const selected = useMemo(() => parseSlots(value), [value]);

  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);

  // ── Toggle helpers ──────────────────────────────────────────────────────────

  const toggle = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(serialize(next));
  };

  const toggleDay = (day: Date) => {
    const allOn = PERIODS.every((p) => selected.has(slotKey(day, p.key)));
    const next = new Set(selected);
    PERIODS.forEach((p) =>
      allOn ? next.delete(slotKey(day, p.key)) : next.add(slotKey(day, p.key))
    );
    onChange(serialize(next));
  };

  const togglePeriodForWeek = (weekDays: Date[], period: Period) => {
    const allOn = weekDays.every((d) => selected.has(slotKey(d, period)));
    const next = new Set(selected);
    weekDays.forEach((d) =>
      allOn ? next.delete(slotKey(d, period)) : next.add(slotKey(d, period))
    );
    onChange(serialize(next));
  };

  // ── Quick selects ───────────────────────────────────────────────────────────

  const quickSelect = (filter: (d: Date) => boolean) => {
    const next = new Set(selected);
    days.forEach((d) => {
      if (filter(d)) PERIODS.forEach((p) => next.add(slotKey(d, p.key)));
    });
    onChange(serialize(next));
  };

  const clearAll = () => onChange("[]");

  const selectedCount = selected.size;
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Render week grid ────────────────────────────────────────────────────────

  const WeekGrid = ({ week, label }: { week: Date[]; label: string }) => (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-0.5">
        {label}
      </p>
      <div className="border border-border/50 rounded-xl overflow-hidden text-sm">
        {/* Day header row */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/40">
          <div className="p-2" />
          {week.map((d) => {
            const allOn = PERIODS.every((p) => selected.has(slotKey(d, p.key)));
            return (
              <button
                key={toKey(d)}
                type="button"
                onClick={() => toggleDay(d)}
                title="Toggle entire day"
                className={cn(
                  "py-2 text-center transition-colors hover:bg-primary/15 border-l border-border/30",
                  allOn && "bg-primary/10"
                )}
              >
                <div className={cn("text-xs font-semibold", allOn ? "text-primary" : "")}>
                  {DOW[d.getDay()]}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {MONTHS[d.getMonth()]} {d.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Period rows */}
        {PERIODS.map((period, pIdx) => {
          const allPeriodOn = week.every((d) => selected.has(slotKey(d, period.key)));
          return (
            <div
              key={period.key}
              className="grid grid-cols-[80px_repeat(7,1fr)] border-t border-border/30"
            >
              {/* Row label – click to toggle whole period for this week */}
              <button
                type="button"
                onClick={() => togglePeriodForWeek(week, period.key)}
                title="Toggle this period for the whole week"
                className={cn(
                  "px-2 py-2.5 text-left transition-colors hover:bg-primary/15",
                  allPeriodOn && "bg-primary/10"
                )}
              >
                <div className={cn("text-xs font-medium leading-none", allPeriodOn ? "text-primary" : "")}>
                  {period.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{period.sub}</div>
              </button>

              {/* Cells */}
              {week.map((d) => {
                const key = slotKey(d, period.key);
                const on = selected.has(key);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "h-12 border-l border-border/30 transition-all duration-100",
                      on
                        ? "bg-primary hover:bg-primary/80 shadow-inner"
                        : isWeekend
                        ? "bg-muted/40 hover:bg-primary/20"
                        : "hover:bg-primary/15"
                    )}
                    title={`${DOW[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} – ${period.label}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-muted/40 border border-border/40 inline-block" /> Unavailable
        </span>
        <span className="ml-auto text-muted-foreground/70">
          Click day header to toggle all — click period label to toggle row
        </span>
      </div>

      {/* Quick-select buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium mr-1">Quick select:</span>
        <Button
          type="button" variant="outline" size="sm"
          className="h-7 text-xs rounded-full"
          onClick={() => quickSelect((d) => d.getDay() !== 0 && d.getDay() !== 6)}
        >
          All Weekdays
        </Button>
        <Button
          type="button" variant="outline" size="sm"
          className="h-7 text-xs rounded-full"
          onClick={() => quickSelect((d) => d.getDay() === 0 || d.getDay() === 6)}
        >
          All Weekends
        </Button>
        <Button
          type="button" variant="outline" size="sm"
          className="h-7 text-xs rounded-full"
          onClick={() => quickSelect(() => true)}
        >
          All 2 Weeks
        </Button>
        <Button
          type="button" variant="outline" size="sm"
          className="h-7 text-xs rounded-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          onClick={clearAll}
        >
          Clear All
        </Button>
        {selectedCount > 0 && (
          <span className="text-xs text-primary font-medium ml-auto">
            {selectedCount} slot{selectedCount !== 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {/* Grids */}
      <div className="space-y-5">
        <WeekGrid week={week1} label="Week 1" />
        <WeekGrid week={week2} label="Week 2" />
      </div>
    </div>
  );
}
