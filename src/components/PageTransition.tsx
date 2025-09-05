"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    // Update key on route change to retrigger CSS animation
    setKey(pathname);
  }, [pathname]);

  return (
    <div key={key} className="animate-fade-up">
      {children}
    </div>
  );
}
