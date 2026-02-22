"use client";

import { useEffect } from "react";

/**
 * Manage print mode body class lifecycle.
 * Pass an empty className to disable.
 */
export function usePrintMode(className: string = "print-mode") {
  useEffect(() => {
    if (!className) return;

    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);
}

