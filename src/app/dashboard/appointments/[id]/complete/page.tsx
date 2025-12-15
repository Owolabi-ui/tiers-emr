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
  formatTime,
  formatAppointmentDate,
} from '@/lib/appointments';
import { patientsApi, Patient, getPatientFullName } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  ClipboardList,
  Pill,
  TestTube,
  MessageSquare,
  Share2,
} from 'lucide-react';

const completeAppointmentSchema = z.object({
  clinical_summary: z.string().min(1, 'Clinical summary is required'),
  chief_complaint: z.string().optional(),
  assessment: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  lab_tests_ordered: z.boolean().default(false),
  drugs_prescribed: z.boolean().default(false),
  counseling_provided: z.boolean().default(false),
  referral_made: z.boolean().default(false),
  next_appointment_date: z.string().optional(),
  next_appointment_reason: z.string().optional(),
});

type CompleteAppointmentFormData = z.infer<typeof completeAppointmentSchema>;

export default function CompleteAppointmentPage() {
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompleteAppointmentFormData>({
    resolver: zodResolver(completeAppointmentSchema),
    defaultValues: {
      lab_tests_ordered: false,
      drugs_prescribed: false,
      counseling_provided: false,
      referral_made: false,
    },
  });

  const labTestsOrdered = watch('lab_tests_ordered');
  const drugsPrescribed = watch('drugs_prescribed');
  const counselingProvided = watch('counseling_provided');
  const referralMade = watch('referral_made');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await appointmentsApi.getById(appointmentId);

        // Check if appointment can be completed
        if (data.appointment.status !== 'In Progress') {
          setError(`Cannot complete this appointment. Current status: ${data.appointment.status}`);
          return;
        }

        setAppointment(data.appointment);

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
  }, [appointmentId]);

  const onSubmit = async (data: CompleteAppointmentFormData) => {
    try {
      setSaving(true);
      setError(null);

      await appointmentsApi.complete(appointmentId, {
        clinical_summary: data.clinical_summary,
        visit_details: {
          chief_complaint: data.chief_complaint || null,
          assessment: data.assessment || null,
          diagnosis: data.diagnosis || null,
          treatment_plan: data.treatment_plan || null,
          lab_tests_ordered: data.lab_tests_ordered,
          drugs_prescribed: data.drugs_prescribed,
          counseling_provided: data.counseling_provided,
          referral_made: data.referral_made,
          next_appointment_date: data.next_appointment_date || null,
          next_appointment_reason: data.next_appointment_reason || null,
        },
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
                Cannot Complete Appointment
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <Link
                href={`/dashboard/appointments/${appointmentId}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to appointment
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
            Visit Completed!
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
          <h1 className="text-2xl font-bold text-[#5b21b6]">Complete Visit</h1>
          <p className="text-sm text-gray-500">
            #{appointment?.appointment_number} -{' '}
            {appointment && formatAppointmentDate(appointment.appointment_date)} at{' '}
            {appointment && formatTime(appointment.appointment_time)}
          </p>
        </div>
      </div>

      {/* Patient Info Banner */}
      {patient && (
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[#5b21b6]/10">
              <User className="h-6 w-6 text-[#5b21b6]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {getPatientFullName(patient)}
              </p>
              <p className="text-sm text-gray-500">
                Hospital No: {patient.hospital_no} | {patient.sex} | {appointment?.appointment_type}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Clinical Summary */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Clinical Summary *</h2>
          </div>
          <div className="p-5">
            <textarea
              {...register('clinical_summary')}
              rows={4}
              placeholder="Summarize the visit outcome, key findings, and any important notes..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
            />
            {errors.clinical_summary && (
              <p className="mt-1 text-sm text-red-600">{errors.clinical_summary.message}</p>
            )}
          </div>
        </div>

        {/* Visit Details */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Visit Details</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chief Complaint
              </label>
              <input
                type="text"
                {...register('chief_complaint')}
                placeholder="Patient's main complaint or reason for visit"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assessment
              </label>
              <textarea
                {...register('assessment')}
                rows={2}
                placeholder="Clinical assessment and observations"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diagnosis
              </label>
              <input
                type="text"
                {...register('diagnosis')}
                placeholder="Diagnosis or impression"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Treatment Plan
              </label>
              <textarea
                {...register('treatment_plan')}
                rows={2}
                placeholder="Treatment plan and recommendations"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions Taken */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Actions Taken</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setValue('lab_tests_ordered', !labTestsOrdered)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  labTestsOrdered
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <TestTube
                  className={`h-6 w-6 ${labTestsOrdered ? 'text-purple-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${labTestsOrdered ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  Lab Tests
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue('drugs_prescribed', !drugsPrescribed)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  drugsPrescribed
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Pill
                  className={`h-6 w-6 ${drugsPrescribed ? 'text-blue-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${drugsPrescribed ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  Drugs
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue('counseling_provided', !counselingProvided)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  counselingProvided
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <MessageSquare
                  className={`h-6 w-6 ${counselingProvided ? 'text-pink-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${counselingProvided ? 'text-pink-700 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  Counseling
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue('referral_made', !referralMade)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  referralMade
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Share2
                  className={`h-6 w-6 ${referralMade ? 'text-orange-600' : 'text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${referralMade ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  Referral
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Follow-up Appointment */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Next Appointment (Optional)</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Next Appointment Date
                </label>
                <input
                  type="date"
                  {...register('next_appointment_date')}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Follow-up
                </label>
                <input
                  type="text"
                  {...register('next_appointment_reason')}
                  placeholder="e.g., Lab review, Refill, Follow-up"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>
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
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete Visit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
