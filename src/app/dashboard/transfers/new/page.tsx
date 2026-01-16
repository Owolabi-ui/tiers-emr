'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  transfersApi,
  CreateTransferRequest,
  TransferReason,
  transferReasonOptions,
} from '@/lib/transfers';
import { patientsApi, Patient } from '@/lib/patients';
import { clinicsApi, Clinic } from '@/lib/clinics';
import { pharmacyApi } from '@/lib/pharmacy';
import { laboratoryApi } from '@/lib/laboratory';
import { useToast } from '@/components/toast-provider';

export default function NewTransferPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMedicalInfo, setLoadingMedicalInfo] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<CreateTransferRequest>({
    patient_id: '',
    from_clinic_id: '',
    to_clinic_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    reason: 'Relocation',
    medical_summary: '',
    medications_list: '',
    lab_results_summary: '',
    continuity_of_care_notes: '',
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search term is empty, clear patients
    if (searchTerm.length === 0) {
      setPatients([]);
      setShowPatientSearch(false);
      return;
    }

    // If search term is too short, don't search
    if (searchTerm.length < 2) {
      return;
    }

    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchPatients();
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const fetchClinics = async () => {
    try {
      const response = await clinicsApi.getAll();
      setClinics(response.clinics);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const searchPatients = async () => {
    try {
      setSearching(true);
      const response = await patientsApi.search({ search: searchTerm });
      setPatients(response.data || []);
      setShowPatientSearch(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      showError('Failed to search patients');
      setPatients([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchPatientMedicalInfo = async (patientId: string) => {
    setLoadingMedicalInfo(true);
    try {
      // Fetch latest prescriptions and lab orders using proper APIs
      const [prescriptionsResult, labOrdersResult] = await Promise.allSettled([
        pharmacyApi.listPrescriptions({ patient_id: patientId, per_page: 10 }),
        laboratoryApi.getOrdersByPatient(patientId),
      ]);

      console.log('Prescriptions result:', prescriptionsResult);
      console.log('Lab orders result:', labOrdersResult);

      let medicalSummary = '';
      let medicationsList = '';
      let labResultsSummary = '';

      // Build medications list from prescriptions
      if (prescriptionsResult.status === 'fulfilled' && prescriptionsResult.value?.data?.length > 0) {
        const activeMeds = prescriptionsResult.value.data
          .filter((p: any) => p.status === 'Active' || p.status === 'Pending')
          .slice(0, 5);
        
        if (activeMeds.length > 0) {
          const meds = activeMeds
            .map((p: any) => {
              const dosageInfo = `${p.dosage} ${p.dosage_unit || ''}`;
              const frequencyInfo = p.frequency || 'As directed';
              return `${p.medication_name}\n   Dosage: ${dosageInfo}\n   Frequency: ${frequencyInfo}`;
            })
            .join('\n\n');
          medicationsList = `📋 CURRENT MEDICATIONS (${activeMeds.length} active)\n${'─'.repeat(50)}\n\n${meds}`;
        } else {
          medicationsList = '📋 No active medications currently prescribed.';
        }
      } else {
        medicationsList = '📋 No prescription records found in the system for this patient.';
      }

      // Build lab results summary from completed lab orders
      if (labOrdersResult.status === 'fulfilled' && labOrdersResult.value?.length > 0) {
        const completedLabs = labOrdersResult.value
          .filter((l: any) => 
            l.status === 'Completed' || 
            l.status === 'Reviewed' || 
            l.status === 'Communicated'
          )
          .slice(0, 10);
        
        if (completedLabs.length > 0) {
          const labs = completedLabs
            .map((l: any) => {
              const date = new Date(l.ordered_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              const testName = l.test_info?.test_name || l.test_info?.test_code || 'Unknown Test';
              const result = l.result_value ? `${l.result_value}${l.result_unit ? ' ' + l.result_unit : ''}` : 'Result on file';
              const interpretation = l.result_interpretation ? ` [${l.result_interpretation}]` : '';
              return `${testName}\n   Result: ${result}${interpretation}\n   Date: ${date}`;
            })
            .join('\n\n');
          labResultsSummary = `🧪 RECENT LAB RESULTS (${completedLabs.length} completed)\n${'─'.repeat(50)}\n\n${labs}`;
        } else {
          const pendingCount = labOrdersResult.value.filter((l: any) => 
            l.status === 'Ordered' || 
            l.status === 'Sample Collected' || 
            l.status === 'In Progress'
          ).length;
          labResultsSummary = pendingCount > 0 
            ? `🧪 Lab orders pending (${pendingCount} tests in progress)`
            : '🧪 No completed lab results available yet.';
        }
      } else {
        labResultsSummary = '🧪 No laboratory test records found in the system for this patient.';
      }

      // Set medical summary based on available data
      const hasMedications = prescriptionsResult.status === 'fulfilled' && 
        prescriptionsResult.value?.data?.length > 0;
      const hasLabs = labOrdersResult.status === 'fulfilled' && 
        labOrdersResult.value?.length > 0;

      if (hasMedications || hasLabs) {
        medicalSummary = 'Medical records found and auto-populated below. Please review and update current clinical status before transfer.';
      } else {
        medicalSummary = 'No medical records found. Please add relevant clinical information for continuity of care.';
      }

      // Update form with fetched data
      setFormData(prev => ({
        ...prev,
        medical_summary: medicalSummary,
        medications_list: medicationsList,
        lab_results_summary: labResultsSummary,
      }));

      // Show appropriate notifications
      if (!hasMedications && !hasLabs) {
        showWarning('No medication or lab history found. Please add medical information manually if available.');
      }
    } catch (error) {
      console.error('Error fetching medical info:', error);
      // Set default message on error
      setFormData(prev => ({
        ...prev,
        medical_summary: 'Unable to load medical records. Please add relevant information manually.',
        medications_list: 'Unable to load prescription history.',
        lab_results_summary: 'Unable to load laboratory history.',
      }));
    } finally {
      setLoadingMedicalInfo(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    // Auto-set the from_clinic_id if patient has a current clinic
    const updatedFormData = {
      ...formData,
      patient_id: patient.id,
      from_clinic_id: patient.current_clinic_id || formData.from_clinic_id,
    };
    setFormData(updatedFormData);
    setShowPatientSearch(false);
    setSearchTerm('');
    
    // Show info if patient has no clinic assigned
    if (!patient.current_clinic_id) {
      showWarning('This patient has no clinic assigned. Please select the source clinic manually.');
    }
    
    // Auto-fill medical information from patient records
    fetchPatientMedicalInfo(patient.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id) {
      showError('Please select a patient');
      return;
    }

    if (!formData.from_clinic_id || !formData.to_clinic_id) {
      showError('Please select both source and destination clinics');
      return;
    }

    if (formData.from_clinic_id === formData.to_clinic_id) {
      showError('Source and destination clinics must be different');
      return;
    }

    try {
      setLoading(true);
      const transfer = await transfersApi.create(formData);
      showSuccess('Transfer request created successfully!');
      router.push(`/dashboard/transfers/${transfer.id}`);
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      showError(error.response?.data?.error || 'Failed to create transfer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/transfers"
          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 mb-4 inline-block"
        >
          ← Back to Transfers
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          New Transfer Request
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create a new patient transfer between clinics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Patient Information
          </h2>

          {selectedPatient ? (
            <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedPatient.first_name} {selectedPatient.middle_name}{' '}
                    {selectedPatient.last_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Hospital Number: {selectedPatient.hospital_no}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    DOB: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setFormData({ ...formData, patient_id: '' });
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder={searching ? "Searching..." : "Search patient by name or hospital number..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowPatientSearch(true)}
                disabled={searching}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
              {showPatientSearch && searchTerm.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      Searching...
                    </div>
                  ) : patients.length > 0 ? (
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {patient.first_name} {patient.middle_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {patient.hospital_no} • {patient.gender} •{' '}
                          {new Date(patient.date_of_birth).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      No patients found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Details */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Transfer Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Clinic <span className="text-red-500">*</span>
                {selectedPatient?.current_clinic_id && formData.from_clinic_id === selectedPatient.current_clinic_id ? (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Patient's current clinic)</span>
                ) : selectedPatient && !selectedPatient.current_clinic_id ? (
                  <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Please select manually)</span>
                ) : null}
              </label>
              <select
                required
                value={formData.from_clinic_id}
                onChange={(e) =>
                  setFormData({ ...formData, from_clinic_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select source clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Clinic <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.to_clinic_id}
                onChange={(e) =>
                  setFormData({ ...formData, to_clinic_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select destination clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.transfer_date}
                onChange={(e) =>
                  setFormData({ ...formData, transfer_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Transfer <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value as TransferReason })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              >
                {transferReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Medical Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medical Summary
              </label>
              <textarea
                rows={4}
                value={formData.medical_summary}
                onChange={(e) =>
                  setFormData({ ...formData, medical_summary: e.target.value })
                }
                placeholder="Current diagnoses, treatment history, complications..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Medications
                {loadingMedicalInfo && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    Loading medications...
                  </span>
                )}
              </label>
              <textarea
                rows={6}
                value={formData.medications_list}
                onChange={(e) =>
                  setFormData({ ...formData, medications_list: e.target.value })
                }
                placeholder="List all current medications with dosages..."
                disabled={loadingMedicalInfo}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 font-mono text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lab Results Summary
                {loadingMedicalInfo && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    Loading lab results...
                  </span>
                )}
              </label>
              <textarea
                rows={8}
                value={formData.lab_results_summary}
                onChange={(e) =>
                  setFormData({ ...formData, lab_results_summary: e.target.value })
                }
                placeholder="Recent lab results, viral load, CD4 count..."
                disabled={loadingMedicalInfo}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 font-mono text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Continuity of Care Notes
              </label>
              <textarea
                rows={4}
                value={formData.continuity_of_care_notes}
                onChange={(e) =>
                  setFormData({ ...formData, continuity_of_care_notes: e.target.value })
                }
                placeholder="Important notes for continued care..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating Transfer...' : 'Create Transfer Request'}
          </button>
          <Link
            href="/dashboard/transfers"
            className="px-6 py-3 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
