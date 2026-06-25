import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Campaign } from "../../types";
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
          <h3 className="text-base font-semibold text-slate-950">Before vs. after campaign</h3>
          <p className="mt-1 text-sm text-slate-500">
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
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">Window (days)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => onWindowDaysChange(Math.max(1, windowDays - 1))}
                aria-label="Decrease window"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-slate-950">
                {windowDays}
              </span>
              <button
                type="button"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => onWindowDaysChange(windowDays + 1)}
                aria-label="Increase window"
              >
                +
              </button>
            </div>
          </label>
        </div>
      </div>
      <div className="mb-3 flex gap-6 text-sm text-slate-600">
        <span>
          Before: <strong className="tabular-nums text-slate-950">{formatCompact(before)}</strong> pts
        </span>
        <span>
          After: <strong className="tabular-nums text-slate-950">{formatCompact(after)}</strong> pts
        </span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip formatter={(value: number) => [formatCompact(value), "Points earned"]} />
            <Legend />
            <Bar dataKey="points" name="Points earned" radius={[6, 6, 0, 0]} fill="#1570ef" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
