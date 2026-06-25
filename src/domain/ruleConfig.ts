import type { RuleType } from "../types";
import type {
  ActivityConfig,
  PartnerBlock,
  PersonalEarningConfig,
  Rule,
  RuleConfig,
  TacticalConfig,
  ThirdPartyPointsConfig,
  TransactionalConfig,
  TransactionalFields,
} from "./rule";

export function createDefaultConfig(type: RuleType): RuleConfig {
  switch (type) {
    case "transactional":
      return { ruleType: "transactional" };
    case "activity":
      return { ruleType: "activity" };
    case "tactical":
      return { ruleType: "tactical" };
    case "personal_earning":
      return { ruleType: "personal_earning" };
    case "third_party_points":
      return { ruleType: "third_party_points", cardTypes: [], partnerBlocks: [] };
  }
}

export function getTransactionalFields(rule: Rule): TransactionalFields | undefined {
  const { config } = rule;
  if (config.ruleType === "transactional") return config;
  if (config.ruleType === "tactical") return config.transactional;
  return undefined;
}

export function asTransactionalConfig(rule: Rule): TransactionalConfig | undefined {
  return rule.config.ruleType === "transactional" ? rule.config : undefined;
}

export function asActivityConfig(rule: Rule): ActivityConfig | undefined {
  return rule.config.ruleType === "activity" ? rule.config : undefined;
}

export function asTacticalConfig(rule: Rule): TacticalConfig | undefined {
  return rule.config.ruleType === "tactical" ? rule.config : undefined;
}

export function asPersonalEarningConfig(rule: Rule): PersonalEarningConfig | undefined {
  return rule.config.ruleType === "personal_earning" ? rule.config : undefined;
}

export function asThirdPartyConfig(rule: Rule): ThirdPartyPointsConfig | undefined {
  return rule.config.ruleType === "third_party_points" ? rule.config : undefined;
}

export function getPartnerBlocks(rule: Rule): PartnerBlock[] {
  return rule.config.ruleType === "third_party_points" ? rule.config.partnerBlocks : [];
}
