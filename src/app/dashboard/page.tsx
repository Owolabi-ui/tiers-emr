'use client';

import { useAuthStore, getRoleDisplayName } from '@/lib/auth-store';
import {
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Mock stats - will be replaced with real API data
const stats = [
  {
    name: 'Total Patients',
    value: '2,847',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    name: 'Today\'s Appointments',
    value: '24',
    change: '8 pending',
    changeType: 'neutral' as const,
    icon: Calendar,
  },
  {
    name: 'Active on ART',
    value: '1,432',
    change: '+5.2%',
    changeType: 'positive' as const,
    icon: Activity,
  },
  {
    name: 'Pending Lab Results',
    value: '18',
    change: '3 critical',
    changeType: 'warning' as const,
    icon: AlertTriangle,
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'appointment',
    message: 'New appointment scheduled for John Doe',
    time: '5 min ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'lab',
    message: 'Lab results ready for patient TI-0023',
    time: '12 min ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'patient',
    message: 'New patient registered: Jane Smith',
    time: '25 min ago',
    status: 'success',
  },
  {
    id: 4,
    type: 'alert',
    message: 'Stock alert: Tenofovir running low',
    time: '1 hour ago',
    status: 'warning',
  },
  {
    id: 5,
    type: 'appointment',
    message: 'Missed appointment: Patient TI-0089',
    time: '2 hours ago',
    status: 'error',
  },
];

const upcomingAppointments = [
  { id: 1, patient: 'Adeola Adebayo', time: '09:00 AM', type: 'Follow-up', status: 'confirmed' },
  { id: 2, patient: 'Tunde Adeyemi', time: '09:30 AM', type: 'Lab Review', status: 'confirmed' },
  { id: 3, patient: 'Ngozi Okeke', time: '10:00 AM', type: 'New Patient', status: 'pending' },
  { id: 4, patient: 'Ibrahim Musa', time: '10:30 AM', type: 'ART Refill', status: 'confirmed' },
  { id: 5, patient: 'Fatima Bello', time: '11:00 AM', type: 'Counseling', status: 'pending' },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {getRoleDisplayName(user?.role || '')} &bull; Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-[#5b21b6]/10">
                <stat.icon className="h-5 w-5 text-[#5b21b6]" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive'
                    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                    : stat.changeType === 'warning'
                    ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'
                    : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-5 py-4 flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full ${
                    activity.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : activity.status === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : activity.status === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}
                >
                  {activity.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : activity.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : activity.status === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800">
            <button className="text-sm text-[#5b21b6] hover:underline font-medium">
              View all activity &rarr;
            </button>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Today&apos;s Appointments
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {appt.patient}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      appt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{appt.time}</span>
                  <span>&bull;</span>
                  <span>{appt.type}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800">
            <button className="text-sm text-[#5b21b6] hover:underline font-medium">
              View all appointments &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
