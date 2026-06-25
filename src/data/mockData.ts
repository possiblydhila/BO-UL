import {
  BarChart3,
  FileBarChart,
  Gift,
  LayoutDashboard,
  Repeat2,
  ShieldCheck,
  Users,
} from "lucide-react";
import type {
  CampaignSummary,
  Channel,
  DashboardData,
  NavItem,
  SourceSystem,
  TransactionType,
} from "../types";
import type { Rule, RuleMode } from "../domain/rule";
import { statusLabels } from "../domain/ruleStatus";

export const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Analytics Dashboard",
    description: "Monitoring KPI loyalty, campaign, liability, dan channel.",
    icon: LayoutDashboard,
  },
  {
    key: "users",
    label: "User",
    description: "Daftar dan profil pengguna loyalty.",
    icon: Users,
  },
  {
    key: "earning-rules",
    label: "Earning Rule",
    description: "Konfigurasi aturan perolehan poin.",
    icon: ShieldCheck,
  },
  {
    key: "redemption-rules",
    label: "Redemption Rule",
    description: "Konfigurasi aturan penukaran poin.",
    icon: Repeat2,
  },
  {
    key: "rewards",
    label: "Rewards Points Management",
    description: "Katalog reward dan stok.",
    icon: Gift,
  },
  {
    key: "reporting",
    label: "Reporting",
    description: "Laporan operasional dan rekonsiliasi.",
    icon: FileBarChart,
  },
];

export const channelOptions: { value: Channel; label: string }[] = [
  { value: "all", label: "All channel" },
  { value: "wondr", label: "Wondr" },
  { value: "atm", label: "ATM" },
  { value: "api", label: "API - 0986" },
  { value: "bni-direct", label: "BNI Direct - 0989" },
  { value: "mbank", label: "Mbank - 0996" },
  { value: "sms", label: "SMS - 0992" },
];

export const sourceSystemOptions: { value: SourceSystem; label: string }[] = [
  { value: "all", label: "All source" },
  { value: "saving", label: "Saving" },
  { value: "cardlink", label: "Cardlink" },
];

export const savingTransactionTypeOptions: { value: TransactionType; label: string }[] = [
  { value: "all", label: "All transaction" },
  { value: "purchase", label: "Purchase" },
  { value: "payment", label: "Payment" },
  { value: "ingoing-transfer", label: "Ingoing transfer" },
  { value: "outgoing-transfer", label: "Outgoing transfer" },
  { value: "va", label: "Virtual account" },
];

export const ruleSourceSystemOptions = [
  { value: "saving", label: "Saving" },
  { value: "cardlink", label: "Cardlink" },
];

export const ruleTransactionTypeOptions = [
  { value: "purchase", label: "Purchase" },
  { value: "payment", label: "Payment" },
  { value: "tc-40", label: "TC 40" },
];

export const merchantCategoryOptions = [
  { value: "marketplace", label: "Marketplace" },
  { value: "retail", label: "Retail" },
  { value: "travel", label: "Travel" },
];

export const merchantNameOptions = [
  { value: "indomaret-tpfg-melati-jat", label: "Indomaret TPFG Melati Jat" },
  { value: "tokopedia", label: "Tokopedia" },
  { value: "traveloka", label: "Traveloka" },
];

export const cardTypeOptions = [
  { value: "bic-platinum-staff", label: "BIC Platinum Staff" },
  { value: "bic-co-cobranding-biru-a", label: "BIC Co Cobranding Biru A" },
  { value: "bic-gold", label: "BIC Gold" },
];

export const ruleChannelOptions = channelOptions.filter((option) => option.value !== "all");

export const maxCapacityTypeOptions = [
  { value: "per-transaksi", label: "Per transaksi" },
  { value: "per-fitur", label: "Per fitur" },
  { value: "per-user", label: "Per user" },
];

export const maxCapacityTimeframeOptions = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
];

export const targetUserOptions = [
  { value: "all", label: "All user" },
  { value: "limited", label: "Limited" },
];

export const rewardTypeOptions = [
  { value: "bonus_point", label: "Bonus point" },
  { value: "transactional", label: "Transactional" },
];

export const cobrandCardTypeOptions = [
  { value: "bic-co-cobranding-biru-a", label: "BIC Co-Branding Biru A" },
  { value: "bic-co-cobranding-biru-c", label: "BIC Co-Branding Biru C" },
  { value: "bic-co-cobranding-biru-d", label: "BIC Co-Branding Biru D" },
  { value: "bic-co-cobranding-biru-e", label: "BIC Co-Branding Biru E" },
];

export const thirdPartyProgramOptions = [
  { value: "map", label: "MAP" },
  { value: "garuda", label: "Garuda" },
  { value: "krisflyer", label: "KrisFlyer" },
];

export const operatorTypeOptions = [
  { value: "lt", label: "< (upper bound)" },
  { value: "range", label: "- (range)" },
  { value: "gt", label: "> (lower bound)" },
];

export const partnerCapTimeframeOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
];

export { statusLabels };

export const dashboardData: DashboardData = {
  customerEngagement: [
    { label: "CIF Earning MTD", value: "42.8K", detail: "Nasabah unik memperoleh poin", delta: "+8.2% MoM", trend: "up" },
    { label: "CIF Redeem MTD", value: "11.4K", detail: "Nasabah unik redeem poin", delta: "+3.1% MoM", trend: "up" },
    { label: "Redemption Rate by CIF", value: "26.6%", detail: "CIF redeem / CIF earning", delta: "-1.4% MoM", trend: "down" },
    { label: "Redemption Rate by Poin", value: "41.9%", detail: "Poin redeemed / poin issued", delta: "+2.7% MoM", trend: "up" },
  ],
  pointPerformance: [
    { label: "Total Poin Issued YTD", value: "1.28B", detail: "Earning point keseluruhan", delta: "+13.4% YoY", trend: "up" },
    { label: "Total Poin Redeemed YTD", value: "536M", detail: "Redeem point keseluruhan", delta: "+10.1% YoY", trend: "up" },
    { label: "Poin Balance Liability", value: "744M", detail: "Poin belum digunakan", delta: "Read-only", trend: "flat" },
    { label: "Expired Points YTD", value: "38.6M", detail: "Poin melewati masa berlaku", delta: "+4.8% YoY", trend: "up" },
    { label: "Estimated Point Cost", value: "Rp 2.7B", detail: "Placeholder sampai cost rule final", delta: "Needs rule", trend: "flat" },
  ],
  transactionImpact: [
    { label: "Top Aktivitas", value: "Payment", detail: "Kontribusi earning tertinggi", delta: "34.2% share", trend: "up" },
    { label: "Top Source", value: "Saving", detail: "Source earning tertinggi", delta: "62.5% share", trend: "up" },
  ],
  channelPerformance: [
    { label: "Top Redeem Channel", value: "Wondr", detail: "Poin redeem tertinggi", delta: "48.1% share", trend: "up" },
    { label: "Top Earn Channel", value: "API", detail: "Poin earn tertinggi", delta: "35.6% share", trend: "up" },
    { label: "Top Reward", value: "Voucher", detail: "Reward paling banyak diredeem", delta: "31.9% share", trend: "up" },
  ],
  campaignCards: [
    { label: "Campaign Aktif", value: "14", detail: "Campaign berjalan", delta: "+2 vs last month", trend: "up" },
    { label: "Participation Rate", value: "37.4%", detail: "Peserta / target user", delta: "+5.3% MoM", trend: "up" },
    { label: "Top Campaign", value: "HUT BNI", detail: "186.4K participants", delta: "Highest", trend: "flat" },
  ],
  trends: [
    { period: "Jan", cifEarn: 31200, cifRedeem: 7800, pointEarn: 158, pointRedeem: 61 },
    { period: "Feb", cifEarn: 32800, cifRedeem: 8200, pointEarn: 171, pointRedeem: 70 },
    { period: "Mar", cifEarn: 35400, cifRedeem: 9100, pointEarn: 184, pointRedeem: 76 },
    { period: "Apr", cifEarn: 38800, cifRedeem: 10100, pointEarn: 203, pointRedeem: 87 },
    { period: "May", cifEarn: 40700, cifRedeem: 10800, pointEarn: 219, pointRedeem: 91 },
    { period: "Jun", cifEarn: 42800, cifRedeem: 11400, pointEarn: 232, pointRedeem: 97 },
  ],
  earningByActivity: [
    { name: "Payment", value: 342 },
    { name: "Purchase", value: 278 },
    { name: "Transfer", value: 206 },
    { name: "VA", value: 96 },
  ],
  earningBySource: [
    { name: "Saving", value: 625 },
    { name: "Cardlink", value: 375 },
  ],
  redemptionByChannel: [
    { name: "Wondr", value: 481 },
    { name: "ATM", value: 196 },
    { name: "Mbank", value: 168 },
    { name: "API", value: 155 },
  ],
  redemptionByReward: [
    { name: "Voucher", value: 319 },
    { name: "E-wallet", value: 208 },
    { name: "Barang", value: 181 },
    { name: "Donasi", value: 94 },
    { name: "Annual fee", value: 63 },
  ],
  campaigns: [
    { id: "hut-bni", name: "HUT BNI", active: true, targetUsers: 498000, participants: 186400, beforeRedeem: 128, afterRedeem: 192 },
    { id: "survey-pelanggan", name: "Survey Pelanggan", active: true, targetUsers: 125000, participants: 41200, beforeRedeem: 62, afterRedeem: 88 },
    { id: "aktivasi-wondr", name: "Aktivasi Wondr", active: true, targetUsers: 320000, participants: 102900, beforeRedeem: 104, afterRedeem: 154 },
  ] satisfies CampaignSummary[],
};

export const rules: Rule[] = [
  {
    id: "ER-001",
    code: "EARN-PAY-001",
    name: "Payment Saving Multiplier",
    ruleMode: "EARN",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    type: "transactional",
    status: "active",
    createdAt: "2025-12-20 09:15",
    updatedAt: "2025-12-20 09:15",
    totalCif: 188420,
    totalPoints: 284500000,
    config: {
      ruleType: "transactional",
      sourceSystem: "saving",
      transactionType: "payment",
      channel: "wondr",
      conversionUnit: 100000,
      multiplier: 10,
      maxCapacity: 2000000,
    },
  },
  {
    id: "ER-002",
    code: "EARN-ACT-002",
    name: "Aktivasi Wondr Bonus",
    ruleMode: "EARN",
    periodStart: "2026-02-01",
    periodEnd: "2026-08-31",
    type: "activity",
    status: "scheduled",
    createdAt: "2026-01-12 14:32",
    updatedAt: "2026-01-12 14:32",
    totalCif: 64220,
    totalPoints: 6422000,
    config: {
      ruleType: "activity",
      activityType: "aktivasi wondr",
      receivePoint: 100,
    },
  },
  {
    id: "ER-003",
    code: "EARN-TAC-003",
    name: "HUT BNI Tactical Payment",
    ruleMode: "EARN",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
    type: "tactical",
    status: "in_review",
    createdAt: "2026-05-17 11:24",
    updatedAt: "2026-05-17 11:24",
    totalCif: 0,
    totalPoints: 0,
    config: {
      ruleType: "tactical",
      campaignName: "HUT BNI",
      rewardType: "transactional",
      transactional: {
        sourceSystem: "saving",
        transactionType: "purchase",
        channel: "api",
        conversionUnit: 100000,
        multiplier: 12,
      },
    },
  },
  {
    id: "ER-004",
    code: "EARN-PER-004",
    name: "Birthday Bonus Point",
    ruleMode: "EARN",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    type: "personal_earning",
    status: "draft",
    createdAt: "2026-01-04 10:04",
    updatedAt: "2026-01-04 10:04",
    totalCif: 0,
    totalPoints: 0,
    config: {
      ruleType: "personal_earning",
      personalType: "birthday",
      rewardType: "bonus_point",
      receivePoint: 100,
    },
  },
  {
    id: "ER-005",
    code: "EARN-TPP-005",
    name: "Garuda Miles Conversion",
    ruleMode: "EARN",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    type: "third_party_points",
    status: "expired",
    createdAt: "2024-12-21 15:45",
    updatedAt: "2024-12-21 15:45",
    totalCif: 18400,
    totalPoints: 926000,
    config: {
      ruleType: "third_party_points",
      cardTypes: ["bic-co-cobranding-biru-a", "bic-co-cobranding-biru-c"],
      partnerBlocks: [
        {
          thirdParty: "garuda",
          tiers: [
            { operatorType: "lt", transactionAmount: 100000, milesPoint: 2 },
            { operatorType: "range", transactionAmountMin: 100001, transactionAmountMax: 200000, milesPoint: 5 },
            { operatorType: "gt", transactionAmount: 200000, milesPoint: 10 },
          ],
          cap: { capType: "per-user", timeframe: "monthly", maxCapacity: 30 },
        },
      ],
    },
  },
  {
    id: "ER-006",
    code: "EARN-TRX-006",
    name: "Cardlink Retail Purchase",
    ruleMode: "EARN",
    periodStart: "2026-03-01",
    periodEnd: "2026-12-31",
    type: "transactional",
    status: "inactive",
    createdAt: "2026-02-18 13:10",
    updatedAt: "2026-02-18 13:10",
    totalCif: 34100,
    totalPoints: 82100000,
    config: {
      ruleType: "transactional",
      sourceSystem: "cardlink",
    },
  },
  {
    id: "RR-001",
    code: "RED-VCH-001",
    name: "Voucher Cashback",
    ruleMode: "REDEEM",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    type: "transactional",
    status: "active",
    createdAt: "2025-12-18 10:21",
    updatedAt: "2026-04-09 08:45",
    totalCif: 95400,
    totalPoints: 164000000,
    config: { ruleType: "transactional" },
    redemption: {
      capType: "voucher",
      valuePointPercentage: 100,
      valueMin: 50000,
      valueMax: 500000,
      ruleTabId: "TAB-01",
      sourceTypeId: "SRC-01",
    },
  },
  {
    id: "RR-002",
    code: "RED-EWL-002",
    name: "E-wallet Redemption",
    ruleMode: "REDEEM",
    periodStart: "2026-05-01",
    periodEnd: "2026-10-31",
    type: "tactical",
    status: "in_review",
    createdAt: "2026-04-18 16:04",
    updatedAt: "2026-04-22 12:14",
    totalCif: 0,
    totalPoints: 0,
    config: {
      ruleType: "tactical",
      campaignName: "E-wallet Promo",
      rewardType: "transactional",
    },
    redemption: {
      capType: "e_wallet",
      valuePointPercentage: 85,
      valueMin: 25000,
      valueMax: 250000,
      ruleTabId: "TAB-02",
      sourceTypeId: "SRC-02",
    },
  },
  {
    id: "RR-003",
    code: "RED-AFE-003",
    name: "Annual Fee Offset",
    ruleMode: "REDEEM",
    periodStart: "2026-07-01",
    periodEnd: "2026-12-31",
    type: "transactional",
    status: "scheduled",
    createdAt: "2026-05-28 09:50",
    updatedAt: "2026-06-02 09:50",
    totalCif: 0,
    totalPoints: 0,
    config: { ruleType: "transactional" },
    redemption: {
      capType: "annual_fee",
      valuePointPercentage: 100,
      valueMin: 100000,
      valueMax: 2000000,
      ruleTabId: "TAB-03",
      sourceTypeId: "SRC-03",
    },
  },
  {
    id: "RR-004",
    code: "RED-DON-004",
    name: "Donasi Point Program",
    ruleMode: "REDEEM",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    type: "activity",
    status: "draft",
    createdAt: "2026-02-05 11:11",
    updatedAt: "2026-02-05 11:11",
    totalCif: 0,
    totalPoints: 0,
    config: {
      ruleType: "activity",
      activityType: "donasi",
      receivePoint: 100,
    },
    redemption: {
      capType: "donasi",
      valuePointPercentage: 100,
      valueMin: 10000,
      valueMax: 100000,
      ruleTabId: "TAB-04",
      sourceTypeId: "SRC-04",
    },
  },
  {
    id: "RR-005",
    code: "RED-BRG-005",
    name: "Barang Catalogue Rule",
    ruleMode: "REDEEM",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    type: "transactional",
    status: "expired",
    createdAt: "2024-12-05 08:25",
    updatedAt: "2025-12-31 23:59",
    totalCif: 14800,
    totalPoints: 28000000,
    config: { ruleType: "transactional" },
    redemption: {
      capType: "barang",
      valuePointPercentage: 90,
      valueMin: 150000,
      valueMax: 1200000,
      ruleTabId: "TAB-05",
      sourceTypeId: "SRC-05",
    },
  },
];

export function getRulesByMode(mode: RuleMode): Rule[] {
  return rules.filter((rule) => rule.ruleMode === mode);
}

export const reportTabs = [
  "Earning Poin",
  "Redemption Poin",
  "Manual Adjustment",
  "Manual Redemption",
  "Hasil pemrosesan pembukuan",
  "Hasil rekonsiliasi sistem",
];

export const auditNotes = [
  "Metric formulas need sign-off: redemption rate by point vs by CIF, point balance liability, expired points, participation rate, growth, and campaign comparison.",
  "Cost is mentioned in the CSV description but no KPI definition exists, so Estimated Point Cost is a placeholder.",
  "Real-time SLA is undefined; this prototype shows Last updated: just now without polling.",
  "Filter option sources are mocked. Transaction type is only enabled when source system is Saving.",
  "Drill-down targets are not specified, so View details actions are intentionally non-functional.",
  "Reconciliation is referenced operationally but remains in Reporting until workflow ownership is defined.",
  "Before/after campaign comparison requires a selected campaign and baseline period; this prototype uses mock campaign periods.",
  "Liability and expired points are read-only because they likely need finance governance and audit trails.",
];

export const sourceSystemLabel = {
  saving: "Saving",
  cardlink: "Cardlink",
};

export const barChartIcon = BarChart3;
