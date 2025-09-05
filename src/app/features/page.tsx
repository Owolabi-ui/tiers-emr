import Link from "next/link";

export default function FeaturesPage() {
  const items = [
    {
      title: "Secure client data",
      desc: "Role-based access control, audit logs, and field-level validations.",
    },
    {
      title: "Appointments & follow-up",
      desc: "Booking, reminders, queue management, and follow-up workflows.",
    },
    {
      title: "Real-time documentation",
      desc: "Fast encounter forms with autosave and offline-friendly patterns.",
    },
    {
      title: "Reporting & dashboards",
      desc: "Program/donor-aligned indicators with exports, filters, and cohorts.",
    },
    {
      title: "Teleconsultation",
      desc: "Adaptable for integration with digital health apps and virtual visits.",
    },
  ];

  const mockClients = [
    { id: "CLN-10284", initials: "A.J.", age: 27, sex: "F", status: "Active", last: "2025-09-03" },
    { id: "CLN-09871", initials: "K.T.", age: 34, sex: "M", status: "Active", last: "2025-09-02" },
    { id: "CLN-11021", initials: "M.S.", age: 19, sex: "F", status: "Follow-up", last: "2025-09-01" },
    { id: "CLN-10155", initials: "D.O.", age: 42, sex: "M", status: "Completed", last: "2025-08-30" },
    { id: "CLN-10093", initials: "R.N.", age: 29, sex: "F", status: "Active", last: "2025-08-29" },
    { id: "CLN-09967", initials: "S.B.", age: 31, sex: "M", status: "Active", last: "2025-08-28" },
  ];

  const kpis = [
    { label: "Total clients", value: 4820 },
    { label: "Encrypted records", value: "100%" },
    { label: "Avg save time", value: "0.9s" },
    { label: "System uptime", value: "99.98%" },
  ];

  const security = [
    { metric: "Audit logs (7d)", value: 1204 },
    { metric: "Failed logins (7d)", value: 7 },
    { metric: "Access requests (7d)", value: 3 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Features</h1>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-sm opacity-70">{k.label}</p>
            <p className="text-2xl font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {items.map((i) => (
          <div key={i.title} className="rounded-lg border border-black/10 dark:border-white/15 p-5 card">
            <h3 className="font-semibold mb-1">{i.title}</h3>
            <p className="text-sm opacity-80">{i.desc}</p>
          </div>
        ))}
      </div>

      {/* Mock client data */}
      <div className="rounded-xl border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h2 className="font-semibold">Mock client data (anonymized)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[.04] dark:bg-white/[.06]">
              <tr>
                <th className="px-3 py-2">Client ID</th>
                <th className="px-3 py-2">Initials</th>
                <th className="px-3 py-2">Age</th>
                <th className="px-3 py-2">Sex</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {mockClients.map((c) => (
                <tr key={c.id} className="border-t border-black/5 dark:border-white/10">
                  <td className="px-3 py-2 font-mono text-sm">{c.id}</td>
                  <td className="px-3 py-2">{c.initials}</td>
                  <td className="px-3 py-2">{c.age}</td>
                  <td className="px-3 py-2">{c.sex}</td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security metrics */}
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {security.map((s) => (
          <div key={s.metric} className="rounded-lg border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-sm opacity-70">{s.metric}</p>
            <p className="text-xl font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/demo" className="inline-flex items-center rounded-md btn-brand text-sm font-medium px-4 py-2">
          See demo screens
        </Link>
      </div>
    </div>
  );
}
