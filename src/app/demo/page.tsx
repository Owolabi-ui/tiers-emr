export default function DemoPage() {
  const screens = [
    { title: "Patient Summary", note: "Demographics, alerts, recent encounters" },
    { title: "Appointment Queue", note: "Check-in, triage, provider assignment" },
    { title: "Encounter Form", note: "HTS/PrEP/STI/MH templates with autosave" },
    { title: "Dispensing", note: "Medication search, dispense, and inventory" },
    { title: "Reporting", note: "Indicators, cohorts, and export" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Demo Screens</h1>

      {/* Quick metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ label: "Today’s visits", value: 58 }, { label: "In queue", value: 14 }, { label: "Avg wait", value: "11m" }, { label: "Encounters (7d)", value: 986 }].map((k) => (
          <div key={k.label} className="rounded-lg border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-sm opacity-70">{k.label}</p>
            <p className="text-2xl font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.map((s) => (
          <div key={s.title} className="rounded-xl border border-black/10 dark:border-white/15 p-4 card">
            <div className="aspect-video rounded-md bg-black/[.03] dark:bg-white/[.06] grid place-items-center text-center p-4">
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs opacity-80 mt-1">{s.note}</p>
              </div>
            </div>
            {/* Example data row */}
            <div className="mt-3 text-sm">
              {s.title === "Appointment Queue" ? (
                <div className="rounded-md border border-black/10 dark:border-white/15 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/[.04] dark:bg-white/[.06]">
                      <tr>
                        <th className="px-3 py-2">Ticket</th>
                        <th className="px-3 py-2">Initials</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Wait</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { t: "Q-1042", n: "J.K.", r: "Follow-up", w: "07m" },
                        { t: "Q-1043", n: "L.M.", r: "PrEP refill", w: "12m" },
                        { t: "Q-1044", n: "S.O.", r: "HTS screening", w: "05m" },
                      ].map((r) => (
                        <tr key={r.t} className="border-t border-black/5 dark:border-white/10">
                          <td className="px-3 py-2 font-mono">{r.t}</td>
                          <td className="px-3 py-2">{r.n}</td>
                          <td className="px-3 py-2">{r.r}</td>
                          <td className="px-3 py-2">{r.w}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : s.title === "Patient Summary" ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { k: "Alerts", v: 2 },
                    { k: "Encounters (90d)", v: 4 },
                    { k: "Medications", v: 3 },
                    { k: "Allergies", v: 0 },
                  ].map((r) => (
                    <div key={r.k} className="rounded-md border border-black/10 dark:border-white/15 p-3">
                      <p className="opacity-70">{r.k}</p>
                      <p className="font-semibold mt-1">{r.v}</p>
                    </div>
                  ))}
                </div>
              ) : s.title === "Reporting" ? (
                <div className="rounded-md border border-black/10 dark:border-white/15 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/[.04] dark:bg-white/[.06]">
                      <tr>
                        <th className="px-3 py-2">Indicator</th>
                        <th className="px-3 py-2">This month</th>
                        <th className="px-3 py-2">Target</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { i: "HTS completed", m: 645, t: 700 },
                        { i: "PrEP initiations", m: 124, t: 150 },
                        { i: "STI cases managed", m: 198, t: 210 },
                      ].map((r) => (
                        <tr key={r.i} className="border-t border-black/5 dark:border-white/10">
                          <td className="px-3 py-2">{r.i}</td>
                          <td className="px-3 py-2">{r.m}</td>
                          <td className="px-3 py-2">{r.t}</td>
                          <td className="px-3 py-2">{r.m >= r.t ? "On track" : "Behind"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
