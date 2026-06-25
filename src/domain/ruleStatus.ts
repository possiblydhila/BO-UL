import type { Role, RuleStatus } from "../types";

export const statusLabels: Record<RuleStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  scheduled: "Scheduled",
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
};

export function canEdit(role: Role, status: RuleStatus) {
  return role === "employee" ? status === "draft" : status === "in_review" || status === "scheduled";
}

export function canSubmit(role: Role, status: RuleStatus) {
  return role === "employee" && status === "draft";
}

export function canApprove(role: Role, status: RuleStatus) {
  return role === "approver" && status === "in_review";
}

export function canReject(role: Role, status: RuleStatus) {
  return role === "approver" && status === "in_review";
}

export function canToggleInactive(status: RuleStatus) {
  return status === "active";
}
