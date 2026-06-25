import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  Edit3,
  Menu,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  cardTypeOptions,
  cobrandCardTypeOptions,
  defaultPointConfig,
  expiredDurationUnitOptions,
  balanceResetMonthOptions,
  getRulesByMode,
  maxCapacityTimeframeOptions,
  maxCapacityTypeOptions,
  merchantCategoryOptions,
  merchantNameOptions,
  navItems,
  operatorTypeOptions,
  partnerCapTimeframeOptions,
  reportTabs,
  rewardTypeOptions,
  ruleChannelOptions,
  ruleSourceSystemOptions,
  ruleTransactionTypeOptions,
  statusLabels,
  targetUserOptions,
  thirdPartyProgramOptions,
} from "./data/mockData";
import type { Rule, RuleMode } from "./domain/rule";
import { formatAnnualBalanceResetDate, formatExpiryPolicySummary } from "./domain/pointConfig";
import type { PointConfig } from "./domain/pointConfig";
import { formatCapType } from "./domain/rule";
import type { PersonalEarningConfig, TacticalConfig, TransactionalFields } from "./domain/rule";
import {
  asActivityConfig,
  asPersonalEarningConfig,
  asTacticalConfig,
  asThirdPartyConfig,
  getTransactionalFields,
} from "./domain/ruleConfig";
import { canEdit } from "./domain/ruleStatus";
import { filterRules } from "./services/ruleQueries";
import type { Role, RouteKey, RuleStatus, RuleType } from "./types";
import { calculatePoints, formatCompact, formatNumber } from "./utils/points";
import { DateRangeField } from "./components/DateRangeField";
import { DashboardPage } from "./components/dashboard/DashboardPage";

const statusClass: Record<RuleStatus, string> = {
  active: "bg-success-50 text-success-700 ring-success-700/10",
  scheduled: "bg-brand-50 text-brand-700 ring-brand-700/10",
  in_review: "bg-warning-50 text-warning-700 ring-warning-700/10",
  draft: "bg-slate-100 text-slate-700 ring-slate-700/10",
  inactive: "bg-slate-100 text-slate-500 ring-slate-500/10",
  expired: "bg-danger-50 text-danger-700 ring-danger-700/10",
};

const typeLabel: Record<RuleType, string> = {
  transactional: "Transactional",
  activity: "Activity",
  tactical: "Tactical",
  personal_earning: "Personal Earning",
  third_party_points: "Third Party Points",
};

function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "border-brand-600 bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="min-w-[160px] flex-1 text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="focus-ring h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[150px] flex-1 text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
      />
    </label>
  );
}

function Badge({ status }: { status: RuleStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}


function SummaryCounters({ rules }: { rules: Rule[] }) {
  const statuses: RuleStatus[] = ["active", "inactive", "expired", "scheduled", "in_review", "draft"];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <div className="surface p-4">
        <p className="text-sm text-slate-500">All rule</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950">{rules.length}</p>
      </div>
      {statuses.map((status) => (
        <div key={status} className="surface p-4">
          <p className="text-sm text-slate-500">{statusLabels[status]} rule</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{rules.filter((rule) => rule.status === status).length}</p>
        </div>
      ))}
    </div>
  );
}

function RuleModule({
  title,
  description,
  rules,
  ruleMode,
}: {
  title: string;
  description: string;
  rules: Rule[];
  ruleMode: RuleMode;
}) {
  const [role, setRole] = useState<Role>("employee");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RuleStatus | "all">("all");
  const [drawerRule, setDrawerRule] = useState<Rule | null>(null);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RuleType>("transactional");

  const filteredRules = useMemo(
    () => filterRules(rules, { mode: ruleMode, status, query }),
    [query, rules, ruleMode, status],
  );

  function openAdd() {
    setDrawerMode("add");
    setDrawerRule(null);
    setSelectedType("transactional");
    setDrawerOpen(true);
  }

  function openEdit(rule: Rule) {
    setDrawerMode("edit");
    setDrawerRule(rule);
    setSelectedType(rule.type);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Rule Management"
        title={title}
        description={description}
        action={
          <>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
              {(["employee", "approver"] as Role[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setRole(item)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize ${
                    role === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button>
              <Download className="h-4 w-4" />
              XLSX
            </Button>
            <Button variant="primary" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add rule
            </Button>
          </>
        }
      />

      <SummaryCounters rules={rules} />

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rule name, code, or ID"
              className="focus-ring h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
            />
          </div>
          <div className="w-full lg:w-56">
            <SelectField
              label="Status"
              value={status}
              options={[
                { value: "all", label: "All status" },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
              onChange={(value) => setStatus(value as RuleStatus | "all")}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created time</th>
                <th className="px-4 py-3">Total CIF</th>
                <th className="px-4 py-3">Total point</th>
                {ruleMode === "REDEEM" && <th className="px-4 py-3">Cap type</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRules.map((rule, index) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{rule.name}</p>
                    <p className="text-xs text-slate-500">{rule.code}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {rule.periodStart} - {rule.periodEnd}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{typeLabel[rule.type]}</td>
                  <td className="px-4 py-4">
                    <Badge status={rule.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-600">{rule.createdAt}</td>
                  <td className="px-4 py-4 text-slate-600">{formatNumber(rule.totalCif)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatCompact(rule.totalPoints)}</td>
                  {ruleMode === "REDEEM" && (
                    <td className="px-4 py-4 text-slate-600">
                      {rule.redemption ? formatCapType(rule.redemption.capType) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {canEdit(role, rule.status) && (
                        <Button className="h-9 min-h-9 px-3" onClick={() => openEdit(rule)}>
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      {rule.status === "active" && <Button className="h-9 min-h-9 px-3">Inactive</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RuleDrawer
        open={drawerOpen}
        mode={drawerMode}
        ruleMode={ruleMode}
        rule={drawerRule}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onClose={() => {
          setDrawerRule(null);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

function RuleDrawer({
  open,
  mode,
  ruleMode,
  rule,
  selectedType,
  onTypeChange,
  onClose,
}: {
  open: boolean;
  mode: "add" | "edit";
  ruleMode: RuleMode;
  rule: Rule | null;
  selectedType: RuleType;
  onTypeChange: (type: RuleType) => void;
  onClose: () => void;
}) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  useEffect(() => {
    if (!open) return;
    setPeriodStart(rule?.periodStart ?? "");
    setPeriodEnd(rule?.periodEnd ?? "");
  }, [open, rule]);

  if (!open) return null;
  const examplePoints = calculatePoints(500000, 100000, 10);
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 cursor-default bg-slate-950/30" aria-label="Close drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">{ruleMode === "EARN" ? "Earning Rule" : "Redemption Rule"}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{mode === "add" ? "Add rule" : `Edit ${rule?.code}`}</h2>
            <p className="mt-1 text-sm text-slate-500">Conditional fields follow the CSV draft for rule type behavior.</p>
          </div>
          <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            <MockInput label="Rule name" value={rule?.name ?? ""} placeholder="Input rule name" />
            <MockInput label="Rule code" value={rule?.code ?? ""} placeholder="EARN-PAY-001" />
            <DateRangeField
              label="Rule period"
              periodStart={periodStart}
              periodEnd={periodEnd}
              onChange={(start, end) => {
                setPeriodStart(start);
                setPeriodEnd(end);
              }}
            />
            {ruleMode === "REDEEM" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <MockInput
                  label="Cap type"
                  value={rule?.redemption?.capType ? formatCapType(rule.redemption.capType) : "voucher"}
                />
                <MockInput label="Value point percentage" value={`${rule?.redemption?.valuePointPercentage ?? 100}`} />
                <MockInput label="Value min" value={`${rule?.redemption?.valueMin ?? 50000}`} />
                <MockInput label="Value max" value={`${rule?.redemption?.valueMax ?? 500000}`} />
              </div>
            )}
            <SelectField
              label="Rule type"
              value={selectedType}
              options={Object.entries(typeLabel).map(([value, label]) => ({ value, label }))}
              onChange={(type) => onTypeChange(type as RuleType)}
            />
            <ConditionalRuleFields rule={rule} selectedType={selectedType} ruleMode={ruleMode} />
            <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-950">Point calculation example</p>
              <p className="mt-1">Earned/Redeem Points = (500.000 / 100.000) x 10 = {examplePoints} poin.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary">{mode === "add" ? "Submit for review" : "Save changes"}</Button>
        </div>
      </aside>
    </div>
  );
}

function MockInput({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      <input
        defaultValue={value}
        placeholder={placeholder}
        className="focus-ring h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
      />
    </label>
  );
}

function FileUploadField({
  label,
  description,
  accept,
  file,
  onFileChange,
  className = "",
}: {
  label: string;
  description?: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  className?: string;
}) {
  const inputId = `file-upload-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={className}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <label
        htmlFor={inputId}
        className="focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/50"
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">
          {file ? file.name : "Choose CSV or XLSX file"}
        </span>
        {description && <span className="text-xs text-slate-500">{description}</span>}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="focus-ring mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Remove file
        </button>
      )}
    </div>
  );
}

function TargetUserRewardFields() {
  const [targetUser, setTargetUser] = useState(targetUserOptions[0].value);
  const [rewardType, setRewardType] = useState(rewardTypeOptions[0].value);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  return (
    <>
      <SelectField
        label="Target user"
        value={targetUser}
        options={targetUserOptions}
        onChange={(value) => {
          setTargetUser(value);
          if (value !== "limited") setUploadedFile(null);
        }}
      />
      {targetUser === "limited" && (
        <FileUploadField
          className="sm:col-span-2"
          label="Target user list"
          description="Upload a CSV or XLSX file with the limited target user list"
          accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          file={uploadedFile}
          onFileChange={setUploadedFile}
        />
      )}
      <SelectField
        label="Reward type"
        value={rewardType}
        options={rewardTypeOptions}
        onChange={setRewardType}
      />
    </>
  );
}

function TacticalRuleFields({ tactical }: { tactical?: TacticalConfig }) {
  return (
    <>
      <MockInput label="Campaign/event name" value={tactical?.campaignName ?? "HUT BNI"} />
      <TargetUserRewardFields />
    </>
  );
}

function PersonalEarningRuleFields({ personal }: { personal?: PersonalEarningConfig }) {
  return (
    <>
      <MockInput label="Type" value={personal?.personalType ?? "birthday"} />
      <TargetUserRewardFields />
      <MockInput
        label="Receive point"
        value={personal?.receivePoint != null ? `${personal.receivePoint} point` : "100 point"}
      />
    </>
  );
}

function createFieldId() {
  return Math.random().toString(36).slice(2, 10);
}

function CheckboxGroupField({
  label,
  options,
  selected,
  onChange,
  className = "",
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-1.5 block text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                checked ? "border-brand-300 bg-brand-50 text-brand-900" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={checked}
                onChange={() => {
                  onChange(
                    checked ? selected.filter((value) => value !== option.value) : [...selected, option.value],
                  );
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type PartnerTier = {
  id: string;
  operatorType: string;
  transactionAmount: string;
  transactionAmountMin: string;
  transactionAmountMax: string;
  milesPoint: string;
};

type PartnerBlock = {
  id: string;
  thirdParty: string;
  tiers: PartnerTier[];
  capType: string;
  timeframe: string;
  maxCapacity: string;
};

function createDefaultPartnerTier(): PartnerTier {
  return {
    id: createFieldId(),
    operatorType: operatorTypeOptions[0].value,
    transactionAmount: "",
    transactionAmountMin: "",
    transactionAmountMax: "",
    milesPoint: "",
  };
}

function createDefaultPartnerBlocks(): PartnerBlock[] {
  return [
    {
      id: createFieldId(),
      thirdParty: "garuda",
      tiers: [
        {
          id: createFieldId(),
          operatorType: "lt",
          transactionAmount: "100000",
          transactionAmountMin: "",
          transactionAmountMax: "",
          milesPoint: "2",
        },
        {
          id: createFieldId(),
          operatorType: "range",
          transactionAmount: "",
          transactionAmountMin: "100001",
          transactionAmountMax: "200000",
          milesPoint: "5",
        },
        {
          id: createFieldId(),
          operatorType: "gt",
          transactionAmount: "200000",
          transactionAmountMin: "",
          transactionAmountMax: "",
          milesPoint: "10",
        },
      ],
      capType: maxCapacityTypeOptions[2].value,
      timeframe: "monthly",
      maxCapacity: "30",
    },
    {
      id: createFieldId(),
      thirdParty: "krisflyer",
      tiers: [
        {
          id: createFieldId(),
          operatorType: "lt",
          transactionAmount: "100000",
          transactionAmountMin: "",
          transactionAmountMax: "",
          milesPoint: "1",
        },
        {
          id: createFieldId(),
          operatorType: "range",
          transactionAmount: "",
          transactionAmountMin: "100001",
          transactionAmountMax: "200000",
          milesPoint: "3",
        },
        {
          id: createFieldId(),
          operatorType: "gt",
          transactionAmount: "200000",
          transactionAmountMin: "",
          transactionAmountMax: "",
          milesPoint: "6",
        },
      ],
      capType: maxCapacityTypeOptions[2].value,
      timeframe: "monthly",
      maxCapacity: "30",
    },
  ];
}

function PartnerTierRow({
  tier,
  onChange,
  onRemove,
  canRemove,
}: {
  tier: PartnerTier;
  onChange: (tier: PartnerTier) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
      <SelectField
        label="Operator type"
        value={tier.operatorType}
        options={operatorTypeOptions}
        onChange={(operatorType) => onChange({ ...tier, operatorType })}
      />
      {tier.operatorType === "range" ? (
        <>
          <MockInput
            label="Transaction amount (min)"
            value={tier.transactionAmountMin}
            placeholder="100001"
          />
          <MockInput
            label="Transaction amount (max)"
            value={tier.transactionAmountMax}
            placeholder="200000"
          />
        </>
      ) : (
        <MockInput
          label="Transaction amount"
          value={tier.transactionAmount}
          placeholder={tier.operatorType === "lt" ? "100000" : "200000"}
        />
      )}
      <MockInput label="Miles point" value={tier.milesPoint} placeholder="5" />
      {canRemove && (
        <div className="flex items-end sm:col-span-2">
          <Button variant="ghost" onClick={onRemove}>
            Remove tier
          </Button>
        </div>
      )}
    </div>
  );
}

function PartnerBlockCard({
  block,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  block: PartnerBlock;
  index: number;
  onChange: (block: PartnerBlock) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Partner block {index + 1}</p>
          <p className="text-xs text-slate-500">One partner program with its own tier table and accumulation cap.</p>
        </div>
        {canRemove && (
          <Button variant="ghost" onClick={onRemove}>
            Remove block
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        <SelectField
          label="Third party"
          value={block.thirdParty}
          options={thirdPartyProgramOptions}
          onChange={(thirdParty) => onChange({ ...block, thirdParty })}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Tier table</p>
            <Button
              variant="secondary"
              onClick={() =>
                onChange({ ...block, tiers: [...block.tiers, createDefaultPartnerTier()] })
              }
            >
              Add tier
            </Button>
          </div>
          {block.tiers.map((tier) => (
            <PartnerTierRow
              key={tier.id}
              tier={tier}
              canRemove={block.tiers.length > 1}
              onChange={(nextTier) =>
                onChange({
                  ...block,
                  tiers: block.tiers.map((item) => (item.id === tier.id ? nextTier : item)),
                })
              }
              onRemove={() =>
                onChange({ ...block, tiers: block.tiers.filter((item) => item.id !== tier.id) })
              }
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Cap type"
            value={block.capType}
            options={maxCapacityTypeOptions}
            onChange={(capType) => onChange({ ...block, capType })}
          />
          <SelectField
            label="Timeframe"
            value={block.timeframe}
            options={partnerCapTimeframeOptions}
            onChange={(timeframe) => onChange({ ...block, timeframe })}
          />
          <MockInput label="Max capacity (miles)" value={block.maxCapacity} placeholder="30" />
        </div>
      </div>
    </section>
  );
}

function ThirdPartyPointsRuleFields({ rule }: { rule: Rule | null }) {
  const thirdParty = rule ? asThirdPartyConfig(rule) : undefined;
  const [cardTypes, setCardTypes] = useState<string[]>(
    thirdParty?.cardTypes?.length
      ? thirdParty.cardTypes
      : cobrandCardTypeOptions.map((option) => option.value),
  );
  const [partnerBlocks, setPartnerBlocks] = useState<PartnerBlock[]>(createDefaultPartnerBlocks);

  return (
    <div className="grid gap-4 sm:col-span-2">
      <CheckboxGroupField
        className="sm:col-span-2"
        label="Card type"
        options={cobrandCardTypeOptions}
        selected={cardTypes}
        onChange={setCardTypes}
      />
      <div className="space-y-4 sm:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Partner earning blocks</p>
            <p className="text-xs text-slate-500">
              Each block accrues into one partner program. All blocks apply to the same qualifying transaction.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              setPartnerBlocks([
                ...partnerBlocks,
                {
                  id: createFieldId(),
                  thirdParty: thirdPartyProgramOptions[0].value,
                  tiers: [createDefaultPartnerTier()],
                  capType: maxCapacityTypeOptions[0].value,
                  timeframe: partnerCapTimeframeOptions[0].value,
                  maxCapacity: "",
                },
              ])
            }
          >
            Add partner block
          </Button>
        </div>
        {partnerBlocks.map((block, index) => (
          <PartnerBlockCard
            key={block.id}
            block={block}
            index={index}
            canRemove={partnerBlocks.length > 1}
            onChange={(nextBlock) =>
              setPartnerBlocks(partnerBlocks.map((item) => (item.id === block.id ? nextBlock : item)))
            }
            onRemove={() => setPartnerBlocks(partnerBlocks.filter((item) => item.id !== block.id))}
          />
        ))}
      </div>
    </div>
  );
}

function TransactionalRuleFields({ transactional }: { transactional?: TransactionalFields }) {
  const [sourceSystem, setSourceSystem] = useState(
    transactional?.sourceSystem ?? ruleSourceSystemOptions[0].value,
  );
  const [transactionType, setTransactionType] = useState(
    transactional?.transactionType ?? ruleTransactionTypeOptions[0].value,
  );
  const [merchantCategory, setMerchantCategory] = useState(
    transactional?.merchantCategory ?? merchantCategoryOptions[0].value,
  );
  const [merchantName, setMerchantName] = useState(
    transactional?.merchantName ?? merchantNameOptions[0].value,
  );
  const [cardType, setCardType] = useState(transactional?.cardType ?? cardTypeOptions[0].value);
  const [channel, setChannel] = useState<string>(transactional?.channel ?? ruleChannelOptions[0].value);
  const [maxCapacityType, setMaxCapacityType] = useState(
    transactional?.maxCapacityType ?? maxCapacityTypeOptions[0].value,
  );
  const [maxCapacityTimeframe, setMaxCapacityTimeframe] = useState(
    transactional?.maxCapacityTimeframe ?? maxCapacityTimeframeOptions[0].value,
  );

  return (
    <>
      <SelectField
        label="Source system"
        value={sourceSystem}
        options={ruleSourceSystemOptions}
        onChange={setSourceSystem}
      />
      <SelectField
        label="Transaction type"
        value={transactionType}
        options={ruleTransactionTypeOptions}
        onChange={setTransactionType}
      />
      <SelectField
        label="Merchant category"
        value={merchantCategory}
        options={merchantCategoryOptions}
        onChange={setMerchantCategory}
      />
      <SelectField
        label="Merchant name"
        value={merchantName}
        options={merchantNameOptions}
        onChange={setMerchantName}
      />
      <SelectField label="Card type" value={cardType} options={cardTypeOptions} onChange={setCardType} />
      <SelectField label="Channel" value={channel} options={ruleChannelOptions} onChange={setChannel} />
      <MockInput label="Transaction amount" value="500000" />
      <MockInput label="Conversion unit" value={transactional?.conversionUnit?.toString() ?? "100000"} />
      <MockInput label="Multiplier" value={transactional?.multiplier?.toString() ?? "10"} />
      <MockInput
        label="Max capacity"
        value={transactional?.maxCapacity != null ? `${transactional.maxCapacity} point` : "2000000 point"}
      />
      <SelectField
        label="Type max capacity"
        value={maxCapacityType}
        options={maxCapacityTypeOptions}
        onChange={setMaxCapacityType}
      />
      <SelectField
        label="Timeframe max capacity"
        value={maxCapacityTimeframe}
        options={maxCapacityTimeframeOptions}
        onChange={setMaxCapacityTimeframe}
      />
    </>
  );
}

function ConditionalRuleFields({
  rule,
  selectedType,
  ruleMode,
}: {
  rule: Rule | null;
  selectedType: RuleType;
  ruleMode: RuleMode;
}) {
  if (selectedType === "activity") {
    const activity = rule ? asActivityConfig(rule) : undefined;
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <MockInput label="Activity type" value={activity?.activityType ?? "aktivasi wondr"} />
        <MockInput label="Amount field" placeholder="Active for balance increase activity" />
        <MockInput
          label={ruleMode === "EARN" ? "Receive point" : "Redeem point"}
          value={activity?.receivePoint != null ? `${activity.receivePoint} point` : "100 point"}
        />
      </div>
    );
  }

  if (selectedType === "third_party_points") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <ThirdPartyPointsRuleFields rule={rule} />
      </div>
    );
  }

  if (selectedType === "personal_earning") {
    const personal = rule ? asPersonalEarningConfig(rule) : undefined;
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <PersonalEarningRuleFields personal={personal} />
      </div>
    );
  }

  const tactical = rule ? asTacticalConfig(rule) : undefined;
  const transactional = rule ? getTransactionalFields(rule) : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {selectedType === "tactical" && <TacticalRuleFields tactical={tactical} />}
      <TransactionalRuleFields transactional={transactional} />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  disabled,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) || min)}
        className="focus-ring h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function PointLogoPreview({ config }: { config: PointConfig }) {
  const initials = config.pointName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
        {config.pointLogo ? (
          <img src={config.pointLogo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-brand-700">{initials || "PT"}</span>
        )}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-950">{config.pointName || "Point name"}</p>
        <p className="mt-1 text-sm text-slate-600">{formatExpiryPolicySummary(config)}</p>
      </div>
    </div>
  );
}

function PointConfigPage() {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PointConfig>(defaultPointConfig);
  const [saved, setSaved] = useState<PointConfig>(defaultPointConfig);

  function updateDraft<K extends keyof PointConfig>(key: K, value: PointConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startEdit() {
    setDraft(saved);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(saved);
    setEditing(false);
  }

  function saveChanges() {
    setSaved({
      ...draft,
      updatedBy: "Product Ops",
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  }

  const active = editing ? draft : saved;
  const updatedAtLabel = new Date(saved.updatedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Program setup"
        title="Point Configuration"
        description="Kelola identitas mata uang poin, masa berlaku, dan waktu reset. Konfigurasi ini dipakai bersama oleh modul Earning Rule dan Redemption Rule."
        action={
          editing ? (
            <>
              <Button variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveChanges}>
                Save changes
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={startEdit}>
              <Edit3 className="h-4 w-4" />
              Edit configuration
            </Button>
          )
        }
      />

      <section className="surface p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <PointLogoPreview config={active} />
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>
              Last updated <span className="font-medium text-slate-900">{updatedAtLabel}</span>
            </p>
            <p className="mt-1">
              By <span className="font-medium text-slate-900">{saved.updatedBy}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Point identity</h2>
            <TextField
              label="Point name"
              value={active.pointName}
              disabled={!editing}
              placeholder="e.g. BNI Poin"
              hint="Displayed across earning, redemption, and customer-facing channels."
              onChange={(value) => updateDraft("pointName", value)}
            />
            <TextField
              label="Point logo URL"
              value={active.pointLogo}
              disabled={!editing}
              placeholder="https://..."
              hint="Image URL for the point currency icon. Leave blank to use initials preview."
              onChange={(value) => updateDraft("pointLogo", value)}
            />
            {editing && (
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">Upload logo</span>
                <button
                  type="button"
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  <Upload className="h-4 w-4" />
                  Choose file
                </button>
                <span className="mt-1.5 block text-xs text-slate-500">Prototype only — file upload is not wired.</span>
              </label>
            )}
          </div>

          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Expiry & reset policy</h2>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Hybrid expiry model</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Points expire individually on a rolling TTL from each earn date. Separately, the full customer balance is reset to zero on an annual calendar date.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Rolling expiry (per earn)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Expiry duration"
                  value={active.expiredDurationValue}
                  disabled={!editing}
                  min={1}
                  hint="Each earn batch expires this long after the earn date."
                  onChange={(value) => updateDraft("expiredDurationValue", value)}
                />
                <SelectField
                  label="Duration unit"
                  value={active.expiredDurationUnit}
                  disabled={!editing}
                  options={expiredDurationUnitOptions}
                  onChange={(value) => updateDraft("expiredDurationUnit", value as PointConfig["expiredDurationUnit"])}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Annual balance reset</h3>
              <p className="text-sm text-slate-600">
                All remaining points are zeroed on this date each year (e.g. 1 January).
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField
                  label="Reset month"
                  value={String(active.annualBalanceResetMonth)}
                  disabled={!editing}
                  options={balanceResetMonthOptions}
                  onChange={(value) => updateDraft("annualBalanceResetMonth", Number(value))}
                />
                <NumberField
                  label="Reset day"
                  value={active.annualBalanceResetDay}
                  disabled={!editing}
                  min={1}
                  hint="Day of month (e.g. 1 for 1 Jan)."
                  onChange={(value) => updateDraft("annualBalanceResetDay", value)}
                />
                <TextField
                  label="Reset time"
                  type="time"
                  value={active.resetTime}
                  disabled={!editing}
                  hint="Time of day (WIB) when the reset job runs."
                  onChange={(value) => updateDraft("resetTime", value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Next scheduled reset: {formatAnnualBalanceResetDate(active.annualBalanceResetMonth, active.annualBalanceResetDay)} at {active.resetTime} WIB
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-5 md:p-6">
        <h2 className="text-base font-semibold text-slate-950">Downstream usage</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Earning and redemption rules reference this single program-level record for point naming, branding, and expiry behavior.
          Rule drawers and KPI calculations will read these values once backend integration is available.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { title: "Earning Rule", detail: "Uses point name and expiry policy when issuing points." },
            { title: "Redemption Rule", detail: "Uses point name and branding when redeeming rewards." },
            { title: "Analytics Dashboard", detail: "Expired Points KPI reflects both rolling TTL write-offs and annual balance resets." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlaceholderPage({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Planned module" title={title} description={description} />
      <section className="surface p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Plus className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Ready for next detail pass</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This route is included in the navigation so stakeholders can review the portal IA while detailed requirements are
            still being drafted.
          </p>
        </div>
      </section>
      {children}
    </div>
  );
}

function ReportingPlaceholder() {
  const [tab, setTab] = useState(reportTabs[0]);
  return (
    <PlaceholderPage
      title="Reporting"
      description="Centralized reporting for earning, redemption, manual operations, pembukuan, and reconciliation outputs."
    >
      <section className="surface p-4">
        <div className="flex gap-2 overflow-x-auto">
          {reportTabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                tab === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          {tab} report table, filters, export actions, and reconciliation status will be specified in the next iteration.
        </div>
      </section>
    </PlaceholderPage>
  );
}

function App() {
  const [route, setRoute] = useState<RouteKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeItem = navItems.find((item) => item.key === route) ?? navItems[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white transition lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">BL</div>
          <div>
            <p className="text-sm font-semibold text-slate-950">BNI Loyalty</p>
            <p className="text-xs text-slate-500">Back Office Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === route;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setRoute(item.key);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 flex-none" />
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 opacity-80">{item.description}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" className="h-10 min-h-10 w-10 px-0 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Portal / {activeItem.label}</p>
            <p className="truncate text-sm font-semibold text-slate-950">{activeItem.description}</p>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
          {route === "dashboard" && <DashboardPage />}
          {route === "point-config" && <PointConfigPage />}
          {route === "earning-rules" && (
            <RuleModule
              title="Earning Rule"
              description="Konfigurasi aturan, skema, dan parameter perolehan poin pengguna."
              rules={getRulesByMode("EARN")}
              ruleMode="EARN"
            />
          )}
          {route === "redemption-rules" && (
            <RuleModule
              title="Redemption Rule"
              description="Konfigurasi aturan, skema, dan parameter penukaran poin pengguna."
              rules={getRulesByMode("REDEEM")}
              ruleMode="REDEEM"
            />
          )}
          {route === "users" && <PlaceholderPage title="User" description="Daftar, profil, dan informasi menyeluruh terkait pengguna sistem loyalty." />}
          {route === "rewards" && (
            <PlaceholderPage
              title="Rewards Points Management"
              description="Pengelolaan daftar hadiah, ketersediaan stok, dan katalog yang dapat ditukarkan."
            />
          )}
          {route === "reporting" && <ReportingPlaceholder />}
        </main>
      </div>
    </div>
  );
}

export default App;
