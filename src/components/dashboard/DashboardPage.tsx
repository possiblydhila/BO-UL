import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeBeforeAfterCampaign,
  computeCampaignKpis,
  computeChannelPerformance,
  computeCostPlaceholder,
  computeCustomerEngagement,
  computeGrowth,
  computePointPerformance,
  computeTransactionImpact,
  computeTrendSeries,
} from "../../data/aggregations";
import { defaultDashboardFilters, mockCampaigns, mockTransactions } from "../../data/mockData";
import type { DashboardFilters, DashboardRole, ReconciliationRun, TrendGranularity } from "../../types";
import { BeforeAfterCampaign } from "./BeforeAfterCampaign";
import { CampaignPerformancePanel } from "./CampaignPerformancePanel";
import { ChannelPerformancePanel } from "./ChannelPerformancePanel";
import { ExportMenu } from "./ExportMenu";
import { FilterBar } from "./FilterBar";
import { GrowthComparison } from "./GrowthComparison";
import { KpiGrid } from "./KpiGrid";
import { ReconciliationPanel } from "./ReconciliationPanel";
import { RoleSwitcher } from "./RoleSwitcher";
import { TrendChart } from "./TrendChart";

function DashboardSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-sm font-semibold text-brand-700">Portal Back Office</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function DashboardPage() {
  const transactions = useMemo(() => mockTransactions, []);
  const campaigns = useMemo(() => mockCampaigns, []);
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [role, setRole] = useState<DashboardRole>("employee");
  const [reconRuns, setReconRuns] = useState<ReconciliationRun[]>([]);
  const [granularity, setGranularity] = useState<TrendGranularity>("monthly");
  const [windowDays, setWindowDays] = useState(14);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filters.sourceSystem !== "saving" && filters.transactionType !== "all") {
      setFilters((current) => ({ ...current, transactionType: "all" }));
    }
  }, [filters.sourceSystem, filters.transactionType]);

  const customerEngagement = useMemo(
    () => computeCustomerEngagement(transactions, filters).kpis,
    [transactions, filters],
  );
  const pointPerformance = useMemo(
    () => computePointPerformance(transactions, filters),
    [transactions, filters],
  );
  const cost = useMemo(() => computeCostPlaceholder(), []);
  const transactionImpact = useMemo(
    () => computeTransactionImpact(transactions, filters),
    [transactions, filters],
  );
  const channelData = useMemo(
    () => computeChannelPerformance(transactions, filters),
    [transactions, filters],
  );
  const campaignKpis = useMemo(() => computeCampaignKpis(campaigns), [campaigns]);
  const trendData = useMemo(
    () => computeTrendSeries(transactions, filters, granularity),
    [transactions, filters, granularity],
  );
  const growth = useMemo(() => computeGrowth(transactions, filters), [transactions, filters]);
  const beforeAfter = useMemo(
    () =>
      computeBeforeAfterCampaign(transactions, campaigns, filters.campaignId, windowDays, filters),
    [transactions, campaigns, filters, windowDays],
  );

  const handleReconciliationRun = () => {
    const recordsChecked = Math.floor(85000 + Math.random() * 40000);
    const mismatchesFound = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 5);
    setReconRuns((prev) =>
      [
        {
          timestamp: new Date().toLocaleString("id-ID"),
          status: "completed" as const,
          recordsChecked,
          mismatchesFound,
        },
        ...prev,
      ].slice(0, 5),
    );
  };

  return (
    <div className="space-y-8">
      <DashboardSectionHeader
        title="Loyalty Analytics"
        description="Monitoring KPI loyalty untuk earning, redemption rate, liability, campaign, channel, dan trend comparison berbasis mock data."
        action={
          <>
            <RoleSwitcher role={role} onChange={setRole} />
            <ExportMenu containerRef={dashboardRef} />
          </>
        }
      />

      <div ref={dashboardRef} className="space-y-8">
        <FilterBar filters={filters} onChange={setFilters} />

        <KpiGrid
          customerEngagement={customerEngagement}
          pointPerformance={pointPerformance}
          cost={cost}
          transactionImpact={transactionImpact}
          channelPerformance={channelData.kpis}
          campaign={campaignKpis}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <TrendChart data={trendData} granularity={granularity} onGranularityChange={setGranularity} />
          <GrowthComparison growth={growth} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ChannelPerformancePanel
            kpis={channelData.kpis}
            redemptionByChannel={channelData.redemptionByChannel}
            redemptionByReward={channelData.redemptionByReward}
          />
          <CampaignPerformancePanel kpis={campaignKpis} campaigns={campaigns} />
        </div>

        <BeforeAfterCampaign
          campaigns={campaigns}
          campaignId={filters.campaignId}
          onCampaignChange={(campaignId) => setFilters({ ...filters, campaignId })}
          before={beforeAfter.before}
          after={beforeAfter.after}
          windowDays={windowDays}
          onWindowDaysChange={setWindowDays}
        />
      </div>

      <ReconciliationPanel role={role} runs={reconRuns} onRun={handleReconciliationRun} />
    </div>
  );
}
