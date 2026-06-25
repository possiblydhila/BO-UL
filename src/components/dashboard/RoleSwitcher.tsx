import { ChevronDown } from "lucide-react";
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
    <label className="text-sm font-medium text-slate-700">
      <span className="sr-only">Role</span>
      <span className="relative inline-block">
        <select
          value={role}
          onChange={(e) => onChange(e.target.value as DashboardRole)}
          className="focus-ring h-10 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-900"
          aria-label="Role switcher"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Role: {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}
