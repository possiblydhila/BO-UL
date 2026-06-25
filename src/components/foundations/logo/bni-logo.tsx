import { cx } from "@/utils/cx";

export function BniLogo({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-sm font-bold text-white">
        BL
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary">BNI Loyalty</p>
        <p className="truncate text-xs text-quaternary">Back Office Portal</p>
      </div>
    </div>
  );
}

export function BniLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-sm font-bold text-white",
        className,
      )}
    >
      BL
    </div>
  );
}
