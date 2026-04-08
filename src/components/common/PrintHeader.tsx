interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export default function PrintHeader({
  title,
  subtitle,
  showLogo = true,
}: PrintHeaderProps) {
  return (
    <>
      {showLogo && (
        <span className="font-bold text-3xl tracking-tight text-[#065f46]">
          DEMO<span className="text-emerald-500">-EMR</span>
        </span>
      )}
      <h1 className="print-title">{title}</h1>
      {subtitle && <p className="print-subtitle">{subtitle}</p>}
    </>
  );
}

