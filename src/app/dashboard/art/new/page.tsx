'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  artApi, 
  CreateArtInformationRequest
} from '@/lib/art';
import { patientsApi, Patient } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { useFormConfig } from '@/hooks/useFormConfig';
import { FORM_SCHEMAS } from '@/lib/form-schemas';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  User,
  Calendar,
  Heart,
  Phone,
} from 'lucide-react';

type FormData = Omit<CreateArtInformationRequest, 'patient_id'>;

export default function NewArtPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patient_id');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedArtNo, setGeneratedArtNo] = useState<string>('');
  const { isVisible, isRequired, getLabel, getOptions } = useFormConfig('art', FORM_SCHEMAS.art);
  const showArtClientInfoSection =
    isVisible('art_no') ||
    isVisible('date_confirmed_hiv_positive') ||
    isVisible('date_enrolled_into_hiv_care') ||
    isVisible('mode_of_hiv_test') ||
    isVisible('entry_point') ||
    isVisible('where_test_was_done') ||
    isVisible('prior_art');
  const showNextOfKinSection =
    isVisible('name_of_next_of_kin') ||
    isVisible('relationship_with_next_of_kin') ||
    isVisible('phone_no_of_next_of_kin');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      entry_point: 'VCT',
    },
  });

  // Generate ART number when component mounts
  useEffect(() => {
    const generateArtNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      return `ART-${year}${month}${day}-${random}`;
    };

    const artNo = generateArtNumber();
    setGeneratedArtNo(artNo);
    setValue('art_no', artNo);
  }, [setValue]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await patientsApi.list(1, 100);
        setPatients(response.data || response.patients || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const prefillPatient = async () => {
      if (!preselectedPatientId || selectedPatient) return;
      try {
        setPrefillLoading(true);
        const patient = await patientsApi.getById(preselectedPatientId);
        setSelectedPatient(patient);
        setCurrentStep(2);
      } catch (err) {
        console.error('Failed to prefill ART patient:', err);
      } finally {
        setPrefillLoading(false);
      }
    };

    prefillPatient();
  }, [preselectedPatientId, selectedPatient]);

  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
    return (
      fullName.includes(search) ||
      patient.hospital_no.toLowerCase().includes(search)
    );
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Generate a fresh ART number on submission to avoid duplicates
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      const freshArtNo = `ART-${year}${month}${day}-${random}`;
      
      const requestData: CreateArtInformationRequest = {
        ...data,
        patient_id: selectedPatient.id,
        art_no: freshArtNo, // Use the fresh number
        // Convert empty strings to undefined for optional enum fields
        mode_of_hiv_test: data.mode_of_hiv_test || undefined,
        prior_art: data.prior_art || undefined,
        where_test_was_done: data.where_test_was_done || undefined,
      };

      // Step 1: Create ART enrollment record
      const artRecord = await artApi.create(requestData);
      
      router.push(`/dashboard/art/${artRecord.id}`);
    } catch (err: any) {
      // Handle specific error cases
      const errorMessage = err?.response?.data || err?.message || 'Unknown error';
      
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique_art_patient')) {
        setError(`This patient is already enrolled in ART. Each patient can only have one active ART record.`);
      } else if (errorMessage.includes('unknown variant')) {
        setError('Invalid selection in one of the form fields. Please check your entries and try again.');
      } else {
        setError(getErrorMessage(err));
      }
      
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
              currentStep >= 1
                ? 'border-[#065f46] bg-[#065f46] text-white'
                : 'border-gray-300 text-gray-300'
            }`}
          >
            {currentStep > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
          </div>
          <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-[#065f46]' : 'text-gray-400'}`}>
            Select Patient
          </span>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-5 w-5 text-gray-300" />

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
              currentStep >= 2
                ? 'border-[#065f46] bg-[#065f46] text-white'
                : 'border-gray-300 text-gray-300'
            }`}
          >
            2
          </div>
          <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-[#065f46]' : 'text-gray-400'}`}>
            ART Information
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {preselectedPatientId && prefillLoading ? (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm text-blue-800 dark:text-blue-300">Loading patient information...</p>
          </div>
        </div>
      ) : preselectedPatientId ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
          Patient pre-selected from registration. You can proceed directly or choose another patient.
        </div>
      ) : null}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Select Patient
        </h2>
        <p className="text-sm text-gray-500">
          Choose a patient to enroll in ART program
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Independent Enrollment</p>
            <p className="mt-1">
              ART enrollment is independent and does not require prior HTS testing. 
              Patients can be enrolled directly based on their HIV-positive status.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name or hospital number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
        />
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#065f46]" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-500">
            {searchTerm ? 'No patients found matching your search.' : 'No patients available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#065f46] hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {patient.first_name} {patient.middle_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Hospital No: {patient.hospital_no}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                      </span>
                      <span>{patient.sex}</span>
                      {patient.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {preselectedPatientId && prefillLoading ? (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm text-blue-800 dark:text-blue-300">Loading patient information...</p>
          </div>
        </div>
      ) : preselectedPatientId && selectedPatient ? (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Patient pre-selected:{' '}
            <strong>
              {selectedPatient.hospital_no} - {selectedPatient.first_name} {selectedPatient.last_name}
            </strong>
          </p>
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ART Information
          </h2>
          <p className="text-sm text-gray-500">
            Enter Antiretroviral Therapy details
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          disabled={!!preselectedPatientId}
          className="text-sm text-[#065f46] hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Change Patient
        </button>
      </div>

      {/* Selected Patient Info */}
      {selectedPatient && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-300">
                {selectedPatient.first_name} {selectedPatient.middle_name} {selectedPatient.last_name}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Hospital No: {selectedPatient.hospital_no} | DOB: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic ART Information */}
        {showArtClientInfoSection && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#065f46]" />
            ART Client Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible('art_no') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('art_no')} {isRequired('art_no') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                {...register('art_no', {
                  required: isRequired('art_no') ? `${getLabel('art_no')} is required` : false,
                })}
                readOnly
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-700 text-sm text-gray-900 dark:text-white focus:outline-none cursor-not-allowed"
                placeholder="Auto-generated"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Auto-generated ART identification number
              </p>
              {errors.art_no && (
                <p className="text-sm text-red-600 mt-1">{errors.art_no.message}</p>
              )}
              </div>
            )}

            {isVisible('date_confirmed_hiv_positive') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('date_confirmed_hiv_positive')} {isRequired('date_confirmed_hiv_positive') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                {...register('date_confirmed_hiv_positive', {
                  required: isRequired('date_confirmed_hiv_positive')
                    ? `${getLabel('date_confirmed_hiv_positive')} is required`
                    : false,
                })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Date patient was first diagnosed HIV positive
              </p>
              {errors.date_confirmed_hiv_positive && (
                <p className="text-sm text-red-600 mt-1">{errors.date_confirmed_hiv_positive.message}</p>
              )}
              </div>
            )}

            {isVisible('date_enrolled_into_hiv_care') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('date_enrolled_into_hiv_care')} {isRequired('date_enrolled_into_hiv_care') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                {...register('date_enrolled_into_hiv_care', {
                  required: isRequired('date_enrolled_into_hiv_care')
                    ? `${getLabel('date_enrolled_into_hiv_care')} is required`
                    : false,
                })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Date patient was enrolled into HIV care services
              </p>
              {errors.date_enrolled_into_hiv_care && (
                <p className="text-sm text-red-600 mt-1">{errors.date_enrolled_into_hiv_care.message}</p>
              )}
              </div>
            )}

            {isVisible('mode_of_hiv_test') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('mode_of_hiv_test')}
              </label>
              <select
                {...register('mode_of_hiv_test')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
              >
                <option value="">Select test mode</option>
                {getOptions('mode_of_hiv_test', ['HIV-AB', 'PCR']).map((option) => (
                  <option key={option} value={option}>
                    {option === 'HIV-AB' ? 'HIV-AB (Antibody test)' : 'PCR (DNA/RNA test)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Type of test used for HIV diagnosis
              </p>
              </div>
            )}

            {isVisible('entry_point') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('entry_point')} {isRequired('entry_point') && <span className="text-red-500">*</span>}
              </label>
              <select
                {...register('entry_point', {
                  required: isRequired('entry_point') ? `${getLabel('entry_point')} is required` : false,
                })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
              >
                {getOptions('entry_point', [
                  'VCT',
                  'ANC/PMTCT',
                  'Index testing',
                  'Inpatient',
                  'OPD',
                  'Outreach',
                  'STI clinic',
                  'TB-DOT',
                  'Transferred in',
                  'Others',
                ]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How the patient entered HIV care services
              </p>
              {errors.entry_point && (
                <p className="text-sm text-red-600 mt-1">{errors.entry_point.message}</p>
              )}
              </div>
            )}

            {isVisible('where_test_was_done') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('where_test_was_done')}
              </label>
              <input
                type="text"
                {...register('where_test_was_done')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
                placeholder="Enter facility name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Name of facility where HIV test was conducted
              </p>
              </div>
            )}

            {isVisible('prior_art') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('prior_art')}
              </label>
              <select
                {...register('prior_art')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
              >
                <option value="">None</option>
                {getOptions('prior_art', [
                  'PEP',
                  'PMTCT only',
                  'Transfer in with records',
                  'Transfer in without records',
                ]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Previous antiretroviral treatment history
              </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Next of Kin Information */}
        {showNextOfKinSection && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-5 w-5 text-[#065f46]" />
            Next of Kin Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible('name_of_next_of_kin') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('name_of_next_of_kin')}
              </label>
              <input
                type="text"
                {...register('name_of_next_of_kin')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
                placeholder="Enter name"
              />
              </div>
            )}

            {isVisible('relationship_with_next_of_kin') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('relationship_with_next_of_kin')}
              </label>
              <input
                type="text"
                {...register('relationship_with_next_of_kin')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
              </div>
            )}

            {isVisible('phone_no_of_next_of_kin') && (
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getLabel('phone_no_of_next_of_kin')}
              </label>
              <input
                type="tel"
                {...register('phone_no_of_next_of_kin')}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
                placeholder="Enter phone number"
              />
              </div>
            )}
          </div>
        </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#065f46] hover:bg-[#064e3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Enroll in ART
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#065f46]">New ART Patient</h1>
          <p className="text-sm text-gray-500 mt-1">Enroll patient in Antiretroviral Therapy</p>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {error && currentStep === 1 && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
}
