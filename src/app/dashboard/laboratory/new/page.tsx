'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  test_ids: z.array(z.string().uuid()).min(1, 'Please select at least one lab test'),
  priority: z.enum(['Routine', 'Urgent', 'STAT']),
  clinical_notes: z.string().optional(),
});

type LabOrderFormData = z.infer<typeof labOrderFormSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewLabOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patient_id');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  // Lab test catalog
  const [labTests, setLabTests] = useState<LabTestCatalog[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(true);

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
      test_ids: [],
    },
  });

  const selectedTestIds = watch('test_ids');

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

  const selectedTests = labTests.filter((test) => selectedTestIds.includes(test.id));
  const groupedTests = labTests.reduce<Record<string, LabTestCatalog[]>>((acc, test) => {
    const category = test.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {});

  // Debounced patient search
  useEffect(() => {
    if (preselectedPatientId) return;

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
  }, [patientSearch, preselectedPatientId]);

  // Prefill patient from query parameter
  useEffect(() => {
    const prefillPatient = async () => {
      if (!preselectedPatientId || selectedPatient) return;
      try {
        setPrefillLoading(true);
        const patient = await patientsApi.getById(preselectedPatientId);
        setSelectedPatient(patient);
        setValue('patient_id', patient.id);
        setPatientSearch(`${patient.first_name} ${patient.last_name}`);
      } catch (err) {
        console.error('Failed to prefill laboratory patient:', err);
      } finally {
        setPrefillLoading(false);
      }
    };

    prefillPatient();
  }, [preselectedPatientId, selectedPatient, setValue]);

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

      await laboratoryApi.createBulkOrders({
        patient_id: data.patient_id,
        test_ids: data.test_ids,
        priority: data.priority as LabTestPriority,
        clinical_notes: data.clinical_notes || null,
      });

      router.push('/dashboard/laboratory');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleTestSelection = (testId: string) => {
    const next = selectedTestIds.includes(testId)
      ? selectedTestIds.filter((id) => id !== testId)
      : [...selectedTestIds, testId];
    setValue('test_ids', next, { shouldValidate: true });
  };

  const removeSelectedTest = (testId: string) => {
    setValue(
      'test_ids',
      selectedTestIds.filter((id) => id !== testId),
      { shouldValidate: true }
    );
  };

  const areAllTestsInCategorySelected = (tests: LabTestCatalog[]) =>
    tests.length > 0 && tests.every((test) => selectedTestIds.includes(test.id));

  const toggleCategorySelection = (tests: LabTestCatalog[]) => {
    const testIds = tests.map((test) => test.id);
    const allSelected = areAllTestsInCategorySelected(tests);
    const next = allSelected
      ? selectedTestIds.filter((id) => !testIds.includes(id))
      : Array.from(new Set([...selectedTestIds, ...testIds]));

    setValue('test_ids', next, { shouldValidate: true });
  };

  const clearAllSelectedTests = () => {
    setValue('test_ids', [], { shouldValidate: true });
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
            {preselectedPatientId && prefillLoading ? (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">Loading patient information...</p>
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
            {!selectedPatient ? (
              <>
                <input type="hidden" {...register('patient_id')} />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name or staff number..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    disabled={!!preselectedPatientId}
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
                <input type="hidden" {...register('patient_id')} />
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
                  disabled={!!preselectedPatientId}
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
                Select Test(s) <span className="text-red-500">*</span>
              </label>
              {labTestsLoading ? (
                <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading tests...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800">
                  {Object.entries(groupedTests).map(([category, tests]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {category}
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleCategorySelection(tests)}
                          className="text-xs font-medium text-[#5b21b6] hover:underline"
                        >
                          {areAllTestsInCategorySelected(tests) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {tests.map((test) => (
                          <label
                            key={test.id}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-white/70 dark:hover:bg-neutral-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTestIds.includes(test.id)}
                              onChange={() => toggleTestSelection(test.id)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#5b21b6] focus:ring-[#5b21b6]"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {test.test_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {test.test_code} | {test.sample_type} | TAT {test.turnaround_time_hours}h
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.test_ids && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.test_ids.message}</p>
              )}
            </div>

            {selectedTests.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Selected Tests ({selectedTests.length})
                  </p>
                  <button
                    type="button"
                    onClick={clearAllSelectedTests}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start justify-between gap-2 px-3 py-2 rounded-md text-xs font-medium bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-700 text-gray-800 dark:text-gray-200"
                    >
                      <div>
                        <p>
                          {test.test_name}
                          {test.requires_fasting && (
                            <span className="text-orange-500 ml-1">(Fasting)</span>
                          )}
                        </p>
                        {test.special_instructions && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {test.special_instructions}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedTest(test.id)}
                        className="text-gray-500 hover:text-red-600 mt-0.5"
                        aria-label={`Remove ${test.test_name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
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
            {loading ? 'Creating Orders...' : 'Create Lab Orders'}
          </button>
        </div>
      </form>
    </div>
  );
}
