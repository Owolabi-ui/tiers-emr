import React from "react";

type Series = { male: number[]; female: number[]; labels: string[] };

function GroupedBars({ data }: { data: Series }) {
  const W = 760;
  const H = 340;
  const m = { top: 20, right: 16, bottom: 120, left: 44 };
  const innerW = W - m.left - m.right;
  const innerH = H - m.top - m.bottom;

  const maxTick = 150; // fixed per spec
  const ticks = [0, 25, 50, 75, 100, 125, 150];

  const groupCount = data.labels.length;
  const barGap = 10; // gap between bars within a group
  const groupGap = 28; // gap between groups
  const groupWidth = (innerW - groupGap * (groupCount - 1)) / groupCount;
  const barWidth = (groupWidth - barGap) / 2; // two bars (male, female)
  const yScale = (v: number) => innerH - (v / maxTick) * innerH;

  // naive word-wrap: split words into lines capped by characters per line
  const wrapLabel = (label: string, maxChars = 16) => {
    const words = label.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const trial = current ? `${current} ${w}` : w;
      if (trial.length > maxChars && current) {
        lines.push(current);
        current = w;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  return (
  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-black dark:text-white">
      {/* plot area */}
      <g transform={`translate(${m.left},${m.top})`}>
        {/* grid + ticks */}
        {ticks.map((t) => (
          <g key={`t-${t}`}>
            <line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke="currentColor" opacity={0.15} />
            <text x={-8} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} opacity={0.7}>
              {t}
            </text>
          </g>
        ))}

        {/* bars */}
        {data.labels.map((label, gi) => {
          const gx = gi * (groupWidth + groupGap);
          const male = data.male[gi] ?? 0;
          const female = data.female[gi] ?? 0;
          const maleX = 0;
          const femaleX = barWidth + barGap;
          const maleY = yScale(male);
          const femaleY = yScale(female);
          const maleH = innerH - maleY;
          const femaleH = innerH - femaleY;
          return (
            <g key={`g-${label}`} transform={`translate(${gx},0)`}>
              <rect x={maleX} y={maleY} width={barWidth} height={maleH} rx={6} fill="#2563eb" opacity={0.9} />
              <rect x={femaleX} y={femaleY} width={barWidth} height={femaleH} rx={6} fill="#ec4899" opacity={0.9} />
              {/* rotated 45°, larger, lowercase label with wrapping */}
              <text
                transform={`translate(${groupWidth / 2}, ${innerH + 14}) rotate(45)`}
                textAnchor="start"
                fontSize={11}
                className="fill-current opacity-90"
              >
                {wrapLabel(label.toLowerCase()).map((ln, i) => (
                  <tspan key={i} x={0} dy={i === 0 ? 0 : 12}>
                    {ln}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>

    </svg>
  );
}

export default function HtsSection() {
  const series: Series = {
    labels: [
      "OPD",
      "VCT",
      "STI",
      "FACILITY INDEX TESTING - NEW CLIENTS",
      "COMMUNITY SOCIAL NETWORK",
    ],
    male: [60, 35, 20, 28, 32],
    female: [70, 40, 26, 30, 36],
  };

  const totalTested = series.male.reduce((a, b) => a + b, 0) + series.female.reduce((a, b) => a + b, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">HIV Testing Services</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left stacked cards */}
        <div className="space-y-4 md:sticky md:top-20">
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-xs uppercase tracking-wide opacity-70">Total Tested</p>
            <p className="mt-1 text-3xl font-bold">{totalTested}</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-xs uppercase tracking-wide opacity-70">Tested Positive</p>
            <p className="mt-1 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-xs uppercase tracking-wide opacity-70">Tested Negative</p>
            <p className="mt-1 text-3xl font-bold">0</p>
          </div>
        </div>

        {/* Right chart */}
        <div className="md:col-span-2 rounded-xl border border-black/10 dark:border-white/15 p-4 card overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Number of clients by service and sex</p>
            <span className="text-xs opacity-70">0–150 scale (25 step)</span>
          </div>
          <div className="min-w-[700px]">
            <GroupedBars data={series} />
          </div>
          {/* legend below chart */}
          <div className="mt-3 flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#2563eb' }} />
              <span>Male</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: '#ec4899' }} />
              <span>Female</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
