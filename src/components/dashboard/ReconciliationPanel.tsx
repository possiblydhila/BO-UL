import { useState } from "react";
import { Play } from "@untitledui/icons";
import { Button } from "@/components/ui/app-primitives";
import type { DashboardRole, ReconciliationRun } from "../../types";
import { formatNumber } from "../../utils/points";

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
          <h3 className="text-base font-semibold text-primary">Operational reconciliation</h3>
          <p className="mt-1 text-sm text-quaternary">
            Mock reconciliation job. Visible to Approver and Admin roles only.
          </p>
        </div>
        {canRun && (
          <Button
            variant="primary"
            iconLeading={Play}
            isLoading={running}
            onClick={handleRun}
            isDisabled={running}
          >
            {running ? "Running…" : "Run Reconciliation Now"}
          </Button>
        )}
      </div>

      {!canRun && (
        <p className="mt-4 rounded-lg border border-secondary bg-secondary px-4 py-3 text-sm text-tertiary">
          Switch role to Approver or Admin to run reconciliation.
        </p>
      )}

      {runs.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3 text-sm font-semibold text-secondary">Recent runs (last 5)</h4>
          <ul className="divide-y divide-tertiary rounded-lg border border-secondary">
            {runs.slice(0, 5).map((run) => (
              <li key={run.timestamp} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-tertiary">{run.timestamp}</span>
                <span className="font-medium text-success-primary">{run.status}</span>
                <span className="tabular-nums text-secondary">
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
