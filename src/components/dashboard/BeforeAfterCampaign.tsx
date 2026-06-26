import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Campaign } from "../../types";
import { chartAxisTick, chartGridStroke, chartTooltipContentStyle } from "../../utils/chartStyles";
import { formatCompact } from "../../utils/points";
import { SelectField } from "./fields";

export function BeforeAfterCampaign({
  campaigns,
  campaignId,
  onCampaignChange,
  before,
  after,
  windowDays,
  onWindowDaysChange,
}: {
  campaigns: Campaign[];
  campaignId: string;
  onCampaignChange: (id: string) => void;
  before: number;
  after: number;
  windowDays: number;
  onWindowDaysChange: (days: number) => void;
}) {
  const chartData = [
    { label: `Before (${windowDays}d)`, points: before },
    { label: `After (${windowDays}d)`, points: after },
  ];

  return (
    <section className="surface p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">Before vs. after campaign</h3>
          <p className="mt-1 text-sm text-quaternary">
            Points earned in N days before vs. after campaign start. Default window: 14 days.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <SelectField
            label="Campaign"
            value={campaignId}
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            onChange={onCampaignChange}
          />
          <label className="text-sm font-medium text-secondary">
            <span className="mb-1.5 block">Window (days)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary bg-primary text-secondary hover:bg-secondary"
                onClick={() => onWindowDaysChange(Math.max(1, windowDays - 1))}
                aria-label="Decrease window"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-primary">
                {windowDays}
              </span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary bg-primary text-secondary hover:bg-secondary"
                onClick={() => onWindowDaysChange(windowDays + 1)}
                aria-label="Increase window"
              >
                +
              </button>
            </div>
          </label>
        </div>
      </div>
      <div className="mb-3 flex gap-6 text-sm text-tertiary">
        <span>
          Before: <strong className="tabular-nums text-primary">{formatCompact(before)}</strong> pts
        </span>
        <span>
          After: <strong className="tabular-nums text-primary">{formatCompact(after)}</strong> pts
        </span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxisTick} />
            <YAxis tickLine={false} axisLine={false} width={56} tick={chartAxisTick} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip contentStyle={chartTooltipContentStyle} formatter={(value: number) => [formatCompact(value), "Points earned"]} />
            <Legend />
            <Bar dataKey="points" name="Points earned" radius={[6, 6, 0, 0]} fill="#1570ef" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
