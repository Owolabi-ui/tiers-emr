'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  appointmentsApi,
  AppointmentResponse,
  AppointmentType,
  appointmentTypeOptions,
  appointmentTypeColors,
} from '@/lib/appointments';
import { patientsApi, Patient, getPatientFullName, serviceTypeOptions } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const editAppointmentSchema = z.object({
  appointment_type: z.enum([
    'Refill',
    'Follow-up',
    'Lab Review',
    'Clinical Review',
    'Counseling',
    'New Patient',
    'Emergency',
    'Other',
  ] as const),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>;

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
  });

  const selectedAppointmentType = watch('appointment_type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await appointmentsApi.getById(appointmentId);
        setAppointment(data.appointment);

        // Populate form
        reset({
          appointment_type: data.appointment.appointment_type,
          appointment_date: data.appointment.appointment_date,
          appointment_time: data.appointment.appointment_time || '',
          reason: data.appointment.reason || '',
          notes: data.appointment.notes || '',
        });

        // Fetch patient
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
  }, [appointmentId, reset]);

  const onSubmit = async (data: EditAppointmentFormData) => {
    try {
      setSaving(true);
      setError(null);

      // Format time - backend expects HH:MM:SS format
      let formattedTime: string | null = null;
      if (data.appointment_time) {
        // Browser time input gives HH:MM, add seconds for backend
        formattedTime = data.appointment_time.length === 5
          ? `${data.appointment_time}:00`
          : data.appointment_time;
      }

      await appointmentsApi.update(appointmentId, {
        appointment_type: data.appointment_type,
        appointment_date: data.appointment_date,
        appointment_time: formattedTime,
        reason: data.reason || null,
        notes: data.notes || null,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/appointments/${appointmentId}`);
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
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

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-green-800 dark:text-green-300">
            Appointment Updated!
          </h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            Redirecting to appointment details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/appointments/${appointmentId}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Edit Appointment</h1>
          <p className="text-sm text-gray-500">
            #{appointment?.appointment_number}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error updating appointment
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient (Read-only) */}
        {patient && (
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
              <User className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Patient</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-neutral-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getPatientFullName(patient)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Hospital No: {patient.hospital_no} | {patient.sex}
                  </p>
                </div>
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="text-sm text-[#5b21b6] hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Appointment Details</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Appointment Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {appointmentTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('appointment_type', type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedAppointmentType === type
                        ? `${appointmentTypeColors[type]} border-transparent`
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.appointment_type && (
                <p className="mt-2 text-sm text-red-600">{errors.appointment_type.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    {...register('appointment_date')}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  />
                </div>
                {errors.appointment_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.appointment_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time (Optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    {...register('appointment_time')}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Notes</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Visit
              </label>
              <input
                type="text"
                {...register('reason')}
                placeholder="e.g., Monthly refill, Follow-up on lab results..."
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Any additional information..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/appointments/${appointmentId}`}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
