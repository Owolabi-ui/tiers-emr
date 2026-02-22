interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
}

export default function PrintHeader({
  title,
  subtitle,
  showLogo = true,
  logoSrc = "/images/TIERs-Logo-good.png",
  logoAlt = "TIERS Logo",
}: PrintHeaderProps) {
  return (
    <>
      {showLogo && <img src={logoSrc} alt={logoAlt} />}
      <h1 className="print-title">{title}</h1>
      {subtitle && <p className="print-subtitle">{subtitle}</p>}
    </>
  );
}

