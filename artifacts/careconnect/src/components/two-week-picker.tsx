import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const SLOTS = ["AM", "PM", "EVE"] as const;
type Slot = typeof SLOTS[number];

const SLOT_LABEL: Record<Slot, string> = {
  AM: "6am–12pm",
  PM: "12–6pm",
  EVE: "6–10pm",
};

const SLOT_BASE: Record<Slot, string> = {
  AM:  "border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
  PM:  "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100",
  EVE: "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100",
};

const SLOT_ACTIVE: Record<Slot, string> = {
  AM:  "bg-yellow-400 border-yellow-500 text-white",
  PM:  "bg-blue-500 border-blue-600 text-white",
  EVE: "bg-indigo-500 border-indigo-600 text-white",
};

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function deserialize(value: string): Set<string> {
  const s = new Set<string>();
  if (!value?.trim()) return s;
  for (const part of value.split(";")) {
    const trimmed = part.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx < 0) continue;
    const dateStr = trimmed.slice(0, colonIdx).trim();
    const slotsPart = trimmed.slice(colonIdx + 1).trim();
    for (const slot of slotsPart.split(",").map((x) => x.trim())) {
      if ((SLOTS as readonly string[]).includes(slot)) {
        s.add(`${dateStr}:${slot}`);
      }
    }
  }
  return s;
}

function serialize(selected: Set<string>): string {
  const byDate: Record<string, string[]> = {};
  for (const key of selected) {
    const [dateStr, slot] = key.split(":");
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(slot);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, slots]) => {
      const date = new Date(d + "T12:00:00");
      const label = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return `${label}: ${slots.join(", ")}`;
    })
    .join("; ");
}

function WeekGrid({
  days,
  label,
  selected,
  onToggle,
}: {
  days: Date[];
  label: string;
  selected: Set<string>;
  onToggle: (d: Date, slot: Slot) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = fmtDate(day);
          const hasAny = SLOTS.some((s) => selected.has(`${dateStr}:${s}`));
          return (
            <div
              key={dateStr}
              className={cn(
                "rounded-lg border bg-white p-1 flex flex-col gap-0.5 transition-colors",
                hasAny ? "border-primary/40 bg-primary/5" : "border-border/40"
              )}
            >
              <div className="text-center mb-0.5">
                <div className="text-[9px] font-semibold text-muted-foreground">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-xs font-bold leading-none">{day.getDate()}</div>
              </div>
              {SLOTS.map((slot) => {
                const key = `${dateStr}:${slot}`;
                const isActive = selected.has(key);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onToggle(day, slot)}
                    title={`${slot} — ${SLOT_LABEL[slot]}`}
                    className={cn(
                      "rounded border text-[9px] font-bold px-0 py-0.5 w-full transition-all",
                      isActive ? SLOT_ACTIVE[slot] : SLOT_BASE[slot]
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TwoWeekPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const [selected, setSelected] = useState<Set<string>>(() => deserialize(value));

  useEffect(() => {
    setSelected(deserialize(value));
  }, []);

  const toggle = (date: Date, slot: Slot) => {
    const key = `${fmtDate(date)}:${slot}`;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    onChange(serialize(next));
  };

  const count = selected.size;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tap slots to mark when you're available.
          <span className="text-yellow-600 font-medium"> AM</span> = 6am–12pm ·
          <span className="text-blue-600 font-medium"> PM</span> = 12–6pm ·
          <span className="text-indigo-600 font-medium"> EVE</span> = 6–10pm
        </p>
        {count > 0 && (
          <span className="text-xs text-primary font-semibold shrink-0 ml-2">
            {count} slot{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="space-y-4 rounded-xl border border-border/40 bg-muted/10 p-3">
        <WeekGrid days={days.slice(0, 7)} label="Week 1" selected={selected} onToggle={toggle} />
        <WeekGrid days={days.slice(7, 14)} label="Week 2" selected={selected} onToggle={toggle} />
      </div>
      {count === 0 && (
        <p className="text-xs text-amber-600 font-medium">Please select at least one availability slot.</p>
      )}
    </div>
  );
}
