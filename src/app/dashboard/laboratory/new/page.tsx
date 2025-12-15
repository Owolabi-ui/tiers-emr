'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  laboratoryApi,
  LabTestCatalog,
  labTestPriorityOptions,
  LabTestPriority,
} from '@/lib/laboratory';
import { patientsApi, Patient } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  Search,
  User,
  FlaskConical,
  Calendar,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// FORM SCHEMA
// ============================================================================

const labOrderFormSchema = z.object({
  patient_id: z.string().uuid('Please select a patient'),
  test_id: z.string().uuid('Please select a lab test'),
  priority: z.enum(['Routine', 'Urgent', 'ASAP', 'STAT']),
  clinical_notes: z.string().optional(),
});

type LabOrderFormData = z.infer<typeof labOrderFormSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewLabOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Lab test catalog
  const [labTests, setLabTests] = useState<LabTestCatalog[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<LabTestCatalog | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderFormSchema),
    defaultValues: {
      priority: 'Routine',
    },
  });

  const testId = watch('test_id');

  // Load lab test catalog
  useEffect(() => {
    const loadLabTests = async () => {
      try {
        setLabTestsLoading(true);
        const response = await laboratoryApi.getActiveCatalog();
        setLabTests(response.data || []);
      } catch (err) {
        console.error('Error loading lab tests:', err);
      } finally {
        setLabTestsLoading(false);
      }
    };

    loadLabTests();
  }, []);

  // Update selected test when test_id changes
  useEffect(() => {
    if (testId) {
      const test = labTests.find((t) => t.id === testId);
      setSelectedTest(test || null);
    } else {
      setSelectedTest(null);
    }
  }, [testId, labTests]);

  // Debounced patient search
  useEffect(() => {
    if (!patientSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setError(null);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Search timeout')), 10000);
        });

        const searchPromise = patientsApi.search({ search: patientSearch, page: 1, page_size: 10 });
        const response = await Promise.race([searchPromise, timeoutPromise]);

        const patients = response.data || response.patients || [];
        setSearchResults(patients);
      } catch (err) {
        console.error('Error searching patients:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setSearchLoading(false);
    };
  }, [patientSearch]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patient_id', patient.id);
    setPatientSearch('');
    setSearchResults([]);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setValue('patient_id', '');
  };

  const onSubmit = async (data: LabOrderFormData) => {
    try {
      setLoading(true);
      setError(null);

      const order = await laboratoryApi.createOrder({
        patient_id: data.patient_id,
        test_id: data.test_id,
        priority: data.priority as LabTestPriority,
        clinical_notes: data.clinical_notes || null,
      });

      router.push(`/dashboard/laboratory/${order.id}`);
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
          href="/dashboard/laboratory"
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">New Lab Test Order</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new laboratory test order</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Error creating lab order</p>
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
            <h2 className="font-semibold text-white">Patient Selection</h2>
          </div>
          <div className="p-6 space-y-4">
            {!selectedPatient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name or staff number..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults && searchResults.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {patient.first_name} {patient.middle_name ? `${patient.middle_name} ` : ''}{patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Hospital No: {patient.hospital_no} | DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {errors.patient_id && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.patient_id.message}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-[#5b21b6]/10 dark:bg-[#5b21b6]/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedPatient.first_name} {selectedPatient.middle_name ? `${selectedPatient.middle_name} ` : ''}{selectedPatient.last_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hospital No: {selectedPatient.hospital_no}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lab Test Selection */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
            <FlaskConical className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Lab Test Selection</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Test <span className="text-red-500">*</span>
              </label>
              {labTestsLoading ? (
                <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading tests...</span>
                </div>
              ) : (
                <select
                  {...register('test_id')}
                  className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  <option value="">Select a test...</option>
                  {labTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.test_name} ({test.category})
                    </option>
                  ))}
                </select>
              )}
              {errors.test_id && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.test_id.message}</p>
              )}
            </div>

            {/* Test Details */}
            {selectedTest && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Test Code</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTest.test_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTest.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sample Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTest.sample_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Turnaround Time</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTest.turnaround_time_hours} hours</p>
                  </div>
                </div>
                {selectedTest.requires_fasting && (
                  <div className="flex items-center gap-2 mt-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Fasting required</span>
                  </div>
                )}
                {selectedTest.special_instructions && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Special Instructions</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTest.special_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
            <FileText className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Order Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priority')}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              >
                {labTestPriorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clinical Notes
              </label>
              <textarea
                {...register('clinical_notes')}
                rows={4}
                placeholder="Enter any relevant clinical information..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/laboratory"
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? 'Creating Order...' : 'Create Lab Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
