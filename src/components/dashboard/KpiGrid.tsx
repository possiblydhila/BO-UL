import { useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { ComputedKpi, KpiTrend, TbdKpi } from "../../types";

function usePrefersReducedMotion() {
  const [reduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  return reduced;
}

function trendColor(trend: KpiTrend) {
  if (trend === "up") return "#027a48";
  if (trend === "down") return "#b42318";
  return "#64748b";
}

function Sparkline({ data, trend }: { data: number[]; trend: KpiTrend }) {
  const reducedMotion = usePrefersReducedMotion();
  if (!data.length || data.every((v) => v === 0)) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="mt-3 h-10 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor(trend)}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={!reducedMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({ item }: { item: ComputedKpi | TbdKpi }) {
  if ("status" in item && item.status === "tbd") {
    return (
      <article className="surface flex min-h-[142px] flex-col justify-between border-2 border-dashed border-primary bg-secondary p-5">
        <div>
          <p className="text-sm font-medium text-quaternary">{item.label}</p>
          <p className="mt-2 text-lg font-semibold text-slate-400">Definition pending</p>
        </div>
        <p className="text-sm text-slate-400">{item.detail}</p>
      </article>
    );
  }

  const kpi = item as ComputedKpi;
  return (
    <article className="surface flex min-h-[142px] flex-col justify-between p-5">
      <div>
        <p className="text-sm font-medium text-tertiary">{kpi.label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">{kpi.value}</p>
      </div>
      <div>
        <p className="text-sm text-quaternary">{kpi.detail}</p>
        {kpi.sparkline && kpi.sparkline.length > 0 && (
          <Sparkline data={kpi.sparkline} trend={kpi.trend} />
        )}
      </div>
    </article>
  );
}

export function KpiSection({
  title,
  items,
}: {
  title: string;
  items: (ComputedKpi | TbdKpi)[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-primary">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

export function KpiGrid({
  customerEngagement,
  pointPerformance,
  cost,
  transactionImpact,
  channelPerformance,
  campaign,
}: {
  customerEngagement: (ComputedKpi | TbdKpi)[];
  pointPerformance: ComputedKpi[];
  cost: TbdKpi;
  transactionImpact: ComputedKpi[];
  channelPerformance: ComputedKpi[];
  campaign: ComputedKpi[];
}) {
  return (
    <div className="space-y-8">
      <KpiSection title="Customer Engagement" items={customerEngagement} />
      <KpiSection title="Point Performance" items={pointPerformance} />
      <KpiSection title="Cost" items={[cost]} />
      <KpiSection title="Transaction Impact" items={transactionImpact} />
      <KpiSection title="Channel Performance" items={channelPerformance} />
      <KpiSection title="Campaign" items={campaign} />
    </div>
  );
}
