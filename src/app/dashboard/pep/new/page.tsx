'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  pepApi, 
  CreatePepInformationRequest
} from '@/lib/pep';
import { HtsInitialResponse, htsApi } from '@/lib/hts';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  User,
  Calendar,
  Shield,
  AlertTriangle,
} from 'lucide-react';

type FormData = Omit<CreatePepInformationRequest, 'hts_initial_id'>;

export default function NewPepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patient_id');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedHtsRecord, setSelectedHtsRecord] = useState<HtsInitialResponse | null>(null);
  const [htsDetails, setHtsDetails] = useState<any>(null);
  const [eligibleRecords, setEligibleRecords] = useState<HtsInitialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      mode_of_exposure: 'Non-occupational',
      duration_before_pep: '<24hrs',
      hiv_status_at_exposure: 'Negative',
      supporter_relationship: 'Caregiver',
    },
  });

  useEffect(() => {
    // Only fetch on client-side to avoid SSR issues
    if (typeof window === 'undefined') return;

    const fetchEligibleRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const records = await pepApi.getEligibleHtsRecords();
        setEligibleRecords(records);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleRecords();
  }, []);

  useEffect(() => {
    if (!preselectedPatientId || selectedHtsRecord) return;
    const patientRecords = eligibleRecords.filter((record) => record.patient_id === preselectedPatientId);
    if (patientRecords.length === 1) {
      handleSelectHtsRecord(patientRecords[0]);
    }
  }, [preselectedPatientId, eligibleRecords, selectedHtsRecord]);

  const filteredRecords = eligibleRecords.filter((record) => {
    if (preselectedPatientId && record.patient_id !== preselectedPatientId) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (record.patient_name || '').toLowerCase().includes(search) ||
      record.client_code.toLowerCase().includes(search)
    );
  });

  const handleSelectHtsRecord = async (record: HtsInitialResponse) => {
    setSelectedHtsRecord(record);
    try {
      // Fetch full HTS details to get final_result
      const details = await htsApi.getComplete(record.id);
      setHtsDetails(details);
    } catch (err) {
      console.error('Error fetching HTS details:', err);
    }
    setCurrentStep(2);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedHtsRecord) {
      setError('Please select an HTS record first');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Auto-generate PEP number (format: PEP-YYYYMMDD-XXXXX)
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      const pep_no = `PEP-${timestamp}-${random}`;
      
      // Map HTS final_result to HIV status
      const hiv_status_at_exposure = htsDetails?.initial?.final_result === 'Reactive' ? 'Positive' : 'Negative';
      
      const response = await pepApi.create(selectedHtsRecord.id, {
        ...data,
        hiv_status_at_exposure,
        pep_no,
      });
      router.push(`/dashboard/pep/${response.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
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
                ? 'border-[#5b21b6] bg-[#5b21b6] text-white'
                : 'border-gray-300 text-gray-300'
            }`}
          >
            {currentStep > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
          </div>
          <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-[#5b21b6]' : 'text-gray-400'}`}>
            Select HTS Record
          </span>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-5 w-5 text-gray-300" />

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
              currentStep >= 2
                ? 'border-[#5b21b6] bg-[#5b21b6] text-white'
                : 'border-gray-300 text-gray-300'
            }`}
          >
            2
          </div>
          <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-[#5b21b6]' : 'text-gray-400'}`}>
            PEP Information
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {preselectedPatientId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
          Showing HTS records for the pre-selected patient from registration.
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Select HTS Record
        </h2>
        <p className="text-sm text-gray-500">
          Choose an eligible HTS record to link with this PEP case
        </p>
      </div>

      {/* Alert */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-medium">Time-Sensitive Treatment</p>
            <p className="mt-1">
              PEP must be initiated as soon as possible after exposure, ideally within 72 hours. 
              Effectiveness decreases significantly after this window.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name, hospital number, or client code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
        />
      </div>

      {/* Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-500">
            {searchTerm ? 'No HTS records found matching your search.' : 'No eligible HTS records available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              onClick={() => handleSelectHtsRecord(record)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#5b21b6] hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {record.patient_name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Client Code: {record.client_code}
                    </p>
                    <p className="text-sm text-gray-500">
                      Target Group: {record.target_group_code}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.date_of_visit).toLocaleDateString()}
                      </span>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            PEP Information
          </h2>
          <p className="text-sm text-gray-500">
            Enter Post-Exposure Prophylaxis details
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="text-sm text-[#5b21b6] hover:text-[#4c1d95] font-medium"
        >
          Change HTS Record
        </button>
      </div>

      {/* Selected Patient Info */}
      {selectedHtsRecord && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-300">
                {selectedHtsRecord.patient_name || 'Unknown Patient'}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                Client Code: {selectedHtsRecord.client_code} | Target Group: {selectedHtsRecord.target_group_code}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Exposure Information */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#5b21b6]" />
            Exposure Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mode of Exposure <span className="text-red-500">*</span>
              </label>
              <select
                {...register('mode_of_exposure', { required: 'Mode of exposure is required' })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="Non-occupational">Non-occupational</option>
                <option value="Occupational">Occupational</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Non-occupational: sexual assault, unprotected sex. Occupational: needlestick injury, healthcare exposure.
              </p>
              {errors.mode_of_exposure && (
                <p className="text-sm text-red-600 mt-1">{errors.mode_of_exposure.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration Before PEP <span className="text-red-500">*</span>
              </label>
              <select
                {...register('duration_before_pep', { required: 'Duration is required' })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="<24hrs">&lt;24 hours (Critical)</option>
                <option value="<48hrs">&lt;48 hours (Urgent)</option>
                <option value="<72hrs">&lt;72 hours (Time-Sensitive)</option>
                <option value=">72hrs">&gt;72 hours</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time elapsed between HIV exposure and starting PEP. Must start within 72 hours for effectiveness.
              </p>
              {errors.duration_before_pep && (
                <p className="text-sm text-red-600 mt-1">{errors.duration_before_pep.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                HIV Status at Exposure (From HTS Record)
              </label>
              <div className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900 text-sm text-gray-900 dark:text-white flex items-center">
                {htsDetails?.initial?.final_result ? (
                  <span className={`inline-flex items-center gap-2 ${
                    htsDetails.initial.final_result === 'Reactive' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {htsDetails.initial.final_result === 'Reactive' ? (
                      <><AlertTriangle className="h-4 w-4" /> Positive (Reactive)</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Negative (Non-reactive)</>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-400">Loading...</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically populated from the linked HTS test record. This ensures accuracy and prevents data entry errors.
              </p>
            </div>
          </div>
        </div>

        {/* Supporter Information */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-[#5b21b6]" />
              Treatment Supporter Information
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
              A trusted person who will help ensure medication adherence and provide support throughout the 28-day treatment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supporter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('pep_supporter', { required: 'Supporter name is required' })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="Enter supporter name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full name of the person who will support treatment adherence.
              </p>
              {errors.pep_supporter && (
                <p className="text-sm text-red-600 mt-1">{errors.pep_supporter.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                {...register('supporter_relationship', { required: 'Relationship is required' })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                <option value="Caregiver">Caregiver</option>
                <option value="Child">Child</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Sibling">Sibling</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How the supporter is related to the patient.
              </p>
              {errors.supporter_relationship && (
                <p className="text-sm text-red-600 mt-1">{errors.supporter_relationship.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('supporter_telephone', { required: 'Phone number is required' })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                placeholder="Enter phone number"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Contact number for follow-up and adherence monitoring.
              </p>
              {errors.supporter_telephone && (
                <p className="text-sm text-red-600 mt-1">{errors.supporter_telephone.message}</p>
              )}
            </div>

          </div>
        </div>

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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5b21b6] hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Enroll in PEP
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
          <h1 className="text-2xl font-bold text-[#5b21b6]">New PEP Case</h1>
          <p className="text-sm text-gray-500 mt-1">Enroll patient in Post-Exposure Prophylaxis</p>
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
