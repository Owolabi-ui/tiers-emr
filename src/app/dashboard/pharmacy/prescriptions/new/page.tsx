'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  pharmacyApi,
  CreatePrescriptionRequest,
  CreatePrescriptionItemRequest,
  DrugCatalog,
  frequencyOptions,
  Frequency,
} from '@/lib/pharmacy';
import { patientsApi, Patient } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
import {
  ArrowLeft,
  Pill,
  Plus,
  Trash2,
  Loader2,
  User,
  FileText,
  AlertCircle,
  Search,
} from 'lucide-react';

interface PrescriptionFormData {
  patient_id: string;
  diagnosis: string;
  clinical_notes: string;
  items: {
    drug_id: number;
    quantity_prescribed: number;
    dosage: string;
    frequency: Frequency;
    duration_days: number;
    instructions: string;
  }[];
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [drugsLoading, setDrugsLoading] = useState(true);
  const [drugs, setDrugs] = useState<DrugCatalog[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [drugSearches, setDrugSearches] = useState<{ [key: number]: string }>({});
  const [showDrugDropdowns, setShowDrugDropdowns] = useState<{ [key: number]: boolean }>({});

  const patientIdFromUrl = searchParams.get('patient_id');
  const source = searchParams.get('source');
  const sourceId = searchParams.get('source_id');

  const { register, control, handleSubmit, formState: { errors }, setValue, watch } = useForm<PrescriptionFormData>({
    defaultValues: {
      patient_id: patientIdFromUrl || '',
      diagnosis: source === 'ART' ? 'HIV/AIDS - On ART' : '',
      clinical_notes: '',
      items: [
        {
          drug_id: 0,
          quantity_prescribed: 30,
          dosage: '',
          frequency: 'Once Daily',
          duration_days: 30,
          instructions: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Calculate tablets per day based on frequency
  const getTabletsPerDay = (frequency: Frequency): number => {
    switch (frequency) {
      case 'Once Daily': return 1;
      case 'Twice Daily': return 2;
      case 'Three Times Daily': return 3;
      case 'Four Times Daily': return 4;
      case 'Every 4 Hours': return 6;
      case 'Every 6 Hours': return 4;
      case 'Every 8 Hours': return 3;
      case 'Every 12 Hours': return 2;
      default: return 1;
    }
  };

  // Auto-calculate quantity when duration or frequency changes
  const handleDurationOrFrequencyChange = (index: number, field: 'duration_days' | 'frequency', value: any) => {
    const currentItems = watch('items');
    const currentItem = currentItems[index];
    
    // Update the field first
    if (field === 'frequency') {
      setValue(`items.${index}.frequency`, value as Frequency);
    } else {
      setValue(`items.${index}.duration_days`, parseInt(value) || 0);
    }
    
    // Get updated values
    const frequency = field === 'frequency' ? value : currentItem.frequency;
    const days = field === 'duration_days' ? (parseInt(value) || 0) : currentItem.duration_days;
    
    const tabletsPerDay = getTabletsPerDay(frequency);
    
    // Auto-calculate quantity
    const calculatedQuantity = Math.ceil(days * tabletsPerDay);
    setValue(`items.${index}.quantity_prescribed`, calculatedQuantity);
  };

  // Auto-calculate duration when quantity changes
  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setValue(`items.${index}.quantity_prescribed`, quantity);
    
    const currentItems = watch('items');
    const currentItem = currentItems[index];
    const tabletsPerDay = getTabletsPerDay(currentItem.frequency);
    
    // Auto-calculate duration
    const calculatedDuration = Math.ceil(quantity / tabletsPerDay);
    setValue(`items.${index}.duration_days`, calculatedDuration);
  };

  // Filter drugs based on search
  const getFilteredDrugs = (index: number) => {
    const search = drugSearches[index] || '';
    if (!search) return drugs;
    
    return drugs.filter(drug => 
      drug.commodity_name.toLowerCase().includes(search.toLowerCase()) ||
      drug.commodity_type.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Handle drug selection
  const handleDrugSelect = (index: number, drug: DrugCatalog) => {
    setValue(`items.${index}.drug_id`, drug.id);
    setDrugSearches({ ...drugSearches, [index]: drug.commodity_name });
    setShowDrugDropdowns({ ...showDrugDropdowns, [index]: false });
  };

  useEffect(() => {
    fetchDrugs();
    if (patientIdFromUrl) {
      fetchPatient(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

  const fetchDrugs = async () => {
    try {
      setDrugsLoading(true);
      const response = await pharmacyApi.getDrugs({ active_only: true });
      setDrugs(response.drugs);
    } catch (error) {
      showError('Failed to Load Drugs', getErrorMessage(error));
    } finally {
      setDrugsLoading(false);
    }
  };

  const fetchPatient = async (patientId: string) => {
    try {
      setPatientLoading(true);
      const data = await patientsApi.getById(patientId);
      setPatient(data);
      setValue('patient_id', patientId);
    } catch (error) {
      showError('Failed to Load Patient', getErrorMessage(error));
    } finally {
      setPatientLoading(false);
    }
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    // Validate at least one item
    if (data.items.length === 0 || data.items.every(item => !item.drug_id)) {
      showError('No Medications', 'Please add at least one medication to prescribe');
      return;
    }

    // Filter out empty items
    const validItems = data.items.filter(item => item.drug_id > 0);

    if (validItems.length === 0) {
      showError('No Medications', 'Please select medications to prescribe');
      return;
    }

    try {
      setLoading(true);

      const prescriptionData: CreatePrescriptionRequest = {
        patient_id: data.patient_id,
        diagnosis: data.diagnosis || undefined,
        clinical_notes: data.clinical_notes || undefined,
        items: validItems.map(item => ({
          drug_id: item.drug_id,
          quantity_prescribed: item.quantity_prescribed,
          dosage: item.dosage,
          frequency: item.frequency,
          duration_days: item.duration_days,
          instructions: item.instructions || undefined,
        })),
      };

      const prescription = await pharmacyApi.createPrescription(prescriptionData);
      showSuccess('Prescription Created', `Prescription ${prescription.prescription_number} created successfully`);
      
      // Redirect based on source
      if (source === 'ART' && sourceId) {
        router.push(`/dashboard/art/${sourceId}`);
      } else {
        router.push(`/dashboard/pharmacy/prescriptions/${prescription.id}`);
      }
    } catch (error) {
      showError('Prescription Failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg mt-1"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            New Prescription
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {source === 'ART' && 'Create ART medication prescription'}
            {!source && 'Create a new prescription for a patient'}
          </p>
        </div>
      </div>

      {/* Patient Info */}
      {patient && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {patient.first_name} {patient.last_name}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Hospital No: {patient.hospital_no} • Age: {patient.age} • Gender: {patient.gender}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Clinical Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#5b21b6]" />
            Clinical Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diagnosis
              </label>
              <input
                {...register('diagnosis')}
                type="text"
                placeholder="e.g., HIV/AIDS - On ART"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clinical Notes
              </label>
              <textarea
                {...register('clinical_notes')}
                rows={3}
                placeholder="Additional clinical information, notes, or special instructions..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-[#5b21b6]" />
              Medications
            </h2>
            <button
              type="button"
              onClick={() =>
                append({
                  drug_id: 0,
                  quantity_prescribed: 30,
                  dosage: '',
                  frequency: 'Once Daily',
                  duration_days: 30,
                  instructions: '',
                })
              }
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#5b21b6] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </button>
          </div>

          {drugsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#5b21b6]" />
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Medication {index + 1}
                    </p>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Drug * <span className="text-xs text-gray-500">(Type to search)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={drugSearches[index] || ''}
                          onChange={(e) => {
                            setDrugSearches({ ...drugSearches, [index]: e.target.value });
                            setShowDrugDropdowns({ ...showDrugDropdowns, [index]: true });
                          }}
                          onFocus={() => setShowDrugDropdowns({ ...showDrugDropdowns, [index]: true })}
                          placeholder="Search for a drug..."
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Hidden input for form validation */}
                      <input
                        type="hidden"
                        {...register(`items.${index}.drug_id` as const, {
                          required: true,
                          valueAsNumber: true,
                        })}
                      />
                      
                      {/* Dropdown */}
                      {showDrugDropdowns[index] && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {getFilteredDrugs(index).length > 0 ? (
                            getFilteredDrugs(index).map((drug) => (
                              <button
                                key={drug.id}
                                type="button"
                                onClick={() => handleDrugSelect(index, drug)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {drug.commodity_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {drug.pack_type} • {drug.commodity_type}
                                  {drug.quantity !== null && ` • Stock: ${drug.quantity}`}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              No drugs found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dosage *
                      </label>
                      <input
                        {...register(`items.${index}.dosage` as const, { required: true })}
                        type="text"
                        placeholder="e.g., 600mg"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequency *
                      </label>
                      <select
                        {...register(`items.${index}.frequency` as const, { required: true })}
                        onChange={(e) => handleDurationOrFrequencyChange(index, 'frequency', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      >
                        {frequencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (Days) * <span className="text-xs text-gray-500">(auto-calculated)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 30"
                        {...register(`items.${index}.duration_days` as const, {
                          required: true,
                          valueAsNumber: true,
                          min: 1,
                        })}
                        onChange={(e) => handleDurationOrFrequencyChange(index, 'duration_days', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity * <span className="text-xs text-gray-500">(auto-calculated)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 30"
                        {...register(`items.${index}.quantity_prescribed` as const, {
                          required: true,
                          valueAsNumber: true,
                          min: 1,
                        })}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Special Instructions
                      </label>
                      <input
                        {...register(`items.${index}.instructions` as const)}
                        type="text"
                        placeholder="e.g., Take with food"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || drugsLoading}
            className="flex-1 px-6 py-3 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Prescription...
              </span>
            ) : (
              'Create Prescription'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
