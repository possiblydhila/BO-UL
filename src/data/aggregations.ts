import {
  addDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import type {
  Campaign,
  Channel,
  ComputedKpi,
  DashboardFilters,
  DistributionPoint,
  PointTransaction,
  TbdKpi,
  TransactionType,
  TrendGranularity,
  TrendPoint,
  TxnChannel,
  TxnTransactionType,
} from "../types";
import { formatCompact, formatNumber } from "../utils/points";

const CHANNEL_MAP: Record<Exclude<Channel, "all">, TxnChannel> = {
  wondr: "Wondr",
  atm: "ATM",
  api: "API",
  "bni-direct": "BNI Direct",
  mbank: "Mbank",
  sms: "SMS",
};

const TXN_TYPE_MAP: Record<Exclude<TransactionType, "all">, TxnTransactionType> = {
  purchase: "purchase",
  payment: "payment",
  "ingoing-transfer": "ingoing_transfer",
  "outgoing-transfer": "outgoing_transfer",
  va: "va",
};

const TXN_TYPE_LABELS: Record<TxnTransactionType, string> = {
  purchase: "Purchase",
  payment: "Payment",
  ingoing_transfer: "Ingoing transfer",
  outgoing_transfer: "Outgoing transfer",
  va: "Virtual account",
};

function inDateRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function filterTransactions(
  transactions: PointTransaction[],
  filters: DashboardFilters,
): PointTransaction[] {
  return transactions.filter((txn) => {
    if (!inDateRange(txn.date, filters.startDate, filters.endDate)) return false;
    if (filters.channel !== "all" && txn.channel !== CHANNEL_MAP[filters.channel]) return false;
    if (filters.sourceSystem !== "all" && txn.sourceSystem !== filters.sourceSystem) return false;
    if (
      filters.transactionType !== "all" &&
      filters.sourceSystem === "saving" &&
      txn.transactionType !== TXN_TYPE_MAP[filters.transactionType]
    ) {
      return false;
    }
    return true;
  });
}

function distinctCifs(txns: PointTransaction[], direction?: PointTransaction["direction"]): Set<string> {
  const filtered = direction ? txns.filter((t) => t.direction === direction) : txns;
  return new Set(filtered.map((t) => t.cifId));
}

function sumPoints(txns: PointTransaction[], direction: PointTransaction["direction"]): number {
  return txns.filter((t) => t.direction === direction).reduce((sum, t) => sum + t.points, 0);
}

function computeLiability(allTxns: PointTransaction[], asOfDate: string): number {
  const relevant = allTxns.filter((t) => t.date <= asOfDate);
  const earned = sumPoints(relevant, "EARN");
  const redeemed = sumPoints(relevant, "REDEEM");
  const expired = sumPoints(relevant, "EXPIRE");
  return earned - redeemed - expired;
}

function trendFromDelta(delta: number): "up" | "down" | "flat" {
  if (delta > 0.005) return "up";
  if (delta < -0.005) return "down";
  return "flat";
}

function formatPeriodLabel(filters: DashboardFilters): string {
  return `${format(parseISO(filters.startDate), "d MMM")} – ${format(parseISO(filters.endDate), "d MMM yyyy")}`;
}

export function computeSparkline(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
  metric: "cifEarn" | "cifRedeem" | "pointEarn" | "pointRedeem" | "expired" | "liability",
): number[] {
  const end = parseISO(filters.endDate);
  const buckets: string[] = [];
  for (let i = 11; i >= 0; i--) {
    buckets.push(format(subMonths(end, i), "yyyy-MM"));
  }

  return buckets.map((monthKey) => {
    const monthStart = `${monthKey}-01`;
    const monthEnd = format(endOfMonth(parseISO(monthStart)), "yyyy-MM-dd");
    const monthTxns = allTxns.filter((t) => inDateRange(t.date, monthStart, monthEnd));

    switch (metric) {
      case "cifEarn":
        return distinctCifs(monthTxns, "EARN").size;
      case "cifRedeem":
        return distinctCifs(monthTxns, "REDEEM").size;
      case "pointEarn":
        return sumPoints(monthTxns, "EARN");
      case "pointRedeem":
        return sumPoints(monthTxns, "REDEEM");
      case "expired":
        return sumPoints(monthTxns, "EXPIRE");
      case "liability":
        return computeLiability(allTxns, monthEnd);
      default:
        return 0;
    }
  });
}

export function computeCustomerEngagement(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): { kpis: (ComputedKpi | TbdKpi)[] } {
  const filtered = filterTransactions(allTxns, filters);
  const period = formatPeriodLabel(filters);
  const cifEarn = distinctCifs(filtered, "EARN").size;
  const cifRedeem = distinctCifs(filtered, "REDEEM").size;

  const lifetimeEarned = distinctCifs(allTxns, "EARN");
  const lifetimeRedeemed = distinctCifs(allTxns, "REDEEM");
  const redemptionRateCif =
    lifetimeEarned.size > 0 ? (lifetimeRedeemed.size / lifetimeEarned.size) * 100 : 0;

  return {
    kpis: [
      {
        label: "CIF Earning",
        value: formatCompact(cifEarn),
        detail: `Distinct CIFs with EARN · ${period}`,
        trend: "up",
        sparkline: computeSparkline(allTxns, filters, "cifEarn"),
      },
      {
        label: "CIF Redeem",
        value: formatCompact(cifRedeem),
        detail: `Distinct CIFs with REDEEM · ${period}`,
        trend: "up",
        sparkline: computeSparkline(allTxns, filters, "cifRedeem"),
      },
      {
        label: "Redemption rate (by CIF)",
        value: `${redemptionRateCif.toFixed(1)}%`,
        detail: "Lifetime: redeemed CIFs ÷ earned CIFs",
        trend: trendFromDelta(redemptionRateCif - 25),
        sparkline: computeSparkline(allTxns, filters, "cifRedeem").map((v, i, arr) =>
          arr[i]! > 0 && computeSparkline(allTxns, filters, "cifEarn")[i]! > 0
            ? (v / computeSparkline(allTxns, filters, "cifEarn")[i]!) * 100
            : 0,
        ),
      },
      {
        label: "Redemption rate (by point)",
        status: "tbd",
        detail: "Definition pending",
      },
    ],
  };
}

export function computePointPerformance(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): ComputedKpi[] {
  const filtered = filterTransactions(allTxns, filters);
  const period = formatPeriodLabel(filters);
  const issued = sumPoints(filtered, "EARN");
  const redeemed = sumPoints(filtered, "REDEEM");
  const expired = sumPoints(filtered, "EXPIRE");
  const liability = computeLiability(allTxns, filters.endDate);

  return [
    {
      label: "Points issued",
      value: formatCompact(issued),
      detail: `Sum of EARN · ${period}`,
      trend: "up",
      sparkline: computeSparkline(allTxns, filters, "pointEarn"),
    },
    {
      label: "Points redeemed",
      value: formatCompact(redeemed),
      detail: `Sum of REDEEM · ${period}`,
      trend: "up",
      sparkline: computeSparkline(allTxns, filters, "pointRedeem"),
    },
    {
      label: "Point balance / liability",
      value: formatCompact(liability),
      detail: `Cumulative EARN − REDEEM − EXPIRE as of ${format(parseISO(filters.endDate), "d MMM yyyy")}`,
      trend: "flat",
      sparkline: computeSparkline(allTxns, filters, "liability"),
    },
    {
      label: "Expired points",
      value: formatCompact(expired),
      detail: `Sum of EXPIRE · ${period}`,
      trend: "up",
      sparkline: computeSparkline(allTxns, filters, "expired"),
    },
  ];
}

export function computeCostPlaceholder(): TbdKpi {
  return {
    label: "Cost",
    status: "tbd",
    detail: "Cost — definition pending with business team",
  };
}

export function computeTransactionImpact(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): ComputedKpi[] {
  const filtered = filterTransactions(allTxns, filters).filter((t) => t.direction === "EARN");
  const period = formatPeriodLabel(filters);

  const byType = new Map<TxnTransactionType, number>();
  const bySource = new Map<string, number>();

  for (const txn of filtered) {
    if (txn.sourceSystem === "saving" && txn.transactionType) {
      byType.set(txn.transactionType, (byType.get(txn.transactionType) ?? 0) + txn.points);
    }
    bySource.set(txn.sourceSystem, (bySource.get(txn.sourceSystem) ?? 0) + txn.points);
  }

  const topType = [...byType.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSource = [...bySource.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalType = [...byType.values()].reduce((s, v) => s + v, 0);
  const totalSource = [...bySource.values()].reduce((s, v) => s + v, 0);

  return [
    {
      label: "Earning per transaction type",
      value: topType ? TXN_TYPE_LABELS[topType[0]] : "—",
      detail: topType
        ? `${formatCompact(topType[1])} pts · ${totalType > 0 ? ((topType[1] / totalType) * 100).toFixed(1) : 0}% share · Saving only · ${period}`
        : `No saving EARN in period`,
      trend: "up",
      sparkline: [],
    },
    {
      label: "Earning per source",
      value: topSource ? (topSource[0] === "saving" ? "Saving" : "Cardlink") : "—",
      detail: topSource
        ? `${formatCompact(topSource[1])} pts · ${totalSource > 0 ? ((topSource[1] / totalSource) * 100).toFixed(1) : 0}% share · ${period}`
        : `No EARN in period`,
      trend: "up",
      sparkline: [],
    },
  ];
}

export function computeChannelPerformance(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): {
  kpis: ComputedKpi[];
  redemptionByChannel: DistributionPoint[];
  redemptionByReward: DistributionPoint[];
} {
  const filtered = filterTransactions(allTxns, filters);
  const period = formatPeriodLabel(filters);

  const earnByChannel = new Map<string, number>();
  const redeemByChannel = new Map<string, number>();
  const redeemByReward = new Map<string, number>();

  for (const txn of filtered) {
    if (txn.direction === "EARN") {
      earnByChannel.set(txn.channel, (earnByChannel.get(txn.channel) ?? 0) + txn.points);
    }
    if (txn.direction === "REDEEM") {
      redeemByChannel.set(txn.channel, (redeemByChannel.get(txn.channel) ?? 0) + txn.points);
      if (txn.rewardType) {
        redeemByReward.set(txn.rewardType, (redeemByReward.get(txn.rewardType) ?? 0) + txn.points);
      }
    }
  }

  const topEarn = [...earnByChannel.entries()].sort((a, b) => b[1] - a[1])[0];
  const topRedeem = [...redeemByChannel.entries()].sort((a, b) => b[1] - a[1])[0];
  const topReward = [...redeemByReward.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalRedeemChannel = [...redeemByChannel.values()].reduce((s, v) => s + v, 0);

  const redemptionByChannel: DistributionPoint[] = [...redeemByChannel.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const redemptionByReward: DistributionPoint[] = [...redeemByReward.entries()]
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  return {
    kpis: [
      {
        label: "Redemption per channel",
        value: topRedeem ? topRedeem[0] : "—",
        detail: topRedeem
          ? `${formatCompact(topRedeem[1])} pts · ${totalRedeemChannel > 0 ? ((topRedeem[1] / totalRedeemChannel) * 100).toFixed(1) : 0}% of channel redeem · ${period}`
          : "No REDEEM in period",
        trend: "up",
        sparkline: [],
      },
      {
        label: "Top channel by earn",
        value: topEarn ? topEarn[0] : "—",
        detail: topEarn ? `${formatCompact(topEarn[1])} pts · ${period}` : "No EARN in period",
        trend: "up",
        sparkline: [],
      },
      {
        label: "Top channel by redeem",
        value: topRedeem ? topRedeem[0] : "—",
        detail: topRedeem ? `${formatCompact(topRedeem[1])} pts · ${period}` : "No REDEEM in period",
        trend: "up",
        sparkline: [],
      },
      {
        label: "Top reward type",
        value: topReward ? topReward[0].charAt(0).toUpperCase() + topReward[0].slice(1) : "—",
        detail: topReward ? `${formatCompact(topReward[1])} pts · ${period}` : "No REDEEM in period",
        trend: "up",
        sparkline: [],
      },
    ],
    redemptionByChannel,
    redemptionByReward,
  };
}

export function computeCampaignKpis(campaigns: Campaign[]): ComputedKpi[] {
  const active = campaigns.filter((c) => c.status === "active");
  const participationRates = campaigns.map(
    (c) => (c.targetUserCount > 0 ? c.participantCifIds.length / c.targetUserCount : 0) * 100,
  );
  const avgParticipation =
    participationRates.length > 0
      ? participationRates.reduce((s, v) => s + v, 0) / participationRates.length
      : 0;

  const topCampaign = [...campaigns].sort(
    (a, b) => b.participantCifIds.length - a.participantCifIds.length,
  )[0];

  return [
    {
      label: "Active campaign count",
      value: String(active.length),
      detail: `${campaigns.length} total campaigns`,
      trend: active.length > 0 ? "up" : "flat",
      sparkline: [],
    },
    {
      label: "Participation rate",
      value: `${avgParticipation.toFixed(1)}%`,
      detail: "Average participants ÷ target across campaigns",
      trend: "up",
      sparkline: [],
    },
    {
      label: "Top campaign",
      value: topCampaign?.name ?? "—",
      detail: topCampaign
        ? `${formatNumber(topCampaign.participantCifIds.length)} participants`
        : "No campaigns",
      trend: "flat",
      sparkline: [],
    },
  ];
}

function bucketKey(date: string, granularity: TrendGranularity): string {
  const d = parseISO(date);
  if (granularity === "daily") return format(d, "yyyy-MM-dd");
  if (granularity === "weekly") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(startOfMonth(d), "yyyy-MM");
}

function bucketLabel(key: string, granularity: TrendGranularity): string {
  const d = parseISO(key.length === 7 ? `${key}-01` : key);
  if (granularity === "daily") return format(d, "d MMM");
  if (granularity === "weekly") return `W/C ${format(d, "d MMM")}`;
  return format(d, "MMM yyyy");
}

export function computeTrendSeries(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
  granularity: TrendGranularity,
): TrendPoint[] {
  const filtered = filterTransactions(allTxns, filters);
  const buckets = new Map<
    string,
    { cifEarn: Set<string>; cifRedeem: Set<string>; pointEarn: number; pointRedeem: number }
  >();

  for (const txn of filtered) {
    const key = bucketKey(txn.date, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { cifEarn: new Set(), cifRedeem: new Set(), pointEarn: 0, pointRedeem: 0 });
    }
    const bucket = buckets.get(key)!;
    if (txn.direction === "EARN") {
      bucket.cifEarn.add(txn.cifId);
      bucket.pointEarn += txn.points;
    }
    if (txn.direction === "REDEEM") {
      bucket.cifRedeem.add(txn.cifId);
      bucket.pointRedeem += txn.points;
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      period: bucketLabel(key, granularity),
      cifEarn: data.cifEarn.size,
      cifRedeem: data.cifRedeem.size,
      pointEarn: Math.round(data.pointEarn / 1_000_000),
      pointRedeem: Math.round(data.pointRedeem / 1_000_000),
    }));
}

export type GrowthResult = {
  momEarn: number;
  momRedeem: number;
  yoyEarn: number;
  yoyRedeem: number;
};

export function computeGrowth(allTxns: PointTransaction[], filters: DashboardFilters): GrowthResult {
  const end = parseISO(filters.endDate);
  const currentStart = filters.startDate;
  const currentEnd = filters.endDate;

  const priorMonthEnd = format(subMonths(end, 1), "yyyy-MM-dd");
  const priorMonthStart = format(startOfMonth(subMonths(end, 1)), "yyyy-MM-dd");

  const priorYearEnd = format(subYears(end, 1), "yyyy-MM-dd");
  const priorYearStart = format(subYears(parseISO(currentStart), 1), "yyyy-MM-dd");

  const current = filterTransactions(allTxns, { ...filters, startDate: currentStart, endDate: currentEnd });
  const priorMonth = filterTransactions(allTxns, {
    ...filters,
    startDate: priorMonthStart,
    endDate: priorMonthEnd,
  });
  const priorYear = filterTransactions(allTxns, {
    ...filters,
    startDate: priorYearStart,
    endDate: priorYearEnd,
  });

  const pct = (current: number, prior: number) => (prior > 0 ? ((current - prior) / prior) * 100 : 0);

  return {
    momEarn: pct(sumPoints(current, "EARN"), sumPoints(priorMonth, "EARN")),
    momRedeem: pct(sumPoints(current, "REDEEM"), sumPoints(priorMonth, "REDEEM")),
    yoyEarn: pct(sumPoints(current, "EARN"), sumPoints(priorYear, "EARN")),
    yoyRedeem: pct(sumPoints(current, "REDEEM"), sumPoints(priorYear, "REDEEM")),
  };
}

export function computeBeforeAfterCampaign(
  allTxns: PointTransaction[],
  campaigns: Campaign[],
  campaignId: string,
  windowDays: number,
  filters: DashboardFilters,
): { before: number; after: number; campaignName: string } {
  const campaign = campaigns.find((c) => c.id === campaignId) ?? campaigns[0];
  if (!campaign) return { before: 0, after: 0, campaignName: "—" };

  const start = parseISO(campaign.startDate);
  const beforeStart = format(addDays(start, -windowDays), "yyyy-MM-dd");
  const beforeEnd = format(addDays(start, -1), "yyyy-MM-dd");
  const afterStart = campaign.startDate;
  const afterEnd = format(addDays(start, windowDays - 1), "yyyy-MM-dd");

  const baseFilter = { ...filters, channel: filters.channel, sourceSystem: filters.sourceSystem };

  const beforeTxns = filterTransactions(allTxns, {
    ...baseFilter,
    startDate: beforeStart,
    endDate: beforeEnd,
  }).filter((t) => t.direction === "EARN");

  const afterTxns = filterTransactions(allTxns, {
    ...baseFilter,
    startDate: afterStart,
    endDate: afterEnd,
  }).filter((t) => t.direction === "EARN");

  return {
    before: sumPoints(beforeTxns, "EARN"),
    after: sumPoints(afterTxns, "EARN"),
    campaignName: campaign.name,
  };
}

export function earningByTransactionType(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): DistributionPoint[] {
  const filtered = filterTransactions(allTxns, filters).filter(
    (t) => t.direction === "EARN" && t.sourceSystem === "saving" && t.transactionType,
  );
  const map = new Map<string, number>();
  for (const txn of filtered) {
    const label = TXN_TYPE_LABELS[txn.transactionType!];
    map.set(label, (map.get(label) ?? 0) + txn.points);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value / 1_000_000) }))
    .sort((a, b) => b.value - a.value);
}

export function earningBySource(
  allTxns: PointTransaction[],
  filters: DashboardFilters,
): DistributionPoint[] {
  const filtered = filterTransactions(allTxns, filters).filter((t) => t.direction === "EARN");
  const map = new Map<string, number>();
  for (const txn of filtered) {
    const label = txn.sourceSystem === "saving" ? "Saving" : "Cardlink";
    map.set(label, (map.get(label) ?? 0) + txn.points);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value / 1_000_000) }))
    .sort((a, b) => b.value - a.value);
}
