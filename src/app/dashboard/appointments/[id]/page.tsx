'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  appointmentsApi,
  AppointmentDetailsResponse,
  AppointmentStatus,
  statusColors,
  appointmentTypeColors,
  formatTime,
  formatAppointmentDate,
  isAppointmentToday,
  getAppointmentDateLabel,
  getAppointmentServiceLabel,
} from '@/lib/appointments';
import { patientsApi, Patient, getPatientFullName, formatDate } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  UserCheck,
  CalendarX,
  CalendarClock,
  Phone,
  Mail,
  Stethoscope,
  Bell,
} from 'lucide-react';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointmentData, setAppointmentData] = useState<AppointmentDetailsResponse | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await appointmentsApi.getById(appointmentId);
        setAppointmentData(data);

        // Fetch patient details
        const patientData = await patientsApi.getById(data.appointment.patient_id);
        setPatient(patientData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchData();
    }
  }, [appointmentId]);

  const handleAction = async (action: 'check-in' | 'start' | 'no-show') => {
    try {
      setActionLoading(true);
      setError(null);

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

      // Refresh data
      const data = await appointmentsApi.getById(appointmentId);
      setAppointmentData(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setError('Cancellation reason is required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await appointmentsApi.cancel(appointmentId, { cancellation_reason: cancelReason });

      const data = await appointmentsApi.getById(appointmentId);
      setAppointmentData(data);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleReason.trim()) {
      setError('New date and reason are required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      await appointmentsApi.reschedule(appointmentId, {
        new_appointment_date: rescheduleDate,
        new_appointment_time: rescheduleTime || null,
        reason: rescheduleReason,
      });

      const data = await appointmentsApi.getById(appointmentId);
      setAppointmentData(data);
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
      case 'Confirmed':
        return <Clock className="h-5 w-5" />;
      case 'Checked-in':
        return <UserCheck className="h-5 w-5" />;
      case 'In Progress':
        return <Play className="h-5 w-5" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5" />;
      case 'No Show':
        return <CalendarX className="h-5 w-5" />;
      case 'Rescheduled':
        return <CalendarClock className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error && !appointmentData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading appointment
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <Link
                href="/dashboard/appointments"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointmentData) return null;

  const { appointment, visit_details, notifications } = appointmentData;
  const canCheckIn = appointment.status === 'Scheduled' || appointment.status === 'Confirmed';
  const canStart = appointment.status === 'Checked-in';
  const canComplete = appointment.status === 'In Progress';
  const canCancel =
    appointment.status === 'Scheduled' ||
    appointment.status === 'Confirmed' ||
    appointment.status === 'Checked-in';
  const canReschedule = appointment.status === 'Scheduled' || appointment.status === 'Confirmed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/appointments"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5b21b6]">
              Appointment #{appointment.appointment_number}
            </h1>
            <p className="text-sm text-gray-500">
              {getAppointmentDateLabel(appointment.appointment_date)} at{' '}
              {formatTime(appointment.appointment_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/appointments/${appointmentId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div
        className={`rounded-xl p-4 flex items-center justify-between ${statusColors[appointment.status]} bg-opacity-20`}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(appointment.status)}
          <div>
            <p className="font-semibold text-lg">{appointment.status}</p>
            {appointment.status === 'Cancelled' && appointment.cancellation_reason && (
              <p className="text-sm opacity-80">Reason: {appointment.cancellation_reason}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {canCheckIn && (
            <button
              onClick={() => handleAction('check-in')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Check In
            </button>
          )}
          {canStart && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <Play className="h-4 w-4" />
              Start Visit
            </button>
          )}
          {canComplete && (
            <Link
              href={`/dashboard/appointments/${appointmentId}/complete`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Visit
            </Link>
          )}
          {canReschedule && (
            <button
              onClick={() => setShowRescheduleModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <CalendarClock className="h-4 w-4" />
              Reschedule
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}
          {canCheckIn && (
            <button
              onClick={() => handleAction('no-show')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <CalendarX className="h-4 w-4" />
              No Show
            </button>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            Date
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatAppointmentDate(appointment.appointment_date)}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Time
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatTime(appointment.appointment_time)}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Stethoscope className="h-4 w-4" />
            Type
          </div>
          <p
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${appointmentTypeColors[appointment.appointment_type]}`}
          >
            {appointment.appointment_type}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText className="h-4 w-4" />
            Service
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {getAppointmentServiceLabel(appointment)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        {patient && (
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
              <User className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Patient</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">
                    {getPatientFullName(patient)}
                  </p>
                  <p className="text-sm text-gray-500">Hospital No: {patient.hospital_no}</p>
                </div>
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="text-sm text-[#5b21b6] hover:underline"
                >
                  View Profile
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  {patient.sex}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {formatDate(patient.date_of_birth)}
                </div>
                {patient.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    {patient.phone_number}
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    {patient.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Notes */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Notes</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reason for Visit</p>
              <p className="text-gray-900 dark:text-white">{appointment.reason || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
              <p className="text-gray-900 dark:text-white">{appointment.notes || '-'}</p>
            </div>
            {appointment.clinical_summary && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Clinical Summary</p>
                <p className="text-gray-900 dark:text-white">{appointment.clinical_summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Visit Details (if completed) */}
        {visit_details && (
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden lg:col-span-2">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Visit Details</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visit_details.chief_complaint && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
                  <p className="text-gray-900 dark:text-white">{visit_details.chief_complaint}</p>
                </div>
              )}
              {visit_details.assessment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assessment</p>
                  <p className="text-gray-900 dark:text-white">{visit_details.assessment}</p>
                </div>
              )}
              {visit_details.diagnosis && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                  <p className="text-gray-900 dark:text-white">{visit_details.diagnosis}</p>
                </div>
              )}
              {visit_details.treatment_plan && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Treatment Plan</p>
                  <p className="text-gray-900 dark:text-white">{visit_details.treatment_plan}</p>
                </div>
              )}
              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {visit_details.lab_tests_ordered && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Lab Tests Ordered
                  </span>
                )}
                {visit_details.drugs_prescribed && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Drugs Prescribed
                  </span>
                )}
                {visit_details.counseling_provided && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                    Counseling Provided
                  </span>
                )}
                {visit_details.referral_made && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    Referral Made
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden lg:col-span-2">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Notifications</h2>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notification.notification_type} - {notification.status}
                      </p>
                      <p className="text-xs text-gray-500">{notification.subject}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        notification.status === 'Delivered' || notification.status === 'Read'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : notification.status === 'Failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {notification.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancel Appointment
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="Enter reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reschedule Appointment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Date *
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Rescheduling *
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  placeholder="Enter reason..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setRescheduleReason('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleReschedule}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
