import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendGranularity, TrendPoint } from "../../types";
import { chartAxisTick, chartGridStroke, chartTooltipContentStyle } from "../../utils/chartStyles";

const GRANULARITY_OPTIONS: { value: TrendGranularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function TrendChart({
  data,
  granularity,
  onGranularityChange,
}: {
  data: TrendPoint[];
  granularity: TrendGranularity;
  onGranularityChange: (g: TrendGranularity) => void;
}) {
  return (
    <section className="surface p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">Daily / Weekly / Monthly trend</h3>
          <p className="mt-1 text-sm text-quaternary">
            CIF earn, CIF redeem, point earn, and point redeemed. Point values in millions.
          </p>
        </div>
        <div className="flex rounded-lg border border-secondary p-0.5">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGranularityChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                granularity === opt.value
                  ? "bg-brand-600 text-white"
                  : "text-tertiary hover:bg-tertiary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tick={chartAxisTick} />
            <YAxis tickLine={false} axisLine={false} width={44} tick={chartAxisTick} />
            <Tooltip contentStyle={chartTooltipContentStyle} />
            <Legend />
            <Line type="monotone" dataKey="cifEarn" name="CIF Earn" stroke="#1570ef" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cifRedeem" name="CIF Redeem" stroke="#12b76a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pointEarn" name="Point Earn M" stroke="#f79009" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="pointRedeem"
              name="Point Redeem M"
              stroke="#7a5af8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
