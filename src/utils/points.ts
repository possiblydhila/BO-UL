export function calculatePoints(transactionAmount: number, conversionUnit: number, multiplier: number) {
  if (conversionUnit <= 0) return 0;
  return Math.floor((transactionAmount / conversionUnit) * multiplier);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
