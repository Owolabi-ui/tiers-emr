"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Inline icon set (no external dependency)
function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case "patients":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4h-3" />
          <circle cx="10" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4" />
        </svg>
      );
    case "clinics":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </svg>
      );
    case "messages":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M21 15a4 4 0 0 1-4 4H8l-4 4V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
          <path d="M8 9h8M8 13h6" />
        </svg>
      );
    case "appointments":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "pending":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case "pharmacy":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M9 3h6" />
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M10 14h4M8 18h8" />
        </svg>
      );
    case "transfers":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M7 7h11l-3-3" />
          <path d="M17 17H6l3 3" />
        </svg>
      );
    case "inventory":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.3 7L12 12l8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "monitoring":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M3 3v18h18" />
          <polyline points="7 13 10 9 13 14 17 8" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M3 3v18h18" />
          <rect x="7" y="10" width="3" height="7" />
          <rect x="12" y="7" width="3" height="10" />
          <rect x="17" y="12" width="3" height="5" />
        </svg>
      );
    case "laboratory":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M6 3h12" />
          <path d="M8 3v5l-4.5 7.5A4 4 0 0 0 7 21h10a4 4 0 0 0 3.5-5.5L16 8V3" />
          <path d="M8 8h8" />
        </svg>
      );
    case "vitals":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <polyline points="3 12 7 12 10 3 14 21 17 12 21 12" />
        </svg>
      );
    case "opc":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <circle cx="12" cy="6" r="3" />
          <path d="M12 9v4m-4 7h8m-5-7h2a4 4 0 0 1 4 4v3H7v-3a4 4 0 0 1 4-4Z" />
        </svg>
      );
    case "hiv":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M12 21s-6-4.35-6-9a6 6 0 1 1 12 0c0 4.65-6 9-6 9z" />
        </svg>
      );
    case "inpatient":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <rect x="3" y="12" width="18" height="6" rx="2" />
          <rect x="4" y="9" width="6" height="3" rx="1" />
        </svg>
      );
    case "missed":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "all":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="4" cy="12" r="1" />
          <circle cx="4" cy="18" r="1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
  }
}

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinicsOpen, setClinicsOpen] = useState(false);
  const [apptsOpen, setApptsOpen] = useState(false);
  const [labsOpen, setLabsOpen] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickFx, setQuickFx] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const closeSidebar = () => setSidebarOpen(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (messagesOpen && messagesRef.current && !messagesRef.current.contains(e.target as Node)) setMessagesOpen(false);
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    if (profileOpen || messagesOpen || notificationsOpen) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [profileOpen, messagesOpen, notificationsOpen]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      setHideOnScroll(goingDown && y > 10);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm transition-transform duration-200 ${
          hideOnScroll ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/TIERs-Logo-good.png"
              alt="TIERs Clinic Logo"
              width={400}
              height={400}
              priority
            />
          </Link>

          <div className="flex items-center gap-2">

            {/* Messages icon with dropdown */}
            <div className="relative" ref={messagesRef}>
              <button
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[#5b21b6]/10 transition group"
                title="Messages"
                aria-haspopup="menu"
                aria-expanded={messagesOpen}
                onClick={() => setMessagesOpen((v) => !v)}
              >
                <Icon name="messages" className="h-5 w-5 text-[#5b21b6]" />
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#5b21b6] text-white text-xs font-bold shadow">4</span>
              </button>
              {messagesOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-black/10 bg-white shadow-lg animate-fade-up z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs text-gray-500 font-semibold">Recent Messages</div>
                  <ul className="divide-y divide-black/10">
                    <li className="px-4 py-2 hover:bg-[#5b21b6]/10 cursor-pointer">
                      <div className="font-medium text-sm">Lab Results Ready</div>
                      <div className="text-xs text-gray-500">View the latest lab results for patient John Doe.</div>
                    </li>
                    <li className="px-4 py-2 hover:bg-[#5b21b6]/10 cursor-pointer">
                      <div className="font-medium text-sm">New Appointment Request</div>
                      <div className="text-xs text-gray-500">A new appointment has been requested.</div>
                    </li>
                    <li className="px-4 py-2 hover:bg-[#5b21b6]/10 cursor-pointer">
                      <div className="font-medium text-sm">Message from Admin</div>
                      <div className="text-xs text-gray-500">Please review the updated protocols.</div>
                    </li>
                  </ul>
                  <Link href="/messages" className="block text-center text-[#5b21b6] font-semibold py-2 hover:underline">View all messages</Link>
                </div>
              )}
            </div>

            {/* Notifications icon with dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[#5b21b6]/10 transition group"
                title="Notifications"
                aria-haspopup="menu"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                <svg className="h-5 w-5 text-[#5b21b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#5b21b6] text-white text-xs font-bold shadow">2</span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-black/10 bg-white shadow-lg animate-fade-up z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs text-gray-500 font-semibold">Notifications</div>
                  <ul className="divide-y divide-black/10">
                    <li className="px-4 py-2 hover:bg-[#5b21b6]/10 cursor-pointer">
                      <div className="font-medium text-sm">2 Missed Appointments</div>
                      <div className="text-xs text-gray-500">You have 2 missed appointments to review.</div>
                    </li>
                    <li className="px-4 py-2 hover:bg-[#5b21b6]/10 cursor-pointer">
                      <div className="font-medium text-sm">Inventory Low</div>
                      <div className="text-xs text-gray-500">Some drugs are running low in inventory.</div>
                    </li>
                  </ul>
                  <Link href="/pending" className="block text-center text-[#5b21b6] font-semibold py-2 hover:underline">View all notifications</Link>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                className="inline-flex items-center gap-2 h-9 rounded-md px-2 hover:bg-[#5b21b6]/10 transition focus:outline-none"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#5b21b6] text-white font-bold text-base">A</span>
                <span className="hidden sm:inline text-sm font-medium text-[#5b21b6]">Admin</span>
                <svg className={`h-4 w-4 text-[#5b21b6] transition-transform ${profileOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0l-4.25-4.65a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-black/10 bg-white shadow-lg animate-fade-up z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs text-gray-500">Signed in as <span className="font-semibold text-[#5b21b6]">admin</span></div>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#5b21b6]/10 transition">Profile</button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#5b21b6]/10 transition">Settings</button>
                  <div className="border-t border-black/10 my-1" />
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#5b21b6]/10 transition">Login</button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#5b21b6]/10 transition">Logout</button>
                </div>
              )}
            </div>
            <Link
              href="/#dashboard"
              className="hidden md:inline-flex items-center rounded-md bg-[#5b21b6] text-white text-sm font-medium px-3 py-2 hover:opacity-90"
            >
              Dashboard
            </Link>
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center rounded-md bg-[#5b21b6] text-white text-sm font-medium px-3 py-2 hover:opacity-90"
            >
              Book a call
            </Link>

            <button
              className="relative overflow-hidden inline-flex items-center justify-center h-9 w-9 rounded-md bg-[#5b21b6] text-white hover:opacity-90 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/40 focus:ring-offset-2 focus:ring-offset-white"
              onClick={() => {
                setQuickFx(true);
                setSidebarOpen((v) => !v);
                window.setTimeout(() => setQuickFx(false), 200);
              }}
              aria-controls="right-sidebar"
              aria-label={sidebarOpen ? "Close panel" : "Open panel"}
              title={sidebarOpen ? "Close panel" : "Open panel"}
            >
              <span className={`absolute inset-0 rounded-md bg-white/25 transition-opacity duration-200 pointer-events-none ${quickFx ? "opacity-100" : "opacity-0"}`} />
              {sidebarOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40">
          {/* Overlay */}
          <button
            className="absolute inset-0 bg-black/0 transition-colors duration-200"
            aria-label="Close panel"
            onClick={closeSidebar}
          />

          {/* Panel */}
          <aside
            id="right-sidebar"
            aria-modal="true"
            className="absolute top-0 right-0 h-full w-80 sm:w-96 flex flex-col bg-gradient-to-b from-white/80 to-white/60 text-gray-900 dark:from-black/40 dark:to-black/20 dark:text-white backdrop-blur-xl border-l border-black/10 dark:border-white/10"
          >
            <div className="h-16 px-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Quick Panel</h2>
              <button
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-black/10 hover:bg-black/5"
                aria-label="Close panel"
                onClick={closeSidebar}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <nav aria-label="Quick panel navigation" className="text-base">
                <ul className="px-1 py-1 space-y-1.5">
                  <li>
                    <Link href="/patients" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="patients" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Patients</span>
                    </Link>
                  </li>

                  {/* Clinics (collapsible) */}
                  <li>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      onClick={() => setClinicsOpen((v) => !v)}
                      aria-expanded={clinicsOpen}
                      aria-controls="clinics-submenu"
                    >
                      <svg
                        className={`size-4 transition-transform ${clinicsOpen ? "rotate-90" : "rotate-0"}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <Icon name="clinics" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Clinics</span>
                    </button>
                    {clinicsOpen && (
                      <ul id="clinics-submenu" className="mt-1 ml-7 space-y-1">
                        <li>
                          <Link href="/clinics/opd" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="opc" className="h-4.5 w-4.5 opacity-80" />
                            <span>Out-Patient Clinic</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/clinics/hiv" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="hiv" className="h-4.5 w-4.5 opacity-80" />
                            <span>HIV Clinic</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  <li>
                    <Link href="/messages" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="messages" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Messages</span>
                    </Link>
                  </li>

                  {/* Appointments (collapsible) */}
                  <li>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      onClick={() => setApptsOpen((v) => !v)}
                      aria-expanded={apptsOpen}
                      aria-controls="appointments-submenu"
                    >
                      <svg
                        className={`size-4 transition-transform ${apptsOpen ? "rotate-90" : "rotate-0"}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <Icon name="appointments" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Appointments</span>
                    </button>
                    {apptsOpen && (
                      <ul id="appointments-submenu" className="mt-1 ml-7 space-y-1">
                        <li>
                          <Link href="/appointments/missed" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="missed" className="h-4.5 w-4.5 opacity-80" />
                            <span>Missed</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/appointments/all" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="all" className="h-4.5 w-4.5 opacity-80" />
                            <span>All Appointments</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* Laboratory (collapsible) */}
                  <li>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      onClick={() => setLabsOpen((v) => !v)}
                      aria-expanded={labsOpen}
                      aria-controls="laboratory-submenu"
                    >
                      <svg
                        className={`size-4 transition-transform ${labsOpen ? "rotate-90" : "rotate-0"}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <Icon name="laboratory" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Laboratory</span>
                    </button>
                    {labsOpen && (
                      <ul id="laboratory-submenu" className="mt-1 ml-7 space-y-1">
                        <li>
                          <Link href="/laboratory/pending" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="pending" className="h-4.5 w-4.5 opacity-80" />
                            <span>Pending</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/laboratory/awaiting" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="appointments" className="h-4.5 w-4.5 opacity-80" />
                            <span>Awaiting</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/laboratory/all" onClick={closeSidebar} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <Icon name="all" className="h-4.5 w-4.5 opacity-80" />
                            <span>All Requests</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  <li>
                    <Link href="/pending" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="pending" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Pending Visits</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/pharmacy" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="pharmacy" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Pharmacy</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/transfers" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="transfers" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Transfers</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/inventory" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="inventory" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Inventory</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/vitals" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="vitals" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Vital Signs</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/monitoring" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="monitoring" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Monitoring</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/reports" onClick={closeSidebar} className="flex items-center gap-2 px-4 py-3 rounded hover:bg-black/10 dark:hover:bg-white/10">
                      <Icon name="reports" className="h-5 w-5 opacity-80" />
                      <span className="font-medium">Reports</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default Header;
