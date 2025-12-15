'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  patientsApi,
  Patient,
  UpdatePatientRequest,
  NigerianState,
  NigerianLga,
  genderOptions,
  maritalStatusOptions,
  educationalLevelOptions,
  occupationOptions,
  GenderIdentity,
  MaritalStatus,
  EducationalLevel,
  OccupationType,
} from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

// Validation schema for update (all fields optional)
const updatePatientSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters').optional(),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  preferred_name: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  state_id: z.number().optional().nullable(),
  lga_id: z.number().optional().nullable(),
  city: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  educational_level: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  occupation_specify: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_relationship: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
});

type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<NigerianState[]>([]);
  const [lgas, setLgas] = useState<NigerianLga[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdatePatientFormData>({
    resolver: zodResolver(updatePatientSchema),
  });

  const selectedStateId = watch('state_id');

  // Load patient and states on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [patientData, statesData] = await Promise.all([
          patientsApi.getById(patientId),
          patientsApi.getStates(),
        ]);
        setPatient(patientData);
        setStates(statesData);

        // Pre-fill form with existing data
        reset({
          first_name: patientData.first_name,
          middle_name: patientData.middle_name,
          last_name: patientData.last_name,
          preferred_name: patientData.preferred_name,
          gender: patientData.gender,
          phone: patientData.phone_number,
          email: patientData.email,
          address: patientData.address,
          state_id: patientData.state_id,
          lga_id: patientData.lga_id,
          city: patientData.city,
          marital_status: patientData.marital_status,
          educational_level: patientData.educational_level,
          occupation: patientData.occupation,
          occupation_specify: patientData.occupation_details,
          emergency_contact_name: patientData.emergency_contact_name,
          emergency_contact_relationship: patientData.emergency_contact_relationship,
          emergency_contact_phone: patientData.emergency_contact_phone,
        });

        // Load LGAs if state is set
        if (patientData.state_id) {
          const lgasData = await patientsApi.getLgas(patientData.state_id);
          setLgas(lgasData);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadData();
    }
  }, [patientId, reset]);

  // Load LGAs when state changes
  useEffect(() => {
    const loadLgas = async () => {
      if (selectedStateId) {
        try {
          const data = await patientsApi.getLgas(selectedStateId);
          setLgas(data);
        } catch (err) {
          console.error('Failed to load LGAs:', err);
        }
      } else {
        setLgas([]);
        setValue('lga_id', null);
      }
    };
    loadLgas();
  }, [selectedStateId, setValue]);

  const onSubmit = async (data: UpdatePatientFormData) => {
    try {
      setSaving(true);
      setError(null);

      const request: UpdatePatientRequest = {
        first_name: data.first_name || null,
        middle_name: data.middle_name || null,
        last_name: data.last_name || null,
        preferred_name: data.preferred_name || null,
        gender: (data.gender as GenderIdentity) || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        state_id: data.state_id || null,
        lga_id: data.lga_id || null,
        city: data.city || null,
        marital_status: (data.marital_status as MaritalStatus) || null,
        educational_level: (data.educational_level as EducationalLevel) || null,
        occupation: (data.occupation as OccupationType) || null,
        occupation_specify: data.occupation_specify || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
      };

      await patientsApi.update(patientId, request);
      router.push(`/dashboard/patients/${patientId}`);
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
          <p className="mt-4 text-sm text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Patient not found</p>
              <Link
                href="/dashboard/patients"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to patients
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/patients/${patientId}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Edit Patient</h1>
          <p className="text-sm text-gray-500">
            Hospital No: <span className="font-mono">{patient.hospital_no}</span>
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
                Error updating patient
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <User className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Personal Information</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                {...register('first_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Middle Name
              </label>
              <input
                {...register('middle_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                {...register('last_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Name
              </label>
              <input
                {...register('preferred_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender Identity
              </label>
              <select
                {...register('gender')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select gender</option>
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marital Status
              </label>
              <select
                {...register('marital_status')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select status</option>
                {maritalStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Phone className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Contact Information</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Address</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              <input
                {...register('address')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <select
                {...register('state_id', { valueAsNumber: true })}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LGA
              </label>
              <select
                {...register('lga_id', { valueAsNumber: true })}
                disabled={!selectedStateId}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 disabled:opacity-50"
              >
                <option value="">Select LGA</option>
                {lgas.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                {...register('city')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
          </div>
        </div>

        {/* Education & Occupation */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Education & Occupation</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Educational Level
              </label>
              <select
                {...register('educational_level')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select level</option>
                {educationalLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Occupation
              </label>
              <select
                {...register('occupation')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select occupation</option>
                {occupationOptions.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Occupation Details
              </label>
              <input
                {...register('occupation_specify')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Emergency Contact</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name
              </label>
              <input
                {...register('emergency_contact_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Relationship
              </label>
              <input
                {...register('emergency_contact_relationship')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                {...register('emergency_contact_phone')}
                type="tel"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/patients/${patientId}`}
            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5b21b6] text-white text-sm font-medium shadow-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
