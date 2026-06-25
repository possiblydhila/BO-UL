import type { LucideIcon } from "lucide-react";

export type RouteKey =
  | "dashboard"
  | "users"
  | "earning-rules"
  | "redemption-rules"
  | "rewards"
  | "reporting";

export type SourceSystem = "all" | "saving" | "cardlink";
export type Channel = "all" | "wondr" | "atm" | "api" | "bni-direct" | "mbank" | "sms";
export type TransactionType =
  | "all"
  | "purchase"
  | "payment"
  | "ingoing-transfer"
  | "outgoing-transfer"
  | "va";

export type RuleStatus = "draft" | "in_review" | "scheduled" | "active" | "inactive" | "expired";
export type Role = "employee" | "approver";
export type RuleType =
  | "transactional"
  | "activity"
  | "tactical"
  | "personal_earning"
  | "third_party_points";

export type NavItem = {
  key: RouteKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type DashboardFilters = {
  startDate: string;
  endDate: string;
  channel: Channel;
  sourceSystem: SourceSystem;
  transactionType: TransactionType;
  campaignId: string;
};

export type KpiCard = {
  label: string;
  value: string;
  detail: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

export type TrendPoint = {
  period: string;
  cifEarn: number;
  cifRedeem: number;
  pointEarn: number;
  pointRedeem: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
};

export type CampaignSummary = {
  id: string;
  name: string;
  active: boolean;
  targetUsers: number;
  participants: number;
  beforeRedeem: number;
  afterRedeem: number;
};

export type DashboardData = {
  customerEngagement: KpiCard[];
  pointPerformance: KpiCard[];
  transactionImpact: KpiCard[];
  channelPerformance: KpiCard[];
  campaignCards: KpiCard[];
  trends: TrendPoint[];
  earningByActivity: DistributionPoint[];
  earningBySource: DistributionPoint[];
  redemptionByChannel: DistributionPoint[];
  redemptionByReward: DistributionPoint[];
  campaigns: CampaignSummary[];
};

export type RuleBase = {
  id: string;
  code: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  type: RuleType;
  status: RuleStatus;
  createdAt: string;
  totalCif: number;
  totalPoints: number;
  sourceSystem?: Exclude<SourceSystem, "all">;
  transactionType?: Exclude<TransactionType, "all">;
  channel?: Exclude<Channel, "all">;
};

export type EarningRule = RuleBase & {
  conversionUnit?: number;
  multiplier?: number;
  maxCapacity?: number;
  activityType?: string;
  rewardType?: "bonus_point" | "transactional";
};

export type RedemptionRule = RuleBase & {
  capType:
    | "cashback"
    | "discount"
    | "bill_payment"
    | "donasi"
    | "point_pihak_ketiga"
    | "kupon_undian"
    | "voucher"
    | "e_wallet"
    | "lelang"
    | "barang"
    | "annual_fee";
  valuePointPercentage: number;
  valueMin: number;
  valueMax: number;
  ruleTabId: string;
  sourceTypeId: string;
  updatedAt: string;
};
