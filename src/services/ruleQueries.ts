import type { Rule, RuleMode } from "../domain/rule";
import type { RuleStatus, RuleType } from "../types";

export type RuleFilter = {
  mode?: RuleMode;
  status?: RuleStatus | "all";
  type?: RuleType | "all";
  query?: string;
};

export function filterRules(rules: Rule[], filter: RuleFilter): Rule[] {
  const lowered = filter.query?.trim().toLowerCase() ?? "";
  return rules.filter((rule) => {
    if (filter.mode && rule.ruleMode !== filter.mode) return false;
    if (filter.status && filter.status !== "all" && rule.status !== filter.status) return false;
    if (filter.type && filter.type !== "all" && rule.type !== filter.type) return false;
    if (
      lowered &&
      !rule.name.toLowerCase().includes(lowered) &&
      !rule.code.toLowerCase().includes(lowered) &&
      !rule.id.toLowerCase().includes(lowered)
    ) {
      return false;
    }
    return true;
  });
}

export function summarizeByStatus(rules: Rule[]): Record<RuleStatus, number> {
  const counts: Record<RuleStatus, number> = {
    draft: 0,
    in_review: 0,
    scheduled: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  };
  for (const rule of rules) {
    counts[rule.status] += 1;
  }
  return counts;
}

export function getRulesByMode(rules: Rule[], mode: RuleMode): Rule[] {
  return rules.filter((rule) => rule.ruleMode === mode);
}
