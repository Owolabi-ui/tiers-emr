interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({ className = "", size = "md" }: BrandLogoProps) {
  const sizeClass =
    size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <span className={`font-bold tracking-tight text-[#065f46] ${sizeClass} ${className}`.trim()}>
      DEMO<span className="text-emerald-500">-EMR</span>
    </span>
  );
}

