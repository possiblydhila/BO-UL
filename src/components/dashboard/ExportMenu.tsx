import { useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ChevronDown, File02, Image01 } from "@untitledui/icons";
import { Button } from "@/components/ui/app-primitives";

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
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-secondary hover:bg-secondary_hover disabled:opacity-50"
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
      <Button
        onClick={() => setOpen((v) => !v)}
        isDisabled={exporting}
        aria-haspopup="menu"
        aria-expanded={open}
        iconTrailing={ChevronDown}
      >
        Export
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-secondary bg-primary py-1 shadow-xs">
            <ExportButton onClick={exportPng} disabled={exporting}>
              <Image01 className="size-4" />
              Export PNG
            </ExportButton>
            <ExportButton onClick={exportPdf} disabled={exporting}>
              <File02 className="size-4" />
              Export PDF
            </ExportButton>
          </div>
        </>
      )}
    </div>
  );
}
