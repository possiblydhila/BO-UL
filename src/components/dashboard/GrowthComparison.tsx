import type { GrowthResult } from "../../data/aggregations";

function GrowthItem({
  label,
  earn,
  redeem,
}: {
  label: string;
  earn: number;
  redeem: number;
}) {
  const formatDelta = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const earnColor = earn >= 0 ? "text-success-700" : "text-danger-700";
  const redeemColor = redeem >= 0 ? "text-success-700" : "text-danger-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Points earned</p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${earnColor}`}>{formatDelta(earn)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Points redeemed</p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${redeemColor}`}>{formatDelta(redeem)}</p>
        </div>
      </div>
    </div>
  );
}

export function GrowthComparison({ growth }: { growth: GrowthResult }) {
  return (
    <section className="surface p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">MoM / YoY growth</h3>
        <p className="mt-1 text-sm text-slate-500">
          (current period − prior period) ÷ prior period for total earn and redeem.
        </p>
      </div>
      <div className="space-y-3">
        <GrowthItem label="Month over month" earn={growth.momEarn} redeem={growth.momRedeem} />
        <GrowthItem label="Year over year" earn={growth.yoyEarn} redeem={growth.yoyRedeem} />
      </div>
    </section>
  );
}
