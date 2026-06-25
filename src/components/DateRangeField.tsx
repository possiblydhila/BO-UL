import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(day: Date, start: Date, end: Date): boolean {
  const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return time >= Math.min(startTime, endTime) && time <= Math.max(startTime, endTime);
}

function MonthGrid({
  month,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  month: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelect: (date: Date) => void;
}) {
  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const items: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), i - startOffset + 1);
      items.push({ date, inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push({ date: new Date(month.getFullYear(), month.getMonth(), day), inMonth: true });
    }
    while (items.length % 7 !== 0) {
      const last = items[items.length - 1].date;
      items.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return items;
  }, [month]);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-slate-950">
        {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }) => {
          const selectedStart = rangeStart && isSameDay(date, rangeStart);
          const selectedEnd = rangeEnd && isSameDay(date, rangeEnd);
          const inRange = rangeStart && rangeEnd && isBetween(date, rangeStart, rangeEnd);
          return (
            <button
              key={toIsoDate(date)}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelect(date)}
              className={`focus-ring h-9 rounded-md text-sm transition ${
                !inMonth
                  ? "cursor-default text-slate-300"
                  : selectedStart || selectedEnd
                    ? "bg-brand-600 font-semibold text-white"
                    : inRange
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangeField({
  label,
  periodStart,
  periodEnd,
  onChange,
}: {
  label: string;
  periodStart: string;
  periodEnd: string;
  onChange: (periodStart: string, periodEnd: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseDate(periodStart) ?? new Date()));
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftStart(parseDate(periodStart));
    setDraftEnd(parseDate(periodEnd));
    setViewMonth(startOfMonth(parseDate(periodStart) ?? new Date()));
  }, [open, periodStart, periodEnd]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayValue =
    periodStart && periodEnd
      ? `${formatDisplay(periodStart)} – ${formatDisplay(periodEnd)}`
      : "Select date range";

  const handleSelect = (date: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(date);
      setDraftEnd(null);
      return;
    }
    if (date < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(date);
      return;
    }
    setDraftEnd(date);
  };

  const applyRange = () => {
    if (!draftStart || !draftEnd) return;
    onChange(toIsoDate(draftStart), toIsoDate(draftEnd));
    setOpen(false);
  };

  const clearRange = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange("", "");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="focus-ring flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={periodStart && periodEnd ? "text-slate-900" : "text-slate-500"}>{displayValue}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:right-auto sm:w-[520px]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              className="focus-ring rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setViewMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-slate-600">Select start and end dates</p>
            <button
              type="button"
              aria-label="Next month"
              className="focus-ring rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <MonthGrid month={viewMonth} rangeStart={draftStart} rangeEnd={draftEnd} onSelect={handleSelect} />
            <MonthGrid
              month={addMonths(viewMonth, 1)}
              rangeStart={draftStart}
              rangeEnd={draftEnd}
              onSelect={handleSelect}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500">
              {draftStart && draftEnd
                ? `${formatDisplay(toIsoDate(draftStart))} – ${formatDisplay(toIsoDate(draftEnd))}`
                : draftStart
                  ? "Select end date"
                  : "Select start date"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearRange}
                className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!draftStart || !draftEnd}
                onClick={applyRange}
                className="focus-ring rounded-lg border border-brand-600 bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
