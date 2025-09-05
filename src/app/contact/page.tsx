export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Book a meeting</h1>
      <p className="opacity-80 mb-6">Share a few details and we’ll schedule a follow-up to discuss scope and costs.</p>

      {/* Mock inquiry stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[{ label: "Avg response time", value: "2h 14m" }, { label: "Meetings booked (7d)", value: 12 }, { label: "Conversion rate", value: "38%" }].map((k) => (
          <div key={k.label} className="rounded-lg border border-black/10 dark:border-white/15 p-4 card">
            <p className="text-sm opacity-70">{k.label}</p>
            <p className="text-2xl font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
          <input id="name" className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="org">Organization</label>
          <input id="org" className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2" placeholder="TIERs Clinic" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2" placeholder="you@domain.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
            <input id="phone" className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2" placeholder="+234…" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="message">Message</label>
          <textarea id="message" rows={4} className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2" placeholder="Tell us about your needs (modules, reporting, timelines)…" />
        </div>
        <button type="button" className="inline-flex items-center rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90">
          Submit inquiry (mock)
        </button>
      </form>

      {/* Prepared by */}
      <div className="mt-10 rounded-lg border border-black/10 dark:border-white/15 p-4">
        <p className="text-sm opacity-70">Prepared by</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Developer</span>
          <span>•</span>
          <a className="underline underline-offset-2" href="mailto:ezekielorogbesan@gmail.com">ezekielorogbesan@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
