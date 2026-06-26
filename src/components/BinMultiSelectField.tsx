import { useMemo } from "react";
import type { Selection } from "react-aria-components";
import { Table, TableCard } from "@/components/application/table/table";
import { MultiSelect } from "@/components/base/select/multi-select";
import type { SelectItemType } from "@/components/base/select/select-shared";
import { Button } from "@/components/ui/app-primitives";
import { debitBinCatalog, getDebitBinByPrefix } from "@/data/mockData";

const debitBinSelectItems: SelectItemType[] = debitBinCatalog.map((bin) => ({
  id: bin.prefix,
  label: bin.prefix,
  supportingText: `${bin.network} · ${bin.name}`,
}));

function selectionToPrefixes(keys: Selection): string[] {
  if (keys === "all") {
    return debitBinCatalog.map((bin) => bin.prefix);
  }
  return Array.from(keys).map(String);
}

type BinMultiSelectFieldProps = {
  label?: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
};

export function BinMultiSelectField({
  label = "BIN",
  selected,
  onChange,
  className = "",
}: BinMultiSelectFieldProps) {
  const selectedKeys = useMemo(() => new Set(selected), [selected]);

  const tableItems = useMemo(
    () => selected.map((prefix, index) => ({ id: prefix, rowNumber: index + 1, prefix })),
    [selected],
  );

  function removePrefix(prefix: string) {
    onChange(selected.filter((item) => item !== prefix));
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <MultiSelect
        label={label}
        placeholder="Select BIN prefixes"
        hint="Search and select multiple BIN prefixes from the dropdown."
        items={debitBinSelectItems}
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => onChange(selectionToPrefixes(keys))}
        onReset={() => onChange([])}
        onSelectAll={() => onChange(debitBinCatalog.map((bin) => bin.prefix))}
        selectedCountFormatter={(count) => `${count} BIN${count === 1 ? "" : "s"} selected`}
      >
        {(item) => (
          <MultiSelect.Item
            id={item.id}
            label={item.label}
            supportingText={item.supportingText}
            selectionIndicator="checkbox"
            selectionIndicatorAlign="left"
          />
        )}
      </MultiSelect>

      {selected.length > 0 && (
        <TableCard.Root>
          <TableCard.Header title="Selected BIN prefixes" badge={String(selected.length)} />
          <Table aria-label="Selected BIN prefixes" size="sm">
            <Table.Header>
              <Table.Head id="rowNumber" label="No" />
              <Table.Head id="prefix" label="Prefix BIN" isRowHeader />
              <Table.Head id="network" label="Jenis" />
              <Table.Head id="name" label="Nama" />
              <Table.Head id="actions" label="Actions" className="text-right" />
            </Table.Header>
            <Table.Body items={tableItems}>
              {(item) => {
                const bin = getDebitBinByPrefix(item.prefix);
                return (
                  <Table.Row id={item.id}>
                    <Table.Cell className="text-quaternary">{item.rowNumber}</Table.Cell>
                    <Table.Cell className="font-medium text-primary">{item.prefix}</Table.Cell>
                    <Table.Cell>{bin?.network ?? "—"}</Table.Cell>
                    <Table.Cell>{bin?.name ?? "—"}</Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => removePrefix(item.prefix)}>
                          Remove
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table>
        </TableCard.Root>
      )}
    </div>
  );
}
