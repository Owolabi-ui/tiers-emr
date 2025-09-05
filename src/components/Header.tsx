"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/modules", label: "Modules" },
  { href: "/demo", label: "Demo" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/TIERs-Logo-good.png"
            alt="TIERs Clinic Logo"
            width={36}
            height={36}
            priority
          />
          <span className="font-semibold tracking-tight">TIERs EMR</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:opacity-80 transition-opacity ${
                pathname === item.href ? "font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center rounded-md bg-foreground text-background text-sm font-medium px-3 py-2 hover:opacity-90"
          >
            Book a call
          </Link>
          <button
            className="md:hidden inline-flex items-center justify-center size-9 rounded-md border border-black/10 dark:border-white/20 transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block w-5 h-3.5">
              <span
                className={`absolute left-0 right-0 h-0.5 bg-current transition-transform duration-200 ${open ? "translate-y-1.5 rotate-45" : "-translate-y-1.5"}`}
              />
              <span
                className={`absolute left-0 right-0 h-0.5 bg-current transition-opacity duration-150 ${open ? "opacity-0" : "opacity-100"}`}
                style={{ top: "7px" }}
              />
              <span
                className={`absolute left-0 right-0 h-0.5 bg-current transition-transform duration-200 ${open ? "-translate-y-1.5 -rotate-45" : "translate-y-1.5"}`}
                style={{ bottom: 0 }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden relative animate-fade-in">
          {/* overlay */}
          <button
            className="fixed inset-0 bg-black/20" aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 mt-0 bg-background border-b border-black/10 dark:border-white/10 shadow-sm">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 grid gap-2 text-sm animate-fade-up">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 ${
                    pathname === item.href ? "font-semibold" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-1 inline-flex items-center justify-center rounded-md bg-foreground text-background text-sm font-medium px-3 py-2 hover:opacity-90"
                onClick={() => setOpen(false)}
              >
                Book a call
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
