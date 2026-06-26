import type { FC, SVGProps } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { cx } from "@/utils/cx";

type CountryFlagProps = SVGProps<SVGSVGElement> & {
  code: string;
};

export function CountryFlag({ code, className, ...props }: CountryFlagProps) {
  const Flag = (Flags as Record<string, FC<SVGProps<SVGSVGElement>>>)[code.toUpperCase()];

  if (!Flag) {
    return (
      <span
        className={cx("inline-flex size-4 shrink-0 items-center justify-center rounded-sm bg-secondary text-[10px] font-medium text-quaternary", className)}
        aria-hidden
      >
        ?
      </span>
    );
  }

  return (
    <Flag
      aria-hidden
      className={cx("h-4 w-5 shrink-0 rounded-sm object-cover shadow-xs ring-1 ring-primary ring-inset", className)}
      {...props}
    />
  );
}
