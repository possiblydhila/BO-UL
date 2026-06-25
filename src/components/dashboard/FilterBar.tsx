import { Filter } from "lucide-react";
import { channelOptions, savingTransactionTypeOptions, sourceSystemOptions } from "../../data/mockData";
import type { DashboardFilters } from "../../types";
import { DateField, SelectField } from "./fields";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}) {
  const showTransactionType = filters.sourceSystem === "saving";

  return (
    <section className="surface p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Filter className="h-4 w-4 text-brand-600" />
        Filter dashboard
        <span className="ml-auto text-xs font-medium text-slate-500">All filters apply globally</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DateField
          label="Start date"
          value={filters.startDate}
          onChange={(startDate) => onChange({ ...filters, startDate })}
        />
        <DateField
          label="End date"
          value={filters.endDate}
          onChange={(endDate) => onChange({ ...filters, endDate })}
        />
        <SelectField
          label="Channel"
          value={filters.channel}
          options={channelOptions}
          onChange={(channel) => onChange({ ...filters, channel: channel as DashboardFilters["channel"] })}
        />
        <SelectField
          label="Source system"
          value={filters.sourceSystem}
          options={sourceSystemOptions}
          onChange={(sourceSystem) =>
            onChange({ ...filters, sourceSystem: sourceSystem as DashboardFilters["sourceSystem"] })
          }
        />
        {showTransactionType && (
          <SelectField
            label="Transaction type"
            value={filters.transactionType}
            options={savingTransactionTypeOptions}
            onChange={(transactionType) =>
              onChange({ ...filters, transactionType: transactionType as DashboardFilters["transactionType"] })
            }
          />
        )}
      </div>
    </section>
  );
}
