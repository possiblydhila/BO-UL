import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import type { DashboardRole, ReconciliationRun } from "../../types";
import { formatNumber } from "../../utils/points";

function DashboardButton({
  children,
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const styles = {
    primary: "border-brand-600 bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ReconciliationPanel({
  role,
  runs,
  onRun,
}: {
  role: DashboardRole;
  runs: ReconciliationRun[];
  onRun: () => void;
}) {
  const [running, setRunning] = useState(false);
  const canRun = role === "approver" || role === "admin";

  const handleRun = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      onRun();
      setRunning(false);
    }, 1500);
  };

  return (
    <section className="surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Operational reconciliation</h3>
          <p className="mt-1 text-sm text-slate-500">
            Mock reconciliation job. Visible to Approver and Admin roles only.
          </p>
        </div>
        {canRun && (
          <DashboardButton variant="primary" onClick={handleRun} disabled={running}>
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Reconciliation Now
              </>
            )}
          </DashboardButton>
        )}
      </div>

      {!canRun && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Switch role to Approver or Admin to run reconciliation.
        </p>
      )}

      {runs.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Recent runs (last 5)</h4>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {runs.slice(0, 5).map((run) => (
              <li key={run.timestamp} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-slate-600">{run.timestamp}</span>
                <span className="font-medium text-success-700">{run.status}</span>
                <span className="tabular-nums text-slate-700">
                  {formatNumber(run.recordsChecked)} checked · {run.mismatchesFound} mismatches
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
