import type { CapType, RedemptionHeader, Rule, RuleMode } from "../domain/rule";
import { createDefaultConfig } from "../domain/ruleConfig";
import type { RuleType } from "../types";

export type RuleFormValues = {
  name: string;
  code: string;
  periodStart: string;
  periodEnd: string;
  type: RuleType;
  capType?: CapType;
  valuePointPercentage?: number;
  valueMin?: number;
  valueMax?: number;
};

function formatRuleTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextRuleId(allRules: Rule[], ruleMode: RuleMode): string {
  const prefix = ruleMode === "EARN" ? "ER" : "RR";
  const numbers = allRules
    .filter((rule) => rule.ruleMode === ruleMode)
    .map((rule) => parseInt(rule.id.split("-")[1] ?? "0", 10))
    .filter((value) => !Number.isNaN(value));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

function buildRedemption(values: RuleFormValues): RedemptionHeader {
  return {
    capType: values.capType ?? "voucher",
    valuePointPercentage: values.valuePointPercentage ?? 100,
    valueMin: values.valueMin ?? 50000,
    valueMax: values.valueMax ?? 500000,
  };
}

export function validateRuleForm(values: RuleFormValues): string | null {
  if (!values.name.trim()) return "Rule name is required.";
  if (!values.code.trim()) return "Rule code is required.";
  if (!values.periodStart || !values.periodEnd) return "Rule period is required.";
  return null;
}

export function createRuleFromForm(allRules: Rule[], ruleMode: RuleMode, values: RuleFormValues): Rule {
  const now = formatRuleTimestamp(new Date());
  const rule: Rule = {
    id: nextRuleId(allRules, ruleMode),
    code: values.code.trim(),
    name: values.name.trim(),
    ruleMode,
    type: values.type,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd,
    status: "in_review",
    createdAt: now,
    updatedAt: now,
    totalCif: 0,
    totalPoints: 0,
    config: createDefaultConfig(values.type),
  };

  if (ruleMode === "REDEEM") {
    rule.redemption = buildRedemption(values);
  }

  return rule;
}

export function updateRuleFromForm(existing: Rule, values: RuleFormValues): Rule {
  const typeChanged = existing.type !== values.type;
  const updated: Rule = {
    ...existing,
    code: values.code.trim(),
    name: values.name.trim(),
    type: values.type,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd,
    config: typeChanged ? createDefaultConfig(values.type) : existing.config,
    updatedAt: formatRuleTimestamp(new Date()),
  };

  if (existing.ruleMode === "REDEEM") {
    updated.redemption = buildRedemption(values);
  }

  return updated;
}
