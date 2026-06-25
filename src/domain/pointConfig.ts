export type ExpiredDurationUnit = "monthly" | "quarterly" | "yearly";

export type PointConfig = {
  pointLogo: string;
  pointName: string;
  /** Rolling TTL: each earn batch expires this long after the earn date. */
  expiredDurationValue: number;
  expiredDurationUnit: ExpiredDurationUnit;
  /** Annual balance reset: all remaining points zeroed on this calendar date. */
  annualBalanceResetMonth: number;
  annualBalanceResetDay: number;
  /** Time of day (WIB) when the annual balance reset job runs. */
  resetTime: string;
  updatedBy: string;
  updatedAt: string;
};

export const expiredDurationUnitLabels: Record<ExpiredDurationUnit, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatAnnualBalanceResetDate(month: number, day: number): string {
  const label = monthNames[month - 1];
  return label ? `${label} ${day}` : `${month}/${day}`;
}

export function formatExpiryPolicySummary(config: PointConfig): string {
  const rolling = `Rolling expiry: ${config.expiredDurationValue} ${expiredDurationUnitLabels[config.expiredDurationUnit].toLowerCase()} from earn date`;
  const annual = `Annual balance reset: ${formatAnnualBalanceResetDate(config.annualBalanceResetMonth, config.annualBalanceResetDay)} at ${config.resetTime} WIB`;
  return `${rolling} · ${annual}`;
}
