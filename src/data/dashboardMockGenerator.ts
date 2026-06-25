import { addDays, format, subMonths } from "date-fns";
import type {
  Campaign,
  PointTransaction,
  RewardType,
  TxnChannel,
  TxnSourceSystem,
  TxnTransactionType,
} from "../types";

/**
 * In production this data would be served from pre-aggregated rollup tables of a
 * CDC-fed data mart (10–15 min refresh), not computed client-side. This mock
 * layer stands in for that mart's output for prototype purposes.
 */

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHANNELS: TxnChannel[] = ["API", "Wondr", "SMS", "BNI Direct", "Mbank", "ATM"];
const SOURCES: TxnSourceSystem[] = ["saving", "cardlink"];
const TXN_TYPES: TxnTransactionType[] = [
  "purchase",
  "payment",
  "ingoing_transfer",
  "outgoing_transfer",
  "va",
];
const REWARD_TYPES: RewardType[] = ["voucher", "barang", "donasi", "cashback", "e-wallet"];

const CAMPAIGN_DEFS = [
  { id: "hut-bni", name: "HUT BNI", monthsAgo: 2, durationDays: 30, target: 498000, participation: 0.37 },
  { id: "survey-pelanggan", name: "Survey Pelanggan", monthsAgo: 4, durationDays: 45, target: 125000, participation: 0.33 },
  { id: "aktivasi-wondr", name: "Aktivasi Wondr", monthsAgo: 1, durationDays: 60, target: 320000, participation: 0.32 },
  { id: "cashback-q2", name: "Cashback Q2", monthsAgo: 6, durationDays: 90, target: 200000, participation: 0.28 },
  { id: "donasi-ramadan", name: "Donasi Ramadan", monthsAgo: 8, durationDays: 30, target: 85000, participation: 0.41 },
  { id: "e-wallet-bonus", name: "E-Wallet Bonus", monthsAgo: 3, durationDays: 21, target: 150000, participation: 0.25 },
  { id: "voucher-merchant", name: "Voucher Merchant", monthsAgo: 10, durationDays: 14, target: 95000, participation: 0.19 },
];

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function generateCifPool(seed: number, count: number): string[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => `CIF${String(100000 + i).padStart(6, "0")}`);
}

export function generateMockCampaigns(cifPool: string[], seed = 42): Campaign[] {
  const rng = mulberry32(seed + 1);
  const today = new Date("2026-06-25");

  return CAMPAIGN_DEFS.map((def) => {
    const start = subMonths(today, def.monthsAgo);
    const end = addDays(start, def.durationDays);
    const participantCount = Math.min(
      cifPool.length,
      Math.floor(def.target * def.participation * (0.9 + rng() * 0.2)),
    );
    const shuffled = [...cifPool].sort(() => rng() - 0.5);
    const participantCifIds = shuffled.slice(0, participantCount);
    const status = end < today ? "ended" : "active";

    return {
      id: def.id,
      name: def.name,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      targetUserCount: def.target,
      participantCifIds,
      status,
    } satisfies Campaign;
  });
}

export function generateMockTransactions(seed = 42): PointTransaction[] {
  const rng = mulberry32(seed);
  const cifPool = generateCifPool(seed, 380);
  const campaigns = generateMockCampaigns(cifPool, seed);
  const today = new Date("2026-06-25");
  const startDate = subMonths(today, 13);

  const cifBalances = new Map<string, number>();
  const cifEverEarned = new Set<string>();
  const transactions: PointTransaction[] = [];
  let idCounter = 1;

  const addTxn = (txn: Omit<PointTransaction, "id">) => {
    transactions.push({ ...txn, id: `TXN-${String(idCounter++).padStart(6, "0")}` });
  };

  let current = startDate;
  while (current <= today) {
    const dateStr = format(current, "yyyy-MM-dd");
    const dayFactor = 0.6 + rng() * 0.8;
    const dailyCount = Math.floor(8 * dayFactor + rng() * 12);

    for (let i = 0; i < dailyCount; i++) {
      const cifId = pick(rng, cifPool);
      const sourceSystem = rng() < 0.62 ? "saving" : "cardlink";
      const channel = pick(rng, CHANNELS);
      const campaign = rng() < 0.15 ? pick(rng, campaigns) : undefined;
      const points = Math.floor(50 + rng() * 2500);

      addTxn({
        date: dateStr,
        cifId,
        direction: "EARN",
        points,
        channel,
        sourceSystem,
        transactionType: sourceSystem === "saving" ? pick(rng, TXN_TYPES) : undefined,
        campaignId: campaign?.id,
      });

      cifBalances.set(cifId, (cifBalances.get(cifId) ?? 0) + points);
      cifEverEarned.add(cifId);
    }

    // Redemptions — only for CIFs with balance
    const redeemCount = Math.floor(dailyCount * (0.18 + rng() * 0.12));
    for (let i = 0; i < redeemCount; i++) {
      const eligible = [...cifBalances.entries()].filter(([, bal]) => bal > 0);
      if (eligible.length === 0) break;

      const [cifId, balance] = pick(rng, eligible);
      const redeemPoints = Math.min(balance, Math.floor(30 + rng() * Math.min(balance, 1800)));
      if (redeemPoints <= 0) continue;

      addTxn({
        date: dateStr,
        cifId,
        direction: "REDEEM",
        points: redeemPoints,
        channel: pick(rng, CHANNELS),
        sourceSystem: pick(rng, SOURCES),
        rewardType: pick(rng, REWARD_TYPES),
      });

      cifBalances.set(cifId, balance - redeemPoints);
    }

    // Expirations — occasional, only on positive balances
    if (rng() < 0.08) {
      const eligible = [...cifBalances.entries()].filter(([, bal]) => bal > 100);
      if (eligible.length > 0) {
        const [cifId, balance] = pick(rng, eligible);
        const expirePoints = Math.floor(balance * (0.05 + rng() * 0.15));
        if (expirePoints > 0) {
          addTxn({
            date: dateStr,
            cifId,
            direction: "EXPIRE",
            points: expirePoints,
            channel: pick(rng, CHANNELS),
            sourceSystem: pick(rng, SOURCES),
          });
          cifBalances.set(cifId, balance - expirePoints);
        }
      }
    }

    current = addDays(current, 1);
  }

  return transactions;
}
