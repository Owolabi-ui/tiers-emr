'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  pharmacyApi, 
  DrugCatalog,
  Frequency,
  frequencyOptions,
  CreatePrescriptionItemRequest
} from '@/lib/pharmacy';
import { patientApi, Patient } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';

interface PrescriptionItemForm {
  drug_id: number;
  quantity_prescribed: number | '';
  dosage: string;
  frequency: Frequency;
  duration_days: number | '';
  instructions: string;
  drug?: DrugCatalog;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  
  // Form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drugs, setDrugs] = useState<DrugCatalog[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItemForm[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [drugSearch, setDrugSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading patients and drugs...');
      const [patientsData, drugsData] = await Promise.all([
        patientApi.getPatients({}),
        pharmacyApi.getDrugs({ active_only: true }),
      ]);
      
      console.log('Patients response:', patientsData);
      console.log('Drugs response:', drugsData);
      
      setPatients(patientsData.patients || patientsData.data || []);
      setDrugs(drugsData.drugs || []);
      
      console.log('Patients loaded:', (patientsData.patients || patientsData.data || []).length);
      console.log('Drugs loaded:', drugsData.drugs?.length || 0);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        drug_id: 0,
        quantity_prescribed: 1,
        dosage: '',
        frequency: 'Once Daily',
        duration_days: 7,
        instructions: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // If drug_id changed, update the drug object
    if (field === 'drug_id') {
      const drug = drugs.find(d => d.id === value);
      updated[index].drug = drug;
    }
    
    setItems(updated);
  };

  const validateForm = (): boolean => {
    if (!selectedPatientId) {
      setSubmitError('Please select a patient');
      return false;
    }

    if (items.length === 0) {
      setSubmitError('Please add at least one medication');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.drug_id || item.drug_id === 0) {
        setSubmitError(`Please select a drug for item ${i + 1}`);
        return false;
      }
      if (!item.dosage.trim()) {
        setSubmitError(`Please enter dosage for item ${i + 1}`);
        return false;
      }
      if (!item.quantity_prescribed || item.quantity_prescribed <= 0) {
        setSubmitError(`Please enter valid quantity for item ${i + 1}`);
        return false;
      }
      if (!item.duration_days || item.duration_days <= 0) {
        setSubmitError(`Please enter valid duration for item ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const prescriptionData = {
        patient_id: selectedPatientId,
        diagnosis: diagnosis.trim() || undefined,
        clinical_notes: clinicalNotes.trim() || undefined,
        items: items.map(({ drug_id, quantity_prescribed, dosage, frequency, duration_days, instructions }) => ({
          drug_id,
          quantity_prescribed: typeof quantity_prescribed === 'number' ? quantity_prescribed : parseInt(String(quantity_prescribed)) || 1,
          dosage,
          frequency,
          duration_days: typeof duration_days === 'number' ? duration_days : parseInt(String(duration_days)) || 1,
          instructions: instructions?.trim() || undefined,
        })),
      };

      const result = await pharmacyApi.createPrescription(prescriptionData);
      router.push(`/dashboard/pharmacy/${result.id}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/pharmacy');
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const search = patientSearch.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(search) ||
      p.last_name.toLowerCase().includes(search) ||
      (p.middle_name && p.middle_name.toLowerCase().includes(search)) ||
      p.hospital_no.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search)
    );
  });

  const availableDrugs = drugs.filter(d => {
    if (!drugSearch) return true;
    const search = drugSearch.toLowerCase();
    return (
      d.commodity_name.toLowerCase().includes(search) ||
      d.commodity_id.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b21b6] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading data</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={handleCancel}
            className="mb-4 text-[#5b21b6] hover:underline flex items-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pharmacy
          </button>
          <h1 className="text-2xl font-bold text-[#5b21b6]">New Prescription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create a new prescription for a patient
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        </div>
      )}

      {/* Patient Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Patient Information</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Patient
            </label>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {patientSearch && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">-- Select Patient --</option>
              {filteredPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.hospital_no})
                </option>
              ))}
            </select>
            {filteredPatients.length === 0 && patientSearch && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                No patients found matching "{patientSearch}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Clinical Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnosis
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clinical Notes
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter clinical notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Prescription Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Medications ({items.length})</h2>
          </div>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-[#5b21b6] text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Medication
          </button>
        </div>

        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-sm">No medications added yet</p>
              <p className="text-xs mt-1">Click "Add Medication" to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Medication {index + 1}</h3>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Drug *
                      </label>
                      <select
                        value={item.drug_id}
                        onChange={(e) => updateItem(index, 'drug_id', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value={0}>-- Select Drug --</option>
                        {availableDrugs.map((drug) => (
                          <option key={drug.id} value={drug.id}>
                            {drug.commodity_name} ({drug.commodity_id}) - Stock: {drug.quantity || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frequency *
                      </label>
                      <select
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value as Frequency)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        {frequencyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity_prescribed}
                        onChange={(e) => updateItem(index, 'quantity_prescribed', e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration (Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.duration_days}
                        onChange={(e) => updateItem(index, 'duration_days', e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  {item.drug && (item.drug.quantity || 0) < (typeof item.quantity_prescribed === 'number' ? item.quantity_prescribed : parseInt(String(item.quantity_prescribed)) || 0) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        ⚠️ Insufficient stock. Available: {item.drug.quantity || 0}, Required: {item.quantity_prescribed}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleCancel}
          disabled={submitting}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          className="px-6 py-3 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            'Create Prescription'
          )}
        </button>
      </div>
    </div>
  );
}
