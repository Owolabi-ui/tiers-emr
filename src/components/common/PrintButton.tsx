"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export default function PrintButton({
  label = "Print Record",
  className,
  onBeforePrint,
  onAfterPrint,
}: PrintButtonProps) {
  const handlePrint = () => {
    if (onAfterPrint) {
      window.addEventListener("afterprint", onAfterPrint, { once: true });
    }
    onBeforePrint?.();
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className={
        className ||
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors no-print"
      }
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}

