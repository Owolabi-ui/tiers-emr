'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FlaskConical,
  Pill,
  Package,
  PackageOpen,
  FileText,
  MessageSquare,
  Settings,
  Activity,
  Heart,
  Brain,
  ShieldCheck,
  Shield,
  ArrowLeftRight,
  Building2,
  X,
} from 'lucide-react';

// Navigation items with role-based visibility
const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Psychologist', 'ProgramAssociate'],
  },
  {
    name: 'Patients',
    href: '/dashboard/patients',
    icon: Users,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Psychologist', 'ProgramAssociate'],
  },
  {
    name: 'Programs',
    href: '/dashboard/programs',
    icon: PackageOpen,
    roles: ['Admin', 'ProgramAssociate'],
  },
  {
    name: 'Appointments',
    href: '/dashboard/appointments',
    icon: Calendar,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Psychologist', 'ProgramAssociate'],
  },
  {
    name: 'HTS',
    href: '/dashboard/hts',
    icon: Activity,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'PrEP',
    href: '/dashboard/prep',
    icon: ShieldCheck,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'PEP',
    href: '/dashboard/pep',
    icon: Shield,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'ART',
    href: '/dashboard/art',
    icon: Heart,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'Laboratory',
    href: '/dashboard/laboratory',
    icon: FlaskConical,
    roles: ['Admin', 'Doctor', 'Nurse', 'LabTech'],
  },
  {
    name: 'Lab Inventory',
    href: '/dashboard/lab-inventory',
    icon: Package,
    roles: ['Admin', 'LabTech'],
  },
  {
    name: 'Pharmacy',
    href: '/dashboard/pharmacy',
    icon: Pill,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist'],
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist'],
  },
  {
    name: 'Mental Health',
    href: '/dashboard/psychology',
    icon: Brain,
    roles: ['Admin', 'Psychologist'],
  },
  {
    name: 'Transfers',
    href: '/dashboard/transfers',
    icon: ArrowLeftRight,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'Clinics',
    href: '/dashboard/clinics',
    icon: Building2,
    roles: ['Admin', 'Doctor', 'Nurse'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Psychologist', 'ProgramAssociate'],
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    roles: ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Psychologist'],
  },
];

const adminNavigation = [
  {
    name: 'User Management',
    href: '/dashboard/users',
    icon: Users,
    roles: ['Admin'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['Admin'],
  },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  onMobileMenuToggle?: () => void;
}

export default function DashboardSidebar({ mobileOpen = false, onClose, onMobileMenuToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Filter navigation by user role - show all if user not loaded yet
  const filteredNav = user
    ? navigation.filter((item) => item.roles.includes(user.role))
    : navigation;
  const filteredAdminNav = user
    ? adminNavigation.filter((item) => item.roles.includes(user.role))
    : [];

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center justify-center px-6 border-b border-gray-200 dark:border-gray-800">
        <Image
          src="/images/TIERs-Logo-good.png"
          alt="TIERs Logo"
          width={180}
          height={180}
          className="flex-shrink-0"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#5b21b6] text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}

        {filteredAdminNav.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {filteredAdminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#5b21b6] text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-gray-800">
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white dark:bg-neutral-900 shadow-xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
