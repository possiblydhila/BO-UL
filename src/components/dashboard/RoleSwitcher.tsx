import { NativeSelect } from "@/components/base/select/select-native";
import type { DashboardRole } from "../../types";

const ROLE_OPTIONS: { value: DashboardRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "approver", label: "Approver" },
  { value: "admin", label: "Admin" },
];

export function RoleSwitcher({
  role,
  onChange,
}: {
  role: DashboardRole;
  onChange: (role: DashboardRole) => void;
}) {
  return (
    <NativeSelect
      aria-label="Role switcher"
      value={role}
      size="sm"
      options={ROLE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: `Role: ${opt.label}`,
      }))}
      onChange={(event) => onChange(event.target.value as DashboardRole)}
    />
  );
}
