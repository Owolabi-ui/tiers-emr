import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <Image
                src="/images/TIERs-Logo-good.png"
                alt="TIERs Clinic Logo"
                width={56}
                height={56}
                priority
              />
              <span className="text-sm px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">EMR Mock</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-[#5b21b6]">
              A modern EMR for inclusive, high‑quality care
            </h1>
            <p className="text-base sm:text-lg opacity-80 max-w-prose mb-8">
              Secure client data, real‑time documentation, streamlined appointments, and program‑ready reporting. Purpose‑built for HTS, PrEP, STI, mental health, dispensing, and teleconsultation.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/demo" className="inline-flex items-center rounded-md btn-brand text-sm font-medium px-4 py-2">
                View demo screens
              </Link>
              <Link href="/features" className="inline-flex items-center rounded-md btn-outline-brand px-4 py-2 text-sm">
                Explore features
              </Link>
            </div>
          </div>
          <div className="min-w-0 w-full rounded-xl border border-black/10 dark:border-white/15 bg-black/[.02] dark:bg-white/[.03] p-3 sm:p-4 overflow-hidden animate-fade-up">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-[color-mix(in_oklab,var(--brand-purple),white_80%)] to-[color-mix(in_oklab,var(--brand-orange),white_80%)] dark:from-[color-mix(in_oklab,var(--brand-purple),black_85%)] dark:to-[color-mix(in_oklab,var(--brand-orange),black_85%)] overflow-hidden">
              <div className="h-full w-full flex flex-col">
                <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur">
                  <p className="font-semibold">EMR Workflow Preview</p>
                  <p className="text-xs opacity-80">Patient summary • Appointment queue • Encounter forms • Dispensing</p>
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="min-w-0 p-4">
                    <div className="max-w-full overflow-x-auto rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 card">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-black/[.04] dark:bg-white/[.06]">
                          <tr>
                            <th className="px-3 py-2 font-medium">Metric</th>
                            <th className="px-3 py-2 font-medium">Today</th>
                            <th className="px-3 py-2 font-medium">This Week</th>
                            <th className="px-3 py-2 font-medium">This Month</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { metric: "New registrations", t: 18, w: 104, m: 402 },
                            { metric: "Appointments completed", t: 42, w: 263, m: 980 },
                            { metric: "HTS tests done", t: 27, w: 168, m: 645 },
                            { metric: "PrEP initiations", t: 6, w: 31, m: 124 },
                            { metric: "STI cases managed", t: 9, w: 54, m: 198 },
                            { metric: "Mental health sessions", t: 12, w: 71, m: 276 },
                            { metric: "Medications dispensed", t: 57, w: 318, m: 1226 },
                            { metric: "Teleconsultations", t: 8, w: 39, m: 151 },
                          ].map((row) => (
                            <tr key={row.metric} className="border-t border-black/5 dark:border-white/10">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className="font-medium">{row.metric}</span>
                              </td>
                              <td className="px-3 py-2">{row.t}</td>
                              <td className="px-3 py-2">{row.w}</td>
                              <td className="px-3 py-2">{row.m}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats chart */}
  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-up">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Key activity overview</h2>
            <p className="text-sm opacity-80">Today • This week • This month</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-sky-500"></span> New registrations</div>
            <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-violet-500"></span> Appointments completed</div>
            <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-emerald-500"></span> HTS tests done</div>
          </div>
        </div>

        {(() => {
          // Data aligned with the mock table above
          const labels = ["Today", "This Week", "This Month"] as const;
          const series = [
            {
              name: "New registrations",
              color: "#0ea5e9", // sky-500
              values: [18, 104, 402],
            },
            {
              name: "Appointments completed",
              color: "#8b5cf6", // violet-500
              values: [42, 263, 980],
            },
            {
              name: "HTS tests done",
              color: "#10b981", // emerald-500
              values: [27, 168, 645],
            },
          ];

          const allValues = series.flatMap((s) => s.values);
          const maxValue = Math.max(...allValues) * 1.05; // headroom

          // SVG dims
          const W = 900;
          const H = 280;
          const m = { top: 20, right: 20, bottom: 40, left: 48 };
          const innerW = W - m.left - m.right;
          const innerH = H - m.top - m.bottom;

          const groupCount = labels.length; // 3
          const seriesCount = series.length; // 3
          const groupGap = 28; // px between groups
          const barGap = 10; // px between bars within group
          const groupWidth = (innerW - groupGap * (groupCount - 1)) / groupCount;
          const barWidth = (groupWidth - barGap * (seriesCount - 1)) / seriesCount;

          const yScale = (v: number) => innerH - (v / maxValue) * innerH;

          // y-axis ticks (nice 5 steps)
          const ticks = Array.from({ length: 5 }, (_, i) => Math.round((maxValue * i) / 4));

          return (
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-black/[.02] dark:bg-white/[.03] p-4 card">
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                  <defs>
                    <linearGradient id="gridFade" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopOpacity="0.6" />
                      <stop offset="100%" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Plot area */}
                  <g transform={`translate(${m.left},${m.top})`}>
                    {/* Gridlines */}
                    {ticks.map((t) => (
                      <g key={`grid-${t}`}>
                        <line
                          x1={0}
                          x2={innerW}
                          y1={yScale(t)}
                          y2={yScale(t)}
                          stroke="url(#gridFade)"
                          strokeWidth={1}
                        />
                        <text
                          x={-8}
                          y={yScale(t)}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fontSize={12}
                          opacity={0.7}
                          fill="currentColor"
                        >
                          {t}
                        </text>
                      </g>
                    ))}

                    {/* Bars */}
                    {labels.map((label, gi) => {
                      const gx = gi * (groupWidth + groupGap);
                      return (
                        <g key={`group-${label}`} transform={`translate(${gx},0)`}>
                          {series.map((s, si) => {
                            const x = si * (barWidth + barGap);
                            const v = s.values[gi];
                            const y = yScale(v);
                            const h = innerH - y;
                            return (
                              <g key={`bar-${label}-${s.name}`}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={h}
                                  rx={6}
                                  fill={s.color}
                                  fillOpacity={0.9}
                                />
                                {/* Value label */}
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fontSize={12}
                                  fill="currentColor"
                                  opacity={0.85}
                                >
                                  {v}
                                </text>
                              </g>
                            );
                          })}
                          {/* x-axis label */}
                          <text
                            x={groupWidth / 2}
                            y={innerH + 24}
                            textAnchor="middle"
                            fontSize={13}
                            fill="currentColor"
                            opacity={0.9}
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Legend for small screens */}
              <div className="mt-4 flex sm:hidden flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-sky-500"></span> New registrations</div>
                <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-violet-500"></span> Appointments completed</div>
                <div className="flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-emerald-500"></span> HTS tests done</div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Value props */}
  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Secure & compliant",
            desc: "Role‑based access, audit trail, and encryption for client confidentiality.",
          },
          {
            title: "Real‑time documentation",
            desc: "Fast forms for HTS, PrEP, STI, mental health, and dispensing.",
          },
          {
            title: "Actionable reporting",
            desc: "Dashboards and exports aligned with donor/program requirements.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border border-black/10 dark:border-white/15 p-5 card">
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm opacity-80">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-xl border border-black/10 dark:border-white/15 p-8 text-center card">
          <h2 className="text-2xl font-semibold mb-2">Ready for a walkthrough?</h2>
          <p className="opacity-80 mb-6">We can tailor the EMR to your workflows and reporting needs.</p>
          <Link href="/contact" className="inline-flex items-center rounded-md btn-brand text-sm font-medium px-4 py-2">
            Book a meeting
          </Link>
        </div>
      </section>
    </div>
  );
}
