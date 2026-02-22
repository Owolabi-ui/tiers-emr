"use client";

import { ReactNode } from "react";
import { usePrintMode } from "@/hooks/usePrintMode";

interface PrintablePageWrapperProps {
  children: ReactNode;
  printHeader?: ReactNode;
  enablePrintMode?: boolean;
}

export default function PrintablePageWrapper({
  children,
  printHeader,
  enablePrintMode = true,
}: PrintablePageWrapperProps) {
  usePrintMode(enablePrintMode ? "print-mode" : "");

  return (
    <div className="printable-page-root">
      {printHeader && <div className="print-header">{printHeader}</div>}
      {children}
    </div>
  );
}

