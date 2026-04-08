interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export default function BrandLogo({ className = "", size = "md", inverted = false }: BrandLogoProps) {
  const sizeClass =
    size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";
  const primaryColor = inverted ? "text-white" : "text-[#065f46]";
  const accentColor = inverted ? "text-emerald-300" : "text-emerald-500";

  return (
    <span className={`font-bold tracking-tight ${primaryColor} ${sizeClass} ${className}`.trim()}>
      DEMO<span className={accentColor}>-EMR</span>
    </span>
  );
}

