import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComputedKpi, DistributionPoint } from "../../types";
import { formatCompact } from "../../utils/points";
import { KpiCard } from "./KpiGrid";

const COLORS = ["#1570ef", "#12b76a", "#f79009", "#7a5af8", "#f04438", "#06aed4"];

export function ChannelPerformancePanel({
  kpis,
  redemptionByChannel,
  redemptionByReward,
}: {
  kpis: ComputedKpi[];
  redemptionByChannel: DistributionPoint[];
  redemptionByReward: DistributionPoint[];
}) {
  const channelChartData = redemptionByChannel.map((d) => ({
    name: d.name,
    value: Math.round(d.value / 1_000_000),
  }));

  return (
    <section className="surface p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">Channel performance</h3>
        <p className="mt-1 text-sm text-slate-500">Top channels and redemption breakdown by channel and reward.</p>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {kpis.slice(0, 2).map((kpi) => (
          <KpiCard key={kpi.label} item={kpi} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Redemption per channel</h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelChartData} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(v: number) => [`${v}M`, "Points"]} />
                <Bar dataKey="value" name="Point M" radius={[6, 6, 0, 0]} fill="#1570ef" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Redemption per reward type</h4>
          <div className="grid h-[220px] gap-4 md:grid-cols-[1fr_140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={redemptionByReward}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {redemptionByReward.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCompact(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-2 overflow-y-auto">
              {redemptionByReward.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                    <span
                      className="h-2 w-2 flex-none rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-slate-950">{formatCompact(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
