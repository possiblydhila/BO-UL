import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download01,
  Edit03,
  Expand01,
  Minimize01,
  Plus,
  SearchLg,
  Upload01,
  XClose,
} from "@untitledui/icons";
import {
  Badge,
  Button,
  DateField,
  MockInput,
  NumberField,
  SelectField,
  TextField,
} from "./components/ui/app-primitives";
import { Input } from "@/components/base/input/input";
import { Table, TableCard } from "@/components/application/table/table";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/application/tabs/tabs";
import { BinMultiSelectField } from "./components/BinMultiSelectField";
import {
  defaultPointConfig,
  expiredDurationUnitOptions,
  balanceResetMonthOptions,
  maxCapacityTypeOptions,
  merchantCategoryOptions,
  merchantNameOptions,
  navItems,
  operatorTypeOptions,
  partnerCapTimeframeOptions,
  reportTabs,
  rewardTypeOptions,
  ruleChannelOptions,
  ruleMaxCapacityTimeframeFields,
  rules as initialRules,
  getRuleTransactionTypeOptions,
  ruleSourceSystemOptions,
  statusLabels,
  targetUserOptions,
  thirdPartyProgramOptions,
  TIMEFRAME_CAPACITY_DEFAULT_MAX,
} from "./data/mockData";
import type { Rule, RuleMode } from "./domain/rule";
import { formatAnnualBalanceResetDate, formatExpiryPolicySummary } from "./domain/pointConfig";
import type { PointConfig } from "./domain/pointConfig";
import { formatCapType, redemptionCapTypeOptions, type CapType } from "./domain/rule";
import type { PersonalEarningConfig, TacticalConfig, TimeframeKey, TimeframeMaxCapacity, TransactionalFields } from "./domain/rule";
import {
  asActivityConfig,
  asPersonalEarningConfig,
  asTacticalConfig,
  asThirdPartyConfig,
  getTransactionalFields,
} from "./domain/ruleConfig";
import { canEdit } from "./domain/ruleStatus";
import { filterRules, getRulesByMode } from "./services/ruleQueries";
import {
  createRuleFromForm,
  updateRuleFromForm,
  validateRuleForm,
  type RuleFormValues,
} from "./services/ruleMutations";
import type { Role, RouteKey, RuleStatus, RuleTransactionType, RuleType } from "./types";
import { calculatePoints, formatCompact, formatNumber } from "./utils/points";
import { cx } from "./utils/cx";
import { DateRangeField } from "./components/DateRangeField";
import { DashboardPage } from "./components/dashboard/DashboardPage";

const typeLabel: Record<RuleType, string> = {
  transactional: "Transactional",
  activity: "Activity",
  tactical: "Tactical",
  personal_earning: "Personal Earning",
  third_party_points: "Third Party Points",
};

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
    <div className="flex flex-col gap-4 border-b border-secondary pb-5 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-brand-secondary">{eyebrow}</p>}
        <h1 className="mt-1 text-display-xs font-semibold text-primary md:text-display-sm">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-tertiary">{description}</p>}
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
        <p className="text-sm text-quaternary">All rule</p>
        <p className="mt-1 text-display-xs font-semibold text-primary">{rules.length}</p>
      </div>
      {statuses.map((status) => (
        <div key={status} className="surface p-4">
          <p className="text-sm text-quaternary">{statusLabels[status]} rule</p>
          <p className="mt-1 text-display-xs font-semibold text-primary">{rules.filter((rule) => rule.status === status).length}</p>
        </div>
      ))}
    </div>
  );
}

function RuleModule({
  title,
  description,
  rules,
  allRules,
  ruleMode,
  onRulesChange,
}: {
  title: string;
  description: string;
  rules: Rule[];
  allRules: Rule[];
  ruleMode: RuleMode;
  onRulesChange: (rules: Rule[]) => void;
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

  const tableItems = useMemo(
    () => filteredRules.map((rule, index) => ({ ...rule, rowNumber: index + 1 })),
    [filteredRules],
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

  function handleSaveRule(values: RuleFormValues) {
    const nextRule =
      drawerMode === "add"
        ? createRuleFromForm(allRules, ruleMode, values)
        : updateRuleFromForm(drawerRule!, values);

    onRulesChange(
      drawerMode === "add"
        ? [...allRules, nextRule]
        : allRules.map((item) => (item.id === nextRule.id ? nextRule : item)),
    );
    setDrawerRule(null);
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Rule Management"
        title={title}
        description={description}
        action={
          <>
            <div className="inline-flex rounded-lg border border-primary bg-primary p-1 shadow-xs">
              {(["employee", "approver"] as Role[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setRole(item)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize ${
                    role === item ? "bg-primary-solid text-white" : "text-tertiary hover:bg-primary_hover"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button iconLeading={Download01}>CSV</Button>
            <Button iconLeading={Download01}>XLSX</Button>
            <Button variant="primary" iconLeading={Plus} onClick={openAdd}>
              Add rule
            </Button>
          </>
        }
      />

      <SummaryCounters rules={rules} />

      <TableCard.Root>
        <TableCard.Header title="Rule list" badge={String(filteredRules.length)} />

        <div className="flex flex-col gap-3 border-b border-secondary p-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Input
              icon={SearchLg}
              placeholder="Search rule name, code, or ID"
              value={query}
              onChange={setQuery}
              aria-label="Search rules"
            />
          </div>
          <div className="w-full md:w-56">
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

        <Table aria-label="Rules">
          <Table.Header>
            <Table.Head id="rowNumber" label="No" />
            <Table.Head id="name" label="Rule" isRowHeader className="min-w-48" />
            <Table.Head id="period" label="Period" />
            <Table.Head id="type" label="Type" />
            <Table.Head id="status" label="Status" />
            <Table.Head id="createdAt" label="Created time" />
            <Table.Head id="totalCif" label="Total CIF" />
            <Table.Head id="totalPoints" label="Total point" />
            {ruleMode === "REDEEM" && <Table.Head id="capType" label="Cap type" />}
            <Table.Head id="actions" label="Actions" className="text-right" />
          </Table.Header>
          <Table.Body items={tableItems}>
            {(rule) => (
              <Table.Row id={rule.id}>
                <Table.Cell className="text-quaternary">{rule.rowNumber}</Table.Cell>
                <Table.Cell>
                  <p className="font-semibold text-primary">{rule.name}</p>
                  <p className="text-xs text-quaternary">{rule.code}</p>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {rule.periodStart} - {rule.periodEnd}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">{typeLabel[rule.type]}</Table.Cell>
                <Table.Cell>
                  <Badge status={rule.status} />
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">{rule.createdAt}</Table.Cell>
                <Table.Cell className="whitespace-nowrap">{formatNumber(rule.totalCif)}</Table.Cell>
                <Table.Cell className="whitespace-nowrap">{formatCompact(rule.totalPoints)}</Table.Cell>
                {ruleMode === "REDEEM" && (
                  <Table.Cell className="whitespace-nowrap">
                    {rule.redemption ? formatCapType(rule.redemption.capType) : "—"}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <div className="flex justify-end gap-2">
                    {canEdit(role, rule.status) && (
                      <Button className="h-9 min-h-9 px-3" iconLeading={Edit03} onClick={() => openEdit(rule)}>
                        Edit
                      </Button>
                    )}
                    {rule.status === "active" && <Button className="h-9 min-h-9 px-3">Inactive</Button>}
                  </div>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </TableCard.Root>

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
        onSave={handleSaveRule}
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
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  ruleMode: RuleMode;
  rule: Rule | null;
  selectedType: RuleType;
  onTypeChange: (type: RuleType) => void;
  onClose: () => void;
  onSave: (values: RuleFormValues) => void;
}) {
  const [ruleName, setRuleName] = useState("");
  const [ruleCode, setRuleCode] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [capType, setCapType] = useState<CapType>("voucher");
  const [valuePointPercentage, setValuePointPercentage] = useState(100);
  const [valueMin, setValueMin] = useState(50000);
  const [valueMax, setValueMax] = useState(500000);
  const [expanded, setExpanded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRuleName(rule?.name ?? "");
    setRuleCode(rule?.code ?? "");
    setPeriodStart(rule?.periodStart ?? "");
    setPeriodEnd(rule?.periodEnd ?? "");
    setCapType(rule?.redemption?.capType ?? "voucher");
    setValuePointPercentage(rule?.redemption?.valuePointPercentage ?? 100);
    setValueMin(rule?.redemption?.valueMin ?? 50000);
    setValueMax(rule?.redemption?.valueMax ?? 500000);
    setFormError(null);
  }, [open, rule]);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  function handleSubmit() {
    const values: RuleFormValues = {
      name: ruleName,
      code: ruleCode,
      periodStart,
      periodEnd,
      type: selectedType,
      capType: ruleMode === "REDEEM" ? capType : undefined,
      valuePointPercentage: ruleMode === "REDEEM" ? valuePointPercentage : undefined,
      valueMin: ruleMode === "REDEEM" ? valueMin : undefined,
      valueMax: ruleMode === "REDEEM" ? valueMax : undefined,
    };
    const error = validateRuleForm(values);
    if (error) {
      setFormError(error);
      return;
    }
    onSave(values);
  }

  if (!open) return null;
  const examplePoints = calculatePoints(500000, 100000, 10);
  return (
    <div className="fixed inset-0 z-50">
      {!expanded && (
        <button className="absolute inset-0 cursor-default bg-overlay/30" aria-label="Close drawer" onClick={onClose} />
      )}
      <aside
        className={cx(
          "absolute top-0 flex h-full flex-col bg-primary shadow-2xl transition-[max-width,width,left,right] duration-200 ease-out",
          expanded ? "inset-x-0 w-full max-w-none" : "right-0 w-full max-w-xl",
        )}
      >
        <div className="flex items-start justify-between border-b border-secondary p-6">
          <div>
            <p className="text-sm font-semibold text-brand-secondary">{ruleMode === "EARN" ? "Earning Rule" : "Redemption Rule"}</p>
            <h2 className="mt-1 text-xl font-semibold text-primary">{mode === "add" ? "Add rule" : `Edit ${rule?.code}`}</h2>
            <p className="mt-1 text-sm text-quaternary">Conditional fields follow the CSV draft for rule type behavior.</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-9 min-h-9 w-9 px-0"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? "Exit full screen" : "Expand to full screen"}
              iconLeading={expanded ? Minimize01 : Expand01}
            />
            <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" onClick={onClose} aria-label="Close" iconLeading={XClose} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className={cx("grid gap-4", expanded && "mx-auto w-full max-w-6xl")}>
            <TextField
              label="Rule name"
              value={ruleName}
              placeholder="Input rule name"
              onChange={setRuleName}
            />
            <TextField
              label="Rule code"
              value={ruleCode}
              placeholder="EARN-PAY-001"
              onChange={setRuleCode}
            />
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
                <SelectField
                  label="Cap type"
                  value={capType}
                  options={redemptionCapTypeOptions}
                  onChange={(value) => setCapType(value as CapType)}
                />
                <NumberField
                  label="Value point percentage"
                  value={valuePointPercentage}
                  onChange={setValuePointPercentage}
                />
                <NumberField label="Value min" value={valueMin} onChange={setValueMin} />
                <NumberField label="Value max" value={valueMax} onChange={setValueMax} />
              </div>
            )}
            <SelectField
              label="Rule type"
              value={selectedType}
              options={Object.entries(typeLabel).map(([value, label]) => ({ value, label }))}
              onChange={(type) => onTypeChange(type as RuleType)}
            />
            <ConditionalRuleFields rule={rule} selectedType={selectedType} ruleMode={ruleMode} />
            <div className="rounded-lg border border-brand-secondary bg-brand-primary p-4 text-sm leading-6 text-secondary">
              <p className="font-semibold text-primary">Point calculation example</p>
              <p className="mt-1">Earned/Redeem Points = (500.000 / 100.000) x 10 = {examplePoints} poin.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-secondary p-4">
          {formError && <p className="mr-auto text-sm text-error-primary">{formError}</p>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {mode === "add" ? "Submit for review" : "Save changes"}
          </Button>
        </div>
      </aside>
    </div>
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
      <span className="mb-1.5 block text-sm font-medium text-secondary">{label}</span>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-secondary px-4 py-6 text-center transition hover:border-brand hover:bg-brand-primary/50"
      >
        <Upload01 className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-semibold text-secondary">
          {file ? file.name : "Choose CSV or XLSX file"}
        </span>
        {description && <span className="text-xs text-quaternary">{description}</span>}
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
          className="mt-2 text-sm font-medium text-tertiary hover:text-primary"
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
    <div className="grid gap-3 rounded-lg border border-secondary bg-primary p-3 sm:grid-cols-2">
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
            onChange={(transactionAmountMin) => onChange({ ...tier, transactionAmountMin })}
          />
          <MockInput
            label="Transaction amount (max)"
            value={tier.transactionAmountMax}
            placeholder="200000"
            onChange={(transactionAmountMax) => onChange({ ...tier, transactionAmountMax })}
          />
        </>
      ) : (
        <MockInput
          label="Transaction amount"
          value={tier.transactionAmount}
          placeholder={tier.operatorType === "lt" ? "100000" : "200000"}
          onChange={(transactionAmount) => onChange({ ...tier, transactionAmount })}
        />
      )}
      <MockInput
        label="Miles point"
        value={tier.milesPoint}
        placeholder="5"
        onChange={(milesPoint) => onChange({ ...tier, milesPoint })}
      />
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
    <section className="rounded-xl border border-secondary bg-secondary p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Partner block {index + 1}</p>
          <p className="text-xs text-quaternary">One partner program with its own tier table and accumulation cap.</p>
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
            <p className="text-sm font-medium text-secondary">Tier table</p>
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
          <MockInput
            label="Max capacity (miles)"
            value={block.maxCapacity}
            placeholder="30"
            onChange={(maxCapacity) => onChange({ ...block, maxCapacity })}
          />
        </div>
      </div>
    </section>
  );
}

function ThirdPartyPointsRuleFields({ rule }: { rule: Rule | null }) {
  const thirdParty = rule ? asThirdPartyConfig(rule) : undefined;
  const [binPrefixes, setBinPrefixes] = useState<string[]>(thirdParty?.binPrefixes ?? []);
  const [partnerBlocks, setPartnerBlocks] = useState<PartnerBlock[]>(createDefaultPartnerBlocks);

  return (
    <div className="grid gap-4 sm:col-span-2">
      <BinMultiSelectField
        className="sm:col-span-2"
        selected={binPrefixes}
        onChange={setBinPrefixes}
      />
      <div className="space-y-4 sm:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Partner earning blocks</p>
            <p className="text-xs text-quaternary">
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

type TimeframeCapacityFormRow = { min: string; max: string };
type TimeframeCapacityFormState = Record<TimeframeKey, TimeframeCapacityFormRow>;

function createTimeframeCapacityState(values?: TimeframeMaxCapacity): TimeframeCapacityFormState {
  return Object.fromEntries(
    ruleMaxCapacityTimeframeFields.map((field) => {
      const limit = values?.[field.key];
      return [
        field.key,
        {
          min: limit?.min != null ? String(limit.min) : "",
          max:
            limit?.max === "unlimited" || limit?.max == null
              ? TIMEFRAME_CAPACITY_DEFAULT_MAX
              : String(limit.max),
        },
      ];
    }),
  ) as TimeframeCapacityFormState;
}

function TransactionalRuleFields({ transactional }: { transactional?: TransactionalFields }) {
  const initialSourceSystem =
    (transactional?.sourceSystem ?? ruleSourceSystemOptions[0].value) as "saving" | "cardlink";
  const initialTransactionTypeOptions = getRuleTransactionTypeOptions(initialSourceSystem);
  const [sourceSystem, setSourceSystem] = useState<"saving" | "cardlink">(initialSourceSystem);
  const [transactionType, setTransactionType] = useState<RuleTransactionType>(() => {
    if (
      transactional?.transactionType &&
      initialTransactionTypeOptions.some((option) => option.value === transactional.transactionType)
    ) {
      return transactional.transactionType;
    }
    return initialTransactionTypeOptions[0].value;
  });
  const transactionTypeOptions = useMemo(
    () => getRuleTransactionTypeOptions(sourceSystem),
    [sourceSystem],
  );

  function handleSourceSystemChange(nextSourceSystem: "saving" | "cardlink") {
    setSourceSystem(nextSourceSystem);
    const nextOptions = getRuleTransactionTypeOptions(nextSourceSystem);
    if (!nextOptions.some((option) => option.value === transactionType)) {
      setTransactionType(nextOptions[0].value);
    }
  }
  const [merchantCategory, setMerchantCategory] = useState(
    transactional?.merchantCategory ?? merchantCategoryOptions[0].value,
  );
  const [merchantName, setMerchantName] = useState(
    transactional?.merchantName ?? merchantNameOptions[0].value,
  );
  const [binPrefixes, setBinPrefixes] = useState<string[]>(transactional?.binPrefixes ?? []);
  const [channel, setChannel] = useState<string>(transactional?.channel ?? ruleChannelOptions[0].value);
  const [maxCapacityType, setMaxCapacityType] = useState(
    transactional?.maxCapacityType ?? maxCapacityTypeOptions[0].value,
  );
  const [maxCapacityByTimeframe, setMaxCapacityByTimeframe] = useState(() =>
    createTimeframeCapacityState(transactional?.maxCapacityByTimeframe),
  );

  const hasTimeframeCapacity = Object.values(maxCapacityByTimeframe).some((row) => row.min.trim() !== "");

  function updateTimeframeCapacity(key: TimeframeKey, field: "min" | "max", value: string) {
    setMaxCapacityByTimeframe((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  }

  return (
    <>
      <SelectField
        label="Source system"
        value={sourceSystem}
        options={ruleSourceSystemOptions}
        onChange={(value) => handleSourceSystemChange(value as "saving" | "cardlink")}
      />
      <SelectField
        label="Transaction type"
        value={transactionType}
        options={transactionTypeOptions}
        onChange={(value) => setTransactionType(value as RuleTransactionType)}
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
      <div className="sm:col-span-2">
        <BinMultiSelectField selected={binPrefixes} onChange={setBinPrefixes} />
      </div>
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
      <div className="sm:col-span-2">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-secondary">Timeframe max capacity</legend>
          <p className="text-sm text-tertiary">
            Set min and max point limits per timeframe. Max defaults to unlimited. Fill at least one min
            value across daily, weekly, monthly, or annually.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ruleMaxCapacityTimeframeFields.map((field) => (
              <div key={field.key} className="rounded-lg border border-secondary p-3">
                <p className="mb-3 text-sm font-medium text-primary">{field.label}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Min"
                    type="number"
                    placeholder={field.minPlaceholder}
                    value={maxCapacityByTimeframe[field.key].min}
                    onChange={(value) => updateTimeframeCapacity(field.key, "min", value)}
                  />
                  <TextField
                    label="Max"
                    placeholder={TIMEFRAME_CAPACITY_DEFAULT_MAX}
                    value={maxCapacityByTimeframe[field.key].max}
                    onChange={(value) => updateTimeframeCapacity(field.key, "max", value)}
                    hint="Default is unlimited"
                  />
                </div>
              </div>
            ))}
          </div>
          {!hasTimeframeCapacity && (
            <p className="text-sm text-error-primary">Fill at least one timeframe min capacity.</p>
          )}
        </fieldset>
      </div>
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

function PointLogoPreview({ config }: { config: PointConfig }) {
  const initials = config.pointName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-2xl bg-brand-primary ring-1 ring-brand-secondary">
        {config.pointLogo ? (
          <img src={config.pointLogo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-brand-secondary">{initials || "PT"}</span>
        )}
      </div>
      <div>
        <p className="text-lg font-semibold text-primary">{config.pointName || "Point name"}</p>
        <p className="mt-1 text-sm text-tertiary">{formatExpiryPolicySummary(config)}</p>
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
            <Button variant="primary" onClick={startEdit} iconLeading={Edit03}>
              Edit configuration
            </Button>
          )
        }
      />

      <section className="surface p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b border-secondary pb-5 md:flex-row md:items-center md:justify-between">
          <PointLogoPreview config={active} />
          <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-tertiary">
            <p>
              Last updated <span className="font-medium text-primary">{updatedAtLabel}</span>
            </p>
            <p className="mt-1">
              By <span className="font-medium text-primary">{saved.updatedBy}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-quaternary">Point identity</h2>
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
              <label className="block text-sm font-medium text-secondary">
                <span className="mb-1.5 block">Upload logo</span>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-primary bg-secondary px-4 py-2 text-sm font-semibold text-tertiary"
                >
                  <Upload01 className="h-4 w-4" />
                  Choose file
                </button>
                <span className="mt-1.5 block text-xs text-quaternary">Prototype only — file upload is not wired.</span>
              </label>
            )}
          </div>

          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-quaternary">Expiry & reset policy</h2>

            <div className="rounded-lg border border-secondary bg-secondary p-4">
              <p className="text-sm font-semibold text-primary">Hybrid expiry model</p>
              <p className="mt-1 text-sm leading-6 text-tertiary">
                Points expire individually on a rolling TTL from each earn date. Separately, the full customer balance is reset to zero on an annual calendar date.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-secondary p-4">
              <h3 className="text-sm font-semibold text-primary">Rolling expiry (per earn)</h3>
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

            <div className="space-y-4 rounded-lg border border-secondary p-4">
              <h3 className="text-sm font-semibold text-primary">Annual balance reset</h3>
              <p className="text-sm text-tertiary">
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
              <p className="text-xs text-quaternary">
                Next scheduled reset: {formatAnnualBalanceResetDate(active.annualBalanceResetMonth, active.annualBalanceResetDay)} at {active.resetTime} WIB
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-5 md:p-6">
        <h2 className="text-base font-semibold text-primary">Downstream usage</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-tertiary">
          Earning and redemption rules reference this single program-level record for point naming, branding, and expiry behavior.
          Rule drawers and KPI calculations will read these values once backend integration is available.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { title: "Earning Rule", detail: "Uses point name and expiry policy when issuing points." },
            { title: "Redemption Rule", detail: "Uses point name and branding when redeeming rewards." },
            { title: "Analytics Dashboard", detail: "Expired Points KPI reflects both rolling TTL write-offs and annual balance resets." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-secondary bg-secondary p-4">
              <p className="text-sm font-semibold text-primary">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-tertiary">{item.detail}</p>
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-brand-secondary">
            <Plus className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-primary">Ready for next detail pass</h2>
          <p className="mt-2 text-sm leading-6 text-tertiary">
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
      <section className="surface overflow-hidden p-4 md:p-5">
        <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
          <Tabs.List type="button-border" size="sm" items={reportTabs.map((item) => ({ id: item, label: item }))}>
            {(item) => <Tabs.Item id={item.id}>{item.label}</Tabs.Item>}
          </Tabs.List>
          {reportTabs.map((item) => (
            <Tabs.Panel key={item} id={item} className="mt-4">
              <div className="rounded-lg border border-dashed border-primary bg-secondary p-6 text-sm text-tertiary">
                {item} report table, filters, export actions, and reconciliation status will be specified in the next iteration.
              </div>
            </Tabs.Panel>
          ))}
        </Tabs>
      </section>
    </PlaceholderPage>
  );
}

function App() {
  const [route, setRoute] = useState<RouteKey>("dashboard");
  const [allRules, setAllRules] = useState<Rule[]>(() => [...initialRules]);
  const activeItem = navItems.find((item) => item.key === route) ?? navItems[0];

  return (
    <AppShell route={route} onRouteChange={setRoute} activeItem={activeItem}>
      {route === "dashboard" && <DashboardPage />}
      {route === "point-config" && <PointConfigPage />}
      {route === "earning-rules" && (
        <RuleModule
          title="Earning Rule"
          description="Konfigurasi aturan, skema, dan parameter perolehan poin pengguna."
          rules={getRulesByMode(allRules, "EARN")}
          allRules={allRules}
          ruleMode="EARN"
          onRulesChange={setAllRules}
        />
      )}
      {route === "redemption-rules" && (
        <RuleModule
          title="Redemption Rule"
          description="Konfigurasi aturan, skema, dan parameter penukaran poin pengguna."
          rules={getRulesByMode(allRules, "REDEEM")}
          allRules={allRules}
          ruleMode="REDEEM"
          onRulesChange={setAllRules}
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
    </AppShell>
  );
}

export default App;
