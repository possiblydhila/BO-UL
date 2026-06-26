import type { Channel, RuleStatus, RuleType, RuleTransactionType, SourceSystem } from "../types";

export type RuleMode = "EARN" | "REDEEM";

export type CapType =
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

export type RedemptionHeader = {
  capType: CapType;
  valuePointPercentage: number;
  valueMin: number;
  valueMax: number;
  ruleTabId?: string;
  sourceTypeId?: string;
};

export type CapDefinition = {
  capType: "per-transaksi" | "per-fitur" | "per-user";
  timeframe: "daily" | "weekly" | "monthly" | "annually";
  maxCapacity: number;
};

export type TimeframeMaxCapacity = {
  daily?: number;
  monthly?: number;
  annually?: number;
};

export type TransactionalFields = {
  sourceSystem?: Exclude<SourceSystem, "all">;
  transactionType?: RuleTransactionType;
  channel?: Exclude<Channel, "all">;
  merchantCategory?: string;
  merchantName?: string;
  binPrefixes?: string[];
  conversionUnit?: number;
  multiplier?: number;
  maxCapacity?: number;
  maxCapacityType?: string;
  maxCapacityByTimeframe?: TimeframeMaxCapacity;
};

export type TransactionalConfig = TransactionalFields & {
  ruleType: "transactional";
};

export type ActivityConfig = {
  ruleType: "activity";
  activityType?: string;
  amount?: number;
  receivePoint?: number;
};

export type TacticalConfig = {
  ruleType: "tactical";
  campaignName?: string;
  targetUser?: string;
  rewardType?: "bonus_point" | "transactional";
  receivePoint?: number;
  transactional?: TransactionalFields;
};

export type PersonalEarningConfig = {
  ruleType: "personal_earning";
  personalType?: string;
  targetUser?: string;
  rewardType?: "bonus_point" | "transactional";
  receivePoint?: number;
};

export type PartnerTier = {
  operatorType: "lt" | "range" | "gt";
  transactionAmount?: number;
  transactionAmountMin?: number;
  transactionAmountMax?: number;
  milesPoint: number;
};

export type PartnerBlock = {
  thirdParty: string;
  cardTypes?: string[];
  tiers: PartnerTier[];
  cap: CapDefinition;
};

export type ThirdPartyPointsConfig = {
  ruleType: "third_party_points";
  binPrefixes: string[];
  partnerBlocks: PartnerBlock[];
};

export type RuleConfig =
  | TransactionalConfig
  | ActivityConfig
  | TacticalConfig
  | PersonalEarningConfig
  | ThirdPartyPointsConfig;

export type Rule = {
  id: string;
  code: string;
  name: string;
  ruleMode: RuleMode;
  type: RuleType;
  periodStart: string;
  periodEnd: string;
  status: RuleStatus;
  createdAt: string;
  updatedAt: string;
  totalCif: number;
  totalPoints: number;
  config: RuleConfig;
  redemption?: RedemptionHeader;
};

export function formatCapType(value: CapType) {
  return value.replace(/_/g, " ");
}

export const redemptionCapTypeOptions: { value: CapType; label: string }[] = [
  { value: "cashback", label: "cashback" },
  { value: "discount", label: "discount" },
  { value: "bill_payment", label: "bill payment" },
  { value: "donasi", label: "donasi" },
  { value: "point_pihak_ketiga", label: "point pihak ketiga" },
  { value: "kupon_undian", label: "kupon undian" },
  { value: "voucher", label: "voucher" },
  { value: "e_wallet", label: "e wallet" },
  { value: "lelang", label: "lelang" },
  { value: "barang", label: "barang" },
  { value: "annual_fee", label: "annual fee" },
];
