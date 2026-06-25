import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  Download,
  Edit3,
  FileImage,
  FileText,
  Filter,
  Menu,
  MoreHorizontal,
  PanelRightOpen,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  auditNotes,
  cardTypeOptions,
  channelOptions,
  cobrandCardTypeOptions,
  dashboardData,
  earningRules,
  maxCapacityTimeframeOptions,
  maxCapacityTypeOptions,
  merchantCategoryOptions,
  merchantNameOptions,
  navItems,
  operatorTypeOptions,
  partnerCapTimeframeOptions,
  redemptionRules,
  reportTabs,
  rewardTypeOptions,
  ruleChannelOptions,
  ruleSourceSystemOptions,
  ruleTransactionTypeOptions,
  savingTransactionTypeOptions,
  sourceSystemOptions,
  statusLabels,
  targetUserOptions,
  thirdPartyProgramOptions,
} from "./data/mockData";
import type {
  DashboardFilters,
  DistributionPoint,
  EarningRule,
  KpiCard,
  RedemptionRule,
  Role,
  RouteKey,
  RuleBase,
  RuleStatus,
  RuleType,
} from "./types";
import { calculatePoints, formatCompact, formatNumber } from "./utils/points";

const colors = ["#1570ef", "#12b76a", "#f79009", "#7a5af8", "#f04438", "#06aed4"];

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

function formatCapType(value: RedemptionRule["capType"]) {
  return value.replace(/_/g, " ");
}

const defaultFilters: DashboardFilters = {
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  channel: "all",
  sourceSystem: "all",
  transactionType: "all",
  campaignId: "hut-bni",
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

function StatCard({ item }: { item: KpiCard }) {
  const trendColor =
    item.trend === "up" ? "text-success-700" : item.trend === "down" ? "text-danger-700" : "text-slate-500";
  return (
    <article className="surface flex min-h-[142px] flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
        </div>
        <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" aria-label={`View details ${item.label}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <p className="text-sm text-slate-500">{item.detail}</p>
        <p className={`mt-1 text-sm font-semibold ${trendColor}`}>{item.delta}</p>
      </div>
    </article>
  );
}

function CardGrid({ title, items }: { title: string; items: KpiCard[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <button className="text-sm font-semibold text-brand-700">View details</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="ghost" className="h-9 min-h-9 w-9 px-0" aria-label={`View details ${title}`}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-[280px] min-w-0">{children}</div>
    </section>
  );
}

function AuditNotes() {
  return (
    <section className="surface border-warning-200 bg-warning-50/60 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-warning-700">Dashboard audit</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Missing pieces and questionable details</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
            These are intentionally visible in the prototype so product, data, finance, and operations teams can close the
            open definitions before backend integration.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          Needs business sign-off
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {auditNotes.map((note) => (
          <div key={note} className="rounded-lg border border-warning-200 bg-white p-3 text-sm leading-6 text-slate-700">
            {note}
          </div>
        ))}
      </div>
    </section>
  );
}

function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  useEffect(() => {
    if (filters.sourceSystem !== "saving" && filters.transactionType !== "all") {
      setFilters((current) => ({ ...current, transactionType: "all" }));
    }
  }, [filters.sourceSystem, filters.transactionType]);

  const selectedCampaign = dashboardData.campaigns.find((campaign) => campaign.id === filters.campaignId) ?? dashboardData.campaigns[0];
  const filterFactor =
    (filters.channel === "all" ? 1 : 0.76) *
    (filters.sourceSystem === "all" ? 1 : filters.sourceSystem === "saving" ? 0.86 : 0.64) *
    (filters.transactionType === "all" ? 1 : 0.72);

  const filteredTrend = dashboardData.trends.map((item) => ({
    ...item,
    cifEarn: Math.round(item.cifEarn * filterFactor),
    cifRedeem: Math.round(item.cifRedeem * filterFactor),
    pointEarn: Math.round(item.pointEarn * filterFactor),
    pointRedeem: Math.round(item.pointRedeem * filterFactor),
  }));

  const campaignComparison = [
    { label: "Before", redeem: selectedCampaign.beforeRedeem, participants: Math.round(selectedCampaign.participants * 0.62) },
    { label: "After", redeem: selectedCampaign.afterRedeem, participants: selectedCampaign.participants },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Portal Back Office"
        title="Analytics Dashboard"
        description="Monitoring KPI loyalty untuk earning, redemption rate, estimated cost, liability, campaign, channel, dan trend comparison berbasis mock data."
        action={
          <>
            <Button>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button>
              <FileImage className="h-4 w-4" />
              Export PNG
            </Button>
          </>
        }
      />

      <section className="surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Filter className="h-4 w-4 text-brand-600" />
          Filter dashboard
          <span className="ml-auto text-xs font-medium text-slate-500">Last updated: just now</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DateField label="Start date" value={filters.startDate} onChange={(startDate) => setFilters({ ...filters, startDate })} />
          <DateField label="End date" value={filters.endDate} onChange={(endDate) => setFilters({ ...filters, endDate })} />
          <SelectField label="Channel" value={filters.channel} options={channelOptions} onChange={(channel) => setFilters({ ...filters, channel: channel as DashboardFilters["channel"] })} />
          <SelectField label="Source system" value={filters.sourceSystem} options={sourceSystemOptions} onChange={(sourceSystem) => setFilters({ ...filters, sourceSystem: sourceSystem as DashboardFilters["sourceSystem"] })} />
          <SelectField
            label="Transaction type"
            value={filters.transactionType}
            options={savingTransactionTypeOptions}
            disabled={filters.sourceSystem !== "saving"}
            onChange={(transactionType) => setFilters({ ...filters, transactionType: transactionType as DashboardFilters["transactionType"] })}
          />
        </div>
      </section>

      <AuditNotes />

      <CardGrid title="Customer Engagement" items={dashboardData.customerEngagement} />
      <CardGrid title="Poin Performance" items={dashboardData.pointPerformance} />
      <CardGrid title="Transaction Impact" items={dashboardData.transactionImpact} />
      <CardGrid title="Channel Performance" items={dashboardData.channelPerformance} />
      <CardGrid title="Campaign" items={dashboardData.campaignCards} />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Daily / Weekly / Monthly trend" description="CIF earn, CIF redeem, point earn, dan point redeemed. Point values shown in millions.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredTrend} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cifEarn" name="CIF Earn" stroke="#1570ef" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cifRedeem" name="CIF Redeem" stroke="#12b76a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pointEarn" name="Point Earn M" stroke="#f79009" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pointRedeem" name="Point Redeem M" stroke="#7a5af8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Earning poin per aktivitas" description="Distribusi earning berdasarkan aktivitas nasabah.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.earningByActivity} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip />
              <Bar dataKey="value" name="Point M" radius={[6, 6, 0, 0]} fill="#1570ef" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Earning poin per source" description="Saving vs Cardlink contribution.">
          <DonutChart data={dashboardData.earningBySource} />
        </ChartPanel>

        <ChartPanel title="Redemption per channel" description="Total redemption point per channel.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData.redemptionByChannel} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip />
              <Area type="monotone" dataKey="value" name="Point M" stroke="#1570ef" fill="#d9efff" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Redemption per reward" description="Voucher, barang, donasi, e-wallet, dan annual fee.">
          <DonutChart data={dashboardData.redemptionByReward} />
        </ChartPanel>

        <section className="surface p-5">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Before vs after campaign</h3>
              <p className="mt-1 text-sm text-slate-500">Mock comparison by selected campaign and baseline period.</p>
            </div>
            <SelectField
              label="Campaign"
              value={filters.campaignId}
              options={dashboardData.campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))}
              onChange={(campaignId) => setFilters({ ...filters, campaignId })}
            />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignComparison} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip />
                <Legend />
                <Bar dataKey="redeem" name="Redeem M" radius={[6, 6, 0, 0]} fill="#1570ef" />
                <Bar dataKey="participants" name="Participants" radius={[6, 6, 0, 0]} fill="#12b76a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: DistributionPoint[] }) {
  return (
    <div className="grid h-full min-h-0 gap-4 md:grid-cols-[1fr_180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col justify-center gap-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-semibold text-slate-950">{item.value}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function canEdit(role: Role, status: RuleStatus) {
  return role === "employee" ? status === "draft" : status === "in_review" || status === "scheduled";
}

function SummaryCounters({ rules }: { rules: RuleBase[] }) {
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

function RuleModule<T extends EarningRule | RedemptionRule>({
  title,
  description,
  rules,
  kind,
}: {
  title: string;
  description: string;
  rules: T[];
  kind: "earning" | "redemption";
}) {
  const [role, setRole] = useState<Role>("employee");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RuleStatus | "all">("all");
  const [drawerRule, setDrawerRule] = useState<T | null>(null);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RuleType>("transactional");

  const filteredRules = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesQuery =
        !lowered ||
        rule.name.toLowerCase().includes(lowered) ||
        rule.code.toLowerCase().includes(lowered) ||
        rule.id.toLowerCase().includes(lowered);
      const matchesStatus = status === "all" || rule.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rules, status]);

  function openAdd() {
    setDrawerMode("add");
    setDrawerRule(null);
    setSelectedType("transactional");
    setDrawerOpen(true);
  }

  function openEdit(rule: T) {
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
                {kind === "redemption" && <th className="px-4 py-3">Cap type</th>}
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
                  {kind === "redemption" && <td className="px-4 py-4 text-slate-600">{formatCapType((rule as RedemptionRule).capType)}</td>}
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
        kind={kind}
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
  kind,
  rule,
  selectedType,
  onTypeChange,
  onClose,
}: {
  open: boolean;
  mode: "add" | "edit";
  kind: "earning" | "redemption";
  rule: EarningRule | RedemptionRule | null;
  selectedType: RuleType;
  onTypeChange: (type: RuleType) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const examplePoints = calculatePoints(500000, 100000, 10);
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 cursor-default bg-slate-950/30" aria-label="Close drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">{kind === "earning" ? "Earning Rule" : "Redemption Rule"}</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <MockInput label="Period start" value={rule?.periodStart ?? ""} placeholder="YYYY-MM-DD" />
              <MockInput label="Period end" value={rule?.periodEnd ?? ""} placeholder="YYYY-MM-DD" />
            </div>
            {kind === "redemption" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <MockInput label="Cap type" value={(rule as RedemptionRule | null)?.capType ? formatCapType((rule as RedemptionRule).capType) : "voucher"} />
                <MockInput label="Value point percentage" value={`${(rule as RedemptionRule | null)?.valuePointPercentage ?? 100}`} />
                <MockInput label="Value min" value={`${(rule as RedemptionRule | null)?.valueMin ?? 50000}`} />
                <MockInput label="Value max" value={`${(rule as RedemptionRule | null)?.valueMax ?? 500000}`} />
              </div>
            )}
            <SelectField
              label="Rule type"
              value={selectedType}
              options={Object.entries(typeLabel).map(([value, label]) => ({ value, label }))}
              onChange={(type) => onTypeChange(type as RuleType)}
            />
            <ConditionalRuleFields selectedType={selectedType} kind={kind} />
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

function TacticalRuleFields() {
  return (
    <>
      <MockInput label="Campaign/event name" value="HUT BNI" />
      <TargetUserRewardFields />
    </>
  );
}

function PersonalEarningRuleFields() {
  return (
    <>
      <MockInput label="Type" value="birthday" />
      <TargetUserRewardFields />
      <MockInput label="Receive point" value="100 point" />
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

function ThirdPartyPointsRuleFields() {
  const [cardTypes, setCardTypes] = useState<string[]>(
    cobrandCardTypeOptions.map((option) => option.value),
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

function TransactionalRuleFields() {
  const [sourceSystem, setSourceSystem] = useState(ruleSourceSystemOptions[0].value);
  const [transactionType, setTransactionType] = useState(ruleTransactionTypeOptions[0].value);
  const [merchantCategory, setMerchantCategory] = useState(merchantCategoryOptions[0].value);
  const [merchantName, setMerchantName] = useState(merchantNameOptions[0].value);
  const [cardType, setCardType] = useState(cardTypeOptions[0].value);
  const [channel, setChannel] = useState<string>(ruleChannelOptions[0].value);
  const [maxCapacityType, setMaxCapacityType] = useState(maxCapacityTypeOptions[0].value);
  const [maxCapacityTimeframe, setMaxCapacityTimeframe] = useState(maxCapacityTimeframeOptions[0].value);

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
      <MockInput label="Conversion unit" value="100000" />
      <MockInput label="Multiplier" value="10" />
      <MockInput label="Max capacity" value="2000000 point" />
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

function ConditionalRuleFields({ selectedType, kind }: { selectedType: RuleType; kind: "earning" | "redemption" }) {
  if (selectedType === "activity") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <MockInput label="Activity type" value="aktivasi wondr" />
        <MockInput label="Amount field" placeholder="Active for balance increase activity" />
        <MockInput label={kind === "earning" ? "Receive point" : "Redeem point"} value="100 point" />
      </div>
    );
  }

  if (selectedType === "third_party_points") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <ThirdPartyPointsRuleFields />
      </div>
    );
  }

  if (selectedType === "personal_earning") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <PersonalEarningRuleFields />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {selectedType === "tactical" && <TacticalRuleFields />}
      <TransactionalRuleFields />
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
          {route === "dashboard" && <Dashboard />}
          {route === "earning-rules" && (
            <RuleModule
              title="Earning Rule"
              description="Konfigurasi aturan, skema, dan parameter perolehan poin pengguna."
              rules={earningRules}
              kind="earning"
            />
          )}
          {route === "redemption-rules" && (
            <RuleModule
              title="Redemption Rule"
              description="Konfigurasi aturan, skema, dan parameter penukaran poin pengguna."
              rules={redemptionRules}
              kind="redemption"
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
