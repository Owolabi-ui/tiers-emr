"use client";

import { useMemo, useState } from "react";

function formatDDMMYY(d: Date) {
  try {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
}

export default function TxCurrSection() {
  const [tab, setTab] = useState<"treatment" | "vl">("treatment");
  const today = useMemo(() => formatDDMMYY(new Date()), []);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Header row: buttons left, date right */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="inline-flex rounded-lg border border-black/10 overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "treatment"
                ? "bg-[#5b21b6] text-white"
                : "bg-white hover:bg-black/5"
            }`}
            onClick={() => setTab("treatment")}
          >
            Treatment
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-black/10 ${
              tab === "vl" ? "bg-[#5b21b6] text-white" : "bg-white hover:bg-black/5"
            }`}
            onClick={() => setTab("vl")}
          >
            Viral Load
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="font-medium tabular-nums">{today}</span>
        </div>
      </div>

      {tab === "treatment" ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: TX_CURR by Age and Sex */}
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">TX_CURR by Age and Sex</p>
            </div>
            <div className="h-64 rounded-md bg-black/[.03] dark:bg-white/[.06] grid place-items-center text-sm opacity-80">
              Chart placeholder
            </div>
          </div>

          {/* Middle: Monthly TX_New by Age and Sex */}
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Monthly TX_New by Age and Sex</p>
            </div>
            <div className="h-64 rounded-md bg-black/[.03] dark:bg白/[.06] grid place-items-center text-sm opacity-80">
              Chart placeholder
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 dark:border-white/15 p-8 text-center card">
          <p className="font-medium">Viral Load view</p>
          <p className="text-sm opacity-80 mt-1">Configure content for VL when ready.</p>
        </div>
      )}
    </section>
  );
}
