'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, getRoleDisplayName } from '@/lib/auth-store';
import {
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  UserPlus,
  Pill,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi, DashboardStats, PatientTrendData, AppointmentStats, ServiceDistribution, RecentActivity, UpcomingAppointment } from '@/lib/dashboard';

const COLORS = ['#10b981', '#f97316', '#ef4444', '#eab308', '#3b82f6', '#8b5cf6'];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patientTrends, setPatientTrends] = useState<PatientTrendData[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendsData, apptStats, serviceData, activityData, appointmentsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getPatientTrends(6),
        dashboardApi.getAppointmentStats(30),
        dashboardApi.getServiceDistribution(),
        dashboardApi.getRecentActivity(10),
        dashboardApi.getTodayAppointments(),
      ]);

      setStats(statsData);
      setPatientTrends(trendsData);
      setAppointmentStats(apptStats);
      setServiceDistribution(serviceData);
      setRecentActivity(activityData);
      setTodayAppointments(appointmentsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#5b21b6] border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Patients',
      value: stats?.totalPatients?.toLocaleString() || '0',
      change: `+${stats?.newPatientsThisMonth || 0} this month`,
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      name: 'Active on ART',
      value: stats?.activeART?.toLocaleString() || '0',
      change: `${stats?.activeART && stats?.totalPatients ? Math.round((stats.activeART / stats.totalPatients) * 100) : 0}% of patients`,
      changeType: 'neutral' as const,
      icon: Activity,
    },
    {
      name: 'Active on PrEP',
      value: stats?.activePrEP?.toLocaleString() || '0',
      change: `${stats?.activePrEP && stats?.totalPatients ? Math.round((stats.activePrEP / stats.totalPatients) * 100) : 0}% of patients`,
      changeType: 'neutral' as const,
      icon: Pill,
    },
    {
      name: "Today's Appointments",
      value: stats?.todayAppointments?.toString() || '0',
      change: `${Array.isArray(todayAppointments) ? todayAppointments.filter(a => a.status === 'Confirmed').length : 0} confirmed`,
      changeType: 'neutral' as const,
      icon: Calendar,
    },
    {
      name: 'Pending Lab Results',
      value: stats?.pendingLabResults?.toString() || '0',
      change: 'Awaiting review',
      changeType: stats?.pendingLabResults && stats.pendingLabResults > 10 ? 'warning' as const : 'neutral' as const,
      icon: FileText,
    },
    {
      name: 'Missed This Week',
      value: stats?.missedAppointmentsThisWeek?.toString() || '0',
      change: 'Appointments',
      changeType: stats?.missedAppointmentsThisWeek && stats.missedAppointmentsThisWeek > 5 ? 'warning' as const : 'neutral' as const,
      icon: AlertTriangle,
    },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[#5b21b6]/10">
                <stat.icon className="h-5 w-5 text-[#5b21b6]" />
              </div>
              {stat.changeType === 'positive' && (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              )}
              {stat.changeType === 'warning' && (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {stat.name}
            </p>
            <p className={`text-xs ${
              stat.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : stat.changeType === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Trends */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Patient Enrollment Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={patientTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Total Patients"
              />
              <Area
                type="monotone"
                dataKey="art"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="ART Patients"
              />
              <Area
                type="monotone"
                dataKey="prep"
                stackId="3"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.6}
                name="PrEP Patients"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Statistics */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appointment Statistics (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
              <Bar dataKey="missed" fill="#ef4444" name="Missed" />
              <Bar dataKey="cancelled" fill="#6b7280" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Charts Row 2 */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Distribution */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Service Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDistribution as any}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry: any) => `${entry.service}: ${entry.percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {Array.isArray(serviceDistribution) && serviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {Array.isArray(serviceDistribution) && serviceDistribution.map((service, index) => (
              <div key={service.service} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{service.service}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {service.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[370px] overflow-y-auto">
            {(!Array.isArray(recentActivity) || recentActivity.length === 0) ? (
              <div className="px-6 py-8 text-center">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No recent activity in the last 24 hours
                </p>
              </div>
            ) : recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Today's Appointments */}
      {!loading && (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today&apos;s Appointments
          </h3>
          <a
            href="/dashboard/appointments"
            className="text-sm text-[#5b21b6] hover:underline font-medium"
          >
            View all &rarr;
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {!Array.isArray(todayAppointments) || todayAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No appointments scheduled for today
                  </td>
                </tr>
              ) : (
                todayAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {appt.patient_name}
                      </div>
                      <div className="text-xs text-gray-500">{appt.patient_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {new Date(appt.appointment_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {appt.appointment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appt.status === 'Confirmed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : appt.status === 'Checked-in'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {appt.assigned_to || 'Unassigned'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
