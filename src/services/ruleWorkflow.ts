import type { Rule } from "../domain/rule";
import { canApprove, canReject, canSubmit, canToggleInactive } from "../domain/ruleStatus";
import type { Role } from "../types";

export type WorkflowResult =
  | { ok: true; rule: Rule }
  | { ok: false; error: string };

function transition(rule: Rule, nextStatus: Rule["status"]): WorkflowResult {
  return { ok: true, rule: { ...rule, status: nextStatus, updatedAt: new Date().toISOString() } };
}

export function submitRule(rule: Rule, role: Role): WorkflowResult {
  if (!canSubmit(role, rule.status)) {
    return { ok: false, error: "Only employees can submit draft rules." };
  }
  return transition(rule, "in_review");
}

export function approveRule(rule: Rule, role: Role): WorkflowResult {
  if (!canApprove(role, rule.status)) {
    return { ok: false, error: "Only approvers can approve rules in review." };
  }
  return transition(rule, "scheduled");
}

export function rejectRule(rule: Rule, role: Role): WorkflowResult {
  if (!canReject(role, rule.status)) {
    return { ok: false, error: "Only approvers can reject rules in review." };
  }
  return transition(rule, "draft");
}

export function toggleInactive(rule: Rule): WorkflowResult {
  if (!canToggleInactive(rule.status)) {
    return { ok: false, error: "Only active rules can be deactivated." };
  }
  return transition(rule, "inactive");
}
