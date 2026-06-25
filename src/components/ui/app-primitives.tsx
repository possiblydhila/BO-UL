import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import { Badge as UiBadge } from "@/components/base/badges/badges";
import { Button as UiButton } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { statusLabels } from "@/data/mockData";
import type { RuleStatus } from "@/types";

const statusColor: Record<RuleStatus, "success" | "brand" | "warning" | "gray" | "error"> = {
  active: "success",
  scheduled: "brand",
  in_review: "warning",
  draft: "gray",
  inactive: "gray",
  expired: "error",
};

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonColor: Record<ButtonVariant, "primary" | "secondary" | "tertiary"> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "tertiary",
};

export function Button({
  children,
  variant = "secondary",
  className,
  iconLeading,
  iconTrailing,
  ...props
}: React.ComponentProps<typeof UiButton> & {
  variant?: ButtonVariant;
  iconLeading?: React.ComponentProps<typeof UiButton>["iconLeading"];
  iconTrailing?: React.ComponentProps<typeof UiButton>["iconTrailing"];
}) {
  return (
    <UiButton
      color={buttonColor[variant]}
      className={className}
      iconLeading={iconLeading}
      iconTrailing={iconTrailing}
      {...props}
    >
      {children}
    </UiButton>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <NativeSelect
      label={label}
      value={value}
      disabled={disabled}
      options={options}
      className={className}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function DateField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      label={label}
      type="date"
      value={value}
      className={className}
      onChange={onChange}
    />
  );
}

export function Badge({ status }: { status: RuleStatus }) {
  return (
    <UiBadge color={statusColor[status]} size="sm">
      {statusLabels[status]}
    </UiBadge>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <Input
      label={label}
      type={type}
      value={value}
      placeholder={placeholder}
      isDisabled={disabled}
      hint={hint}
      className={className}
      onChange={onChange}
    />
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  disabled,
  hint,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <Input
      label={label}
      type="number"
      value={String(value)}
      isDisabled={disabled}
      hint={hint}
      className={className}
      onChange={(next) => onChange(Number(next) || min)}
    />
  );
}

export function MockInput({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return <Input label={label} value={value ?? ""} placeholder={placeholder} isReadOnly />;
}

export function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
  className?: string;
}) {
  return <Icon className={className} aria-hidden="true" />;
}
