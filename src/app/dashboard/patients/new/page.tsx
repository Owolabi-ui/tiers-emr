'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  patientsApi,
  CreatePatientRequest,
  NigerianState,
  NigerianLga,
  sexOptions,
  genderOptions,
  maritalStatusOptions,
  educationalLevelOptions,
  occupationOptions,
  serviceTypeOptions,
  SexType,
  GenderIdentity,
  MaritalStatus,
  EducationalLevel,
  OccupationType,
  ServiceType,
} from '@/lib/patients';
import { clinicsApi, Clinic } from '@/lib/clinics';
import { vitalSignsApi } from '@/lib/vital-signs';
import {
  getTemperatureStatus,
  getPulseStatus,
  getRespirationStatus,
  getSystolicBpStatus,
  getDiastolicBpStatus,
  getSpO2Status,
  getBmiStatus,
  getStatusColor,
  getStatusLabel,
} from '@/lib/vital-signs-ranges';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
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
  Heart,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(min).max(max).optional()
  );

// Validation schema
const patientSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  preferred_name: z.string().optional().nullable(),
  sex: z.enum(['Male', 'Female', 'Intersex'] as const),
  gender: z.string().optional().nullable(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
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
  current_clinic_id: z.string().min(1, 'Please select a clinic'),
  service_types: z.array(z.string()).optional().nullable(),
  // Vital Signs (optional)
  temperature: optionalNumber(30, 45),
  pulse_rate: optionalNumber(20, 250),
  respiratory_rate: optionalNumber(4, 60),
  blood_pressure_systolic: optionalNumber(40, 300),
  blood_pressure_diastolic: optionalNumber(20, 200),
  oxygen_saturation: optionalNumber(50, 100),
  weight: optionalNumber(0.5, 500),
  height: optionalNumber(20, 300),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<NigerianState[]>([]);
  const [lgas, setLgas] = useState<NigerianLga[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [vitalSignsExpanded, setVitalSignsExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      sex: 'Male',
    },
  });

  const selectedStateId = watch('state_id');
  const watchedTemperature = watch('temperature');
  const watchedPulse = watch('pulse_rate');
  const watchedRespiration = watch('respiratory_rate');
  const watchedSystolic = watch('blood_pressure_systolic');
  const watchedDiastolic = watch('blood_pressure_diastolic');
  const watchedSpO2 = watch('oxygen_saturation');
  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');

  const calculatedBmi = useMemo(() => {
    if (watchedWeight && watchedHeight && watchedHeight > 0) {
      const heightInMeters = watchedHeight / 100;
      return watchedWeight / (heightInMeters * heightInMeters);
    }
    return null;
  }, [watchedWeight, watchedHeight]);

  // Load states and clinics on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statesData, clinicsData] = await Promise.all([
          patientsApi.getStates(),
          clinicsApi.getAll(),
        ]);
        setStates(statesData);
        setClinics(clinicsData.clinics);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

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

  const toggleService = (service: ServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const onSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      setError(null);

      const request: CreatePatientRequest = {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        preferred_name: data.preferred_name || null,
        sex: data.sex as SexType,
        gender: (data.gender as GenderIdentity) || null,
        date_of_birth: data.date_of_birth,
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
        current_clinic_id: data.current_clinic_id || null,
        service_types: selectedServices.length > 0 ? selectedServices : null,
      };

      const patient = await patientsApi.create(request);

      const hasVitals = [
        data.temperature,
        data.pulse_rate,
        data.respiratory_rate,
        data.blood_pressure_systolic,
        data.blood_pressure_diastolic,
        data.oxygen_saturation,
        data.weight,
        data.height,
      ].some((value) => value !== null && value !== undefined);

      if (hasVitals) {
        try {
          await vitalSignsApi.create({
            patient_id: patient.id,
            temperature: data.temperature ?? null,
            pulse_rate: data.pulse_rate ?? null,
            respiratory_rate: data.respiratory_rate ?? null,
            blood_pressure_systolic: data.blood_pressure_systolic ?? null,
            blood_pressure_diastolic: data.blood_pressure_diastolic ?? null,
            oxygen_saturation: data.oxygen_saturation ?? null,
            weight: data.weight ?? null,
            height: data.height ?? null,
            bmi: calculatedBmi ?? null,
          });
          showSuccess('Patient registered with vital signs!');
        } catch {
          // Patient registration succeeded; do not block user on secondary save failure.
          showSuccess('Patient registered! Note: Vital signs could not be saved.');
        }
      } else {
        showSuccess('Patient registered successfully!');
      }

      router.push(`/dashboard/patients/${patient.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/patients"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">New Patient</h1>
          <p className="text-sm text-gray-500">Register a new patient in the system</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error creating patient
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
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('first_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="Enter first name"
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
                placeholder="Enter middle name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('last_name')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="Enter last name"
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
                placeholder="Nickname or preferred name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                {...register('sex')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                {sexOptions.map((sex) => (
                  <option key={sex} value={sex}>
                    {sex}
                  </option>
                ))}
              </select>
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
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                {...register('date_of_birth')}
                type="date"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registered at Clinic <span className="text-red-500">*</span>
              </label>
              <select
                {...register('current_clinic_id')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="">Select clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
              {errors.current_clinic_id && (
                <p className="mt-1 text-sm text-red-600">{errors.current_clinic_id.message}</p>
              )}
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
                placeholder="e.g., 08012345678"
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
                placeholder="patient@example.com"
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
                placeholder="Enter street address"
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
                placeholder="Enter city"
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
                placeholder="Specify job title or details"
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
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Relationship
              </label>
              <input
                {...register('emergency_contact_relationship')}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="e.g., Spouse, Parent"
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
                placeholder="e.g., 08012345678"
              />
            </div>
          </div>
        </div>

        {/* Service Enrollment */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Service Enrollment (Optional)</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-3">
              Select services to enroll the patient in upon registration:
            </p>
            <div className="flex flex-wrap gap-2">
              {serviceTypeOptions.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedServices.includes(service)
                      ? 'bg-[#5b21b6] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vital Signs (Optional) */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <button
            type="button"
            onClick={() => setVitalSignsExpanded((prev) => !prev)}
            className="w-full bg-[#5b21b6] px-5 py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Vital Signs</h2>
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                Optional
              </span>
            </div>
            {vitalSignsExpanded ? (
              <ChevronUp className="h-5 w-5 text-white" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white" />
            )}
          </button>

          {vitalSignsExpanded && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperature (°C)
                </label>
                <input
                  {...register('temperature')}
                  type="number"
                  step="0.1"
                  placeholder="e.g., 36.5"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedTemperature !== undefined && watchedTemperature !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getTemperatureStatus(watchedTemperature))}`}>
                    {getStatusLabel(getTemperatureStatus(watchedTemperature))} (Normal: 36.5-37.5°C)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pulse Rate (bpm)
                </label>
                <input
                  {...register('pulse_rate')}
                  type="number"
                  placeholder="e.g., 72"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedPulse !== undefined && watchedPulse !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getPulseStatus(watchedPulse))}`}>
                    {getStatusLabel(getPulseStatus(watchedPulse))} (Normal: 60-100 bpm)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Respiration (cpm)
                </label>
                <input
                  {...register('respiratory_rate')}
                  type="number"
                  placeholder="e.g., 16"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedRespiration !== undefined && watchedRespiration !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getRespirationStatus(watchedRespiration))}`}>
                    {getStatusLabel(getRespirationStatus(watchedRespiration))} (Normal: 12-20 cpm)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BP Systolic (mmHg)
                </label>
                <input
                  {...register('blood_pressure_systolic')}
                  type="number"
                  placeholder="e.g., 120"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedSystolic !== undefined && watchedSystolic !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getSystolicBpStatus(watchedSystolic))}`}>
                    {getStatusLabel(getSystolicBpStatus(watchedSystolic))} (Normal: 90-130 mmHg)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BP Diastolic (mmHg)
                </label>
                <input
                  {...register('blood_pressure_diastolic')}
                  type="number"
                  placeholder="e.g., 80"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedDiastolic !== undefined && watchedDiastolic !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getDiastolicBpStatus(watchedDiastolic))}`}>
                    {getStatusLabel(getDiastolicBpStatus(watchedDiastolic))} (Normal: 60-90 mmHg)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SpO2 (%)
                </label>
                <input
                  {...register('oxygen_saturation')}
                  type="number"
                  step="0.1"
                  placeholder="e.g., 98"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
                {watchedSpO2 !== undefined && watchedSpO2 !== null && (
                  <p className={`mt-1 text-xs font-medium ${getStatusColor(getSpO2Status(watchedSpO2))}`}>
                    {getStatusLabel(getSpO2Status(watchedSpO2))} (Normal: 95-100%)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  {...register('weight')}
                  type="number"
                  step="0.1"
                  placeholder="e.g., 70.5"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height (cm)
                </label>
                <input
                  {...register('height')}
                  type="number"
                  step="0.1"
                  placeholder="e.g., 170"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BMI (Auto-calculated)
                </label>
                <div className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-neutral-800/50 px-3 text-sm flex items-center">
                  {calculatedBmi ? (
                    <span className={getStatusColor(getBmiStatus(calculatedBmi))}>
                      {calculatedBmi.toFixed(1)} - {getStatusLabel(getBmiStatus(calculatedBmi))}
                    </span>
                  ) : (
                    <span className="text-gray-400">Enter weight and height</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/patients"
            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#5b21b6] text-white text-sm font-medium shadow-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
