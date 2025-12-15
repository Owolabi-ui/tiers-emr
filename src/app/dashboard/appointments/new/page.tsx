'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  appointmentsApi,
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
  Search,
  X,
  CheckCircle,
} from 'lucide-react';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
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
  service_type: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patient_id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Patient search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_type: 'Follow-up',
      appointment_date: new Date().toISOString().split('T')[0],
      patient_id: preselectedPatientId || '',
    },
  });

  const selectedAppointmentType = watch('appointment_type');

  // Load preselected patient
  useEffect(() => {
    if (preselectedPatientId) {
      const loadPatient = async () => {
        try {
          const patient = await patientsApi.getById(preselectedPatientId);
          setSelectedPatient(patient);
          setValue('patient_id', patient.id);
        } catch (err) {
          console.error('Failed to load patient:', err);
        }
      };
      loadPatient();
    }
  }, [preselectedPatientId, setValue]);

  // Search patients
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    let isCancelled = false;

    const searchPatients = async () => {
      try {
        setSearching(true);

        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Search timeout')), 10000);
        });

        // Race between search and timeout
        const response = await Promise.race([
          patientsApi.search({
            search: searchTerm,
            page_size: 10,
          }),
          timeoutPromise
        ]);

        if (!isCancelled) {
          // Backend returns 'data', not 'patients'
          setSearchResults(response.data || response.patients || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
        if (!isCancelled) {
          setSearchResults([]);
          setShowSearchResults(true); // Show "no results" message
        }
      } finally {
        if (!isCancelled) {
          setSearching(false);
        }
      }
    };

    const timer = setTimeout(searchPatients, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patient_id', patient.id);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setValue('patient_id', '');
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Format time - backend expects HH:MM:SS format
      let formattedTime: string | null = null;
      if (data.appointment_time) {
        // Browser time input gives HH:MM, add seconds for backend
        formattedTime = data.appointment_time.length === 5
          ? `${data.appointment_time}:00`
          : data.appointment_time;
      }

      await appointmentsApi.create({
        patient_id: data.patient_id,
        appointment_type: data.appointment_type,
        appointment_date: data.appointment_date,
        appointment_time: formattedTime,
        service_type: data.service_type || null,
        reason: data.reason || null,
        notes: data.notes || null,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/appointments');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-green-800 dark:text-green-300">
            Appointment Scheduled!
          </h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            Redirecting to appointments...
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
          href="/dashboard/appointments"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">New Appointment</h1>
          <p className="text-sm text-gray-500">Schedule a new patient appointment</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error creating appointment
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
            <User className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Patient</h2>
          </div>
          <div className="p-5">
            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-[#5b21b6]/10 border border-purple-200 dark:border-purple-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getPatientFullName(selectedPatient)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Hospital No: {selectedPatient.hospital_no} | {selectedPatient.sex} |{' '}
                    {selectedPatient.phone_number || 'No phone'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient by name, hospital number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 shadow-xl max-h-80 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-5 py-4 text-left hover:bg-purple-50 dark:hover:bg-[#5b21b6]/10 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                      >
                        <p className="font-semibold text-base text-gray-900 dark:text-white truncate">
                          {getPatientFullName(patient)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                            {patient.hospital_no}
                          </span>
                          <span className="mx-2">|</span>
                          {patient.sex}
                          <span className="mx-2">|</span>
                          {patient.phone_number || 'No phone'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {showSearchResults && searchTerm.length >= 2 && searchResults && searchResults.length === 0 && !searching && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 shadow-lg p-4 text-center">
                    <p className="text-sm text-gray-500">No patients found</p>
                    <Link
                      href="/dashboard/patients/new"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-[#5b21b6] hover:underline"
                    >
                      Register new patient
                    </Link>
                  </div>
                )}
              </div>
            )}
            {errors.patient_id && (
              <p className="mt-2 text-sm text-red-600">{errors.patient_id.message}</p>
            )}
          </div>
        </div>

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

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service (Optional)
              </label>
              <select
                {...register('service_type')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select service...</option>
                {serviceTypeOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
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
            href="/dashboard/appointments"
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Schedule Appointment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
