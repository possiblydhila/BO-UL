"use client";

import type { FC, HTMLAttributes } from "react";
import { Button as AriaButton } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

const styles = sortCx({
  root: "group relative flex w-full cursor-pointer items-start gap-3 rounded-md bg-primary p-2.5 text-left outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
  rootSelected: "bg-secondary hover:bg-secondary_hover",
});

interface PortalNavItemProps {
  label: string;
  description?: string;
  icon?: FC<HTMLAttributes<HTMLOrSVGElement>>;
  current?: boolean;
  onPress: () => void;
}

export function PortalNavItem({ label, description, icon: Icon, current, onPress }: PortalNavItemProps) {
  return (
    <AriaButton onPress={onPress} className={cx(styles.root, current && styles.rootSelected)}>
      {Icon && (
        <Icon
          aria-hidden="true"
          className={cx(
            "mt-0.5 size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover:text-fg-quaternary_hover",
            current && "text-fg-brand-primary",
          )}
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block truncate text-sm font-semibold text-secondary transition-inherit-all group-hover:text-secondary_hover",
            current && "text-secondary_hover",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-tertiary">{description}</span>
        )}
      </span>
    </AriaButton>
  );
}
