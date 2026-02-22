import { ReactNode } from "react";

interface PrintSectionProps {
  children: ReactNode;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  className?: string;
}

export default function PrintSection({
  children,
  pageBreakBefore = false,
  pageBreakAfter = false,
  className = "",
}: PrintSectionProps) {
  const classes = [
    "print-section",
    pageBreakBefore && "page-break-before",
    pageBreakAfter && "page-break-after",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}

