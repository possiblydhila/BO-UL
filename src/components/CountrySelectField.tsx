import type { FC } from "react";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select-shared";
import { CountryFlag } from "@/components/CountryFlag";
import { ruleCountryOptions } from "@/data/mockData";

function createCountryFlagIcon(code: string): FC {
  const FlagIcon = () => <CountryFlag code={code} />;
  return FlagIcon;
}

const countrySelectItems: SelectItemType[] = ruleCountryOptions.map((country) => ({
  id: country.code,
  label: country.name,
  icon: createCountryFlagIcon(country.code),
}));

type CountrySelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CountrySelectField({
  label = "Country",
  value,
  onChange,
  className,
}: CountrySelectFieldProps) {
  return (
    <Select
      label={label}
      placeholder="Select country"
      items={countrySelectItems}
      selectedKey={value}
      className={className}
      onSelectionChange={(key) => {
        if (key != null) {
          onChange(String(key));
        }
      }}
    >
      {(item) => (
        <Select.Item id={item.id} label={item.label} icon={item.icon} />
      )}
    </Select>
  );
}
