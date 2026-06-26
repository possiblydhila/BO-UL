import { useMemo } from "react";
import { Table } from "@/components/application/table/table";
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
  const items = useMemo(
    () =>
      [...campaigns]
        .sort((a, b) => b.participantCifIds.length - a.participantCifIds.length)
        .slice(0, 5),
    [campaigns],
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
        <Table aria-label="Campaign participation" size="sm">
          <Table.Header>
            <Table.Head id="name" label="Campaign" isRowHeader />
            <Table.Head id="status" label="Status" />
            <Table.Head id="participants" label="Participants" className="text-right" />
            <Table.Head id="rate" label="Rate" className="text-right" />
          </Table.Header>
          <Table.Body items={items}>
            {(campaign) => {
              const rate =
                campaign.targetUserCount > 0
                  ? ((campaign.participantCifIds.length / campaign.targetUserCount) * 100).toFixed(1)
                  : "0.0";
              return (
                <Table.Row id={campaign.id}>
                  <Table.Cell className="font-medium text-primary">{campaign.name}</Table.Cell>
                  <Table.Cell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        campaign.status === "active"
                          ? "bg-success-50 text-success-primary"
                          : "bg-tertiary text-tertiary"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {formatNumber(campaign.participantCifIds.length)}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{rate}%</Table.Cell>
                </Table.Row>
              );
            }}
          </Table.Body>
        </Table>
      </div>
    </section>
  );
}
