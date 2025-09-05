export default function ModulesPage() {
  const modules = [
    {
      title: "HTS (HIV Testing Services)",
      desc: "Client intake, testing outcomes, risk assessment, and referrals.",
    },
    { title: "PrEP", desc: "Eligibility, initiation, follow-up, and adherence tracking." },
    { title: "STI Management", desc: "Syndromic management, labs, treatment, and follow-up." },
    { title: "Mental Health", desc: "Screening tools, care plans, counselling notes, and referrals." },
    { title: "Dispensing", desc: "Medication inventory, dispensing logs, and regimen history." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Clinical Modules</h1>

      {/* Overall module KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ label: "Active clients", value: 1296 }, { label: "Encounters (30d)", value: 3158 }, { label: "Teleconsults (30d)", value: 151 }, { label: "Dispenses (30d)", value: 1226 }].map((k) => (
          <div key={k.label} className="rounded-lg border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-sm opacity-70">{k.label}</p>
            <p className="text-2xl font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((m) => (
          <div key={m.title} className="rounded-lg border border-black/10 dark:border-white/15 p-5 card">
            <h3 className="font-semibold mb-1">{m.title}</h3>
            <p className="text-sm opacity-80 mb-4">{m.desc}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-black/10 dark:border-white/15 p-3">
                <p className="opacity-70">Today</p>
                <p className="font-semibold mt-1">{Math.floor(5 + Math.random() * 60)}</p>
              </div>
              <div className="rounded-md border border-black/10 dark:border-white/15 p-3">
                <p className="opacity-70">This week</p>
                <p className="font-semibold mt-1">{Math.floor(50 + Math.random() * 300)}</p>
              </div>
              <div className="rounded-md border border-black/10 dark:border-white/15 p-3">
                <p className="opacity-70">This month</p>
                <p className="font-semibold mt-1">{Math.floor(200 + Math.random() * 1200)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
