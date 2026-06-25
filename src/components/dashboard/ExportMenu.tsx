import { useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ChevronDown, FileImage, FileText } from "lucide-react";

function ExportButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ExportMenu({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const capture = async () => {
    const el = containerRef.current;
    if (!el) throw new Error("Dashboard element not found");
    return html2canvas(el, { useCORS: true, logging: false });
  };

  const exportPng = async () => {
    setExporting(true);
    try {
      const canvas = await capture();
      const link = document.createElement("a");
      link.download = `loyalty-analytics-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const canvas = await capture();
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`loyalty-analytics-${Date.now()}.pdf`);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Export
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-subtle">
            <ExportButton onClick={exportPng} disabled={exporting}>
              <FileImage className="h-4 w-4" />
              Export PNG
            </ExportButton>
            <ExportButton onClick={exportPdf} disabled={exporting}>
              <FileText className="h-4 w-4" />
              Export PDF
            </ExportButton>
          </div>
        </>
      )}
    </div>
  );
}
