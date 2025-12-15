'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  appointmentsApi,
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  statusColors,
  appointmentTypeColors,
  appointmentStatusOptions,
  formatTime,
  formatAppointmentDate,
  isAppointmentToday,
  getAppointmentDateLabel,
} from '@/lib/appointments';
import { patientsApi, Patient, getPatientFullName } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  CalendarDays,
  UserCheck,
  CalendarX,
  CalendarClock,
} from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    checkedIn: 0,
    completed: 0,
  });

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await appointmentsApi.getByDate(selectedDate);
      let filteredAppointments = response.appointments;

      // Apply status filter client-side
      if (statusFilter) {
        filteredAppointments = filteredAppointments.filter(
          (apt) => apt.status === statusFilter
        );
      }

      // Sort by time
      filteredAppointments.sort((a, b) => {
        if (!a.appointment_time && !b.appointment_time) return 0;
        if (!a.appointment_time) return 1;
        if (!b.appointment_time) return -1;
        return a.appointment_time.localeCompare(b.appointment_time);
      });

      setAppointments(filteredAppointments);

      // Calculate stats from all appointments (unfiltered)
      setStats({
        total: response.appointments.length,
        scheduled: response.appointments.filter(
          (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
        ).length,
        checkedIn: response.appointments.filter(
          (a) => a.status === 'Checked-in' || a.status === 'In Progress'
        ).length,
        completed: response.appointments.filter((a) => a.status === 'Completed').length,
      });

      // Fetch patient names
      if (filteredAppointments.length > 0) {
        setLoadingPatients(true);
        const namesMap: Record<string, string> = {};
        const uniquePatientIds = [...new Set(filteredAppointments.map((a) => a.patient_id))];

        await Promise.all(
          uniquePatientIds.map(async (patientId) => {
            try {
              const patient = await patientsApi.getById(patientId);
              namesMap[patientId] = getPatientFullName(patient);
            } catch {
              namesMap[patientId] = 'Unknown Patient';
            }
          })
        );

        setPatientNames(namesMap);
        setLoadingPatients(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleQuickAction = async (
    appointmentId: string,
    action: 'check-in' | 'start' | 'complete' | 'no-show'
  ) => {
    try {
      switch (action) {
        case 'check-in':
          await appointmentsApi.checkIn(appointmentId);
          break;
        case 'start':
          await appointmentsApi.start(appointmentId);
          break;
        case 'no-show':
          await appointmentsApi.markNoShow(appointmentId);
          break;
      }
      fetchAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
      case 'Confirmed':
        return <Clock className="h-4 w-4" />;
      case 'Checked-in':
        return <UserCheck className="h-4 w-4" />;
      case 'In Progress':
        return <Play className="h-4 w-4" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'No Show':
        return <CalendarX className="h-4 w-4" />;
      case 'Rescheduled':
        return <CalendarClock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5b21b6]">Appointments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage patient appointments and schedule visits
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5b21b6] px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-[#4c1d95] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5b21b6]/10">
              <CalendarDays className="h-5 w-5 text-[#5b21b6]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Today</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduled}</p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <UserCheck className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.checkedIn}</p>
              <p className="text-sm text-gray-500">Checked In</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector and Filters */}
      <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isAppointmentToday(selectedDate) && (
              <button
                onClick={goToToday}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#5b21b6] hover:bg-[#5b21b6]/10 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {getAppointmentDateLabel(selectedDate)}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {formatAppointmentDate(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || statusFilter
                  ? 'border-[#5b21b6] text-[#5b21b6] bg-[#5b21b6]/10'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button
              type="button"
              onClick={() => fetchAppointments()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  <option value="">All Statuses</option>
                  {appointmentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {statusFilter && (
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className="mt-3 text-sm text-[#5b21b6] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error loading appointments
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15 bg-purple-100 dark:bg-[#5b21b6]/10 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#5b21b6] text-white">
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Appt No.</th>
              <th className="px-4 py-3 text-left font-medium">Patient</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Service</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <CalendarDays className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No appointments for this date</p>
                  <Link
                    href="/dashboard/appointments/new"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule an appointment
                  </Link>
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-t border-black/5 dark:border-white/10 hover:bg-purple-50/50 dark:hover:bg-[#5b21b6]/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {formatTime(appointment.appointment_time)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {appointment.appointment_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {loadingPatients ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      <Link
                        href={`/dashboard/patients/${appointment.patient_id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-[#5b21b6] transition-colors"
                      >
                        {patientNames[appointment.patient_id] || 'Unknown'}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        appointmentTypeColors[appointment.appointment_type]
                      }`}
                    >
                      {appointment.appointment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[appointment.status]
                      }`}
                    >
                      {getStatusIcon(appointment.status)}
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {appointment.service_type || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                    {appointment.reason || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#5b21b6] hover:bg-[#5b21b6]/10 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Quick Actions based on status */}
                      {(appointment.status === 'Scheduled' ||
                        appointment.status === 'Confirmed') && (
                        <>
                          <button
                            onClick={() => handleQuickAction(appointment.id, 'check-in')}
                            className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
                            title="Check In"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleQuickAction(appointment.id, 'no-show')}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Mark as No Show"
                          >
                            <CalendarX className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {appointment.status === 'Checked-in' && (
                        <button
                          onClick={() => handleQuickAction(appointment.id, 'start')}
                          className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                          title="Start Visit"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}

                      {appointment.status === 'In Progress' && (
                        <button
                          onClick={() =>
                            router.push(`/dashboard/appointments/${appointment.id}/complete`)
                          }
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="Complete Visit"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {appointments.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} for{' '}
            {formatAppointmentDate(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
}
