export default function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10 py-8 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm opacity-80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="opacity-80">© {new Date().getFullYear()} TIERs Clinic • EMR Mock</p>
          <div className="flex items-center gap-6">
            <a href="/features" className="hover:opacity-80">Features</a>
            <a href="/modules" className="hover:opacity-80">Modules</a>
            <a href="/demo" className="hover:opacity-80">Demo</a>
            <a href="/contact" className="hover:opacity-80">Contact</a>
          </div>
        </div>
        <div className="mt-3 text-xs opacity-70">
          <span>Built by </span>
          <a href="mailto:ezekielorogbesan@gmail.com" className="underline underline-offset-2 hover:opacity-90">
            ezekielorogbesan@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
