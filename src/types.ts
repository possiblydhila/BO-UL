import type { LucideIcon } from "lucide-react";

export type RouteKey =
  | "dashboard"
  | "point-config"
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

export type TxnSourceSystem = "saving" | "cardlink";
export type TxnChannel = "API" | "Wondr" | "SMS" | "BNI Direct" | "Mbank" | "ATM";
export type TxnTransactionType =
  | "purchase"
  | "payment"
  | "ingoing_transfer"
  | "outgoing_transfer"
  | "va";
export type RewardType = "voucher" | "barang" | "donasi" | "cashback" | "e-wallet";
export type PointDirection = "EARN" | "REDEEM" | "EXPIRE";

export type RuleStatus = "draft" | "in_review" | "scheduled" | "active" | "inactive" | "expired";
export type Role = "employee" | "approver";
export type DashboardRole = "employee" | "approver" | "admin";
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

export type PointTransaction = {
  id: string;
  date: string;
  cifId: string;
  direction: PointDirection;
  points: number;
  channel: TxnChannel;
  sourceSystem: TxnSourceSystem;
  transactionType?: TxnTransactionType;
  rewardType?: RewardType;
  campaignId?: string;
};

export type Campaign = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetUserCount: number;
  participantCifIds: string[];
  status: "active" | "ended";
};

export type ReconciliationRun = {
  timestamp: string;
  status: "completed";
  recordsChecked: number;
  mismatchesFound: number;
};

export type TrendGranularity = "daily" | "weekly" | "monthly";

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

export type KpiTrend = "up" | "down" | "flat";

export type ComputedKpi = {
  label: string;
  value: string;
  detail: string;
  trend: KpiTrend;
  sparkline?: number[];
};

export type TbdKpi = {
  label: string;
  status: "tbd";
  detail: string;
};

export type { CapType, RedemptionHeader, Rule, RuleConfig, RuleMode } from "./domain/rule";
export type { ExpiredDurationUnit, PointConfig } from "./domain/pointConfig";
