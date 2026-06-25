import type { Campaign, ComputedKpi } from "../../types";
import { formatNumber } from "../../utils/points";
import { KpiCard } from "./KpiGrid";

export function CampaignPerformancePanel({
  kpis,
  campaigns,
}: {
  kpis: ComputedKpi[];
  campaigns: Campaign[];
}) {
  const sorted = [...campaigns].sort(
    (a, b) => b.participantCifIds.length - a.participantCifIds.length,
  );

  return (
    <section className="surface p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-primary">Campaign performance</h3>
        <p className="mt-1 text-sm text-quaternary">Active campaigns, participation rates, and top performers.</p>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} item={kpi} />
        ))}
      </div>
      <div>
        <h4 className="mb-3 text-sm font-semibold text-secondary">Campaign participation</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-secondary text-xs font-semibold text-quaternary">
                <th className="pb-2 pr-4">Campaign</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4 text-right">Participants</th>
                <th className="pb-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 5).map((campaign) => {
                const rate =
                  campaign.targetUserCount > 0
                    ? ((campaign.participantCifIds.length / campaign.targetUserCount) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr key={campaign.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-primary">{campaign.name}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          campaign.status === "active"
                            ? "bg-success-50 text-success-primary"
                            : "bg-tertiary text-tertiary"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-secondary">
                      {formatNumber(campaign.participantCifIds.length)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-secondary">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
