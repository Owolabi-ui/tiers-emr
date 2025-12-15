'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pill, Trash2, Search } from 'lucide-react';
import { pepApi } from '@/lib/pep';
import { pharmacyApi, DrugCatalog } from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';

interface PepPrescriptionFormProps {
  pepInformationId: string; // pep_information.id
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface MedicationItem {
  drug_id: number | null;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  quantity_prescribed: number;
}

export default function PepPrescriptionForm({
  pepInformationId,
  patientId,
  onSuccess,
  onCancel,
}: PepPrescriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drugs, setDrugs] = useState<DrugCatalog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    prescription_date: new Date().toISOString().split('T')[0],
    next_refill_date: '',
    prescriber_notes: '',
  });

  // PEP standard regimen: 28 days of ARV therapy
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      drug_id: null,
      drug_name: 'Tenofovir/Emtricitabine/Dolutegravir (TDF/FTC/DTG)',
      dosage: '300/200/50mg',
      frequency: 'Once Daily',
      duration_days: 28,
      quantity_prescribed: 28,
    },
  ]);

  // Fetch available drugs from pharmacy
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const response = await pharmacyApi.getDrugs({ active_only: true });
        setDrugs(response.drugs);
      } catch (err) {
        console.error('Failed to fetch drug catalog:', err);
      }
    };
    fetchDrugs();
  }, []);

  // Auto-calculate next refill date (28 days for PEP)
  useEffect(() => {
    if (formData.prescription_date) {
      const prescriptionDate = new Date(formData.prescription_date);
      prescriptionDate.setDate(prescriptionDate.getDate() + 28);
      setFormData(prev => ({ ...prev, next_refill_date: prescriptionDate.toISOString().split('T')[0] }));
    }
  }, [formData.prescription_date]);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        drug_id: null,
        drug_name: '',
        dosage: '',
        frequency: 'Once Daily',
        duration_days: 28,
        quantity_prescribed: 28,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string | number) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate tablets per day based on frequency
    const getTabletsPerDay = (frequency: string): number => {
      switch (frequency) {
        case 'Once Daily': return 1;
        case 'Twice Daily': return 2;
        case 'Three Times Daily': return 3;
        default: return 1;
      }
    };
    
    const tabletsPerDay = getTabletsPerDay(updated[index].frequency);
    
    // Auto-calculate quantity based on duration and frequency
    if (field === 'duration_days' || field === 'frequency') {
      const days = updated[index].duration_days || 0;
      updated[index].quantity_prescribed = Math.ceil(days * tabletsPerDay);
    }
    
    // Auto-calculate duration based on quantity and frequency
    if (field === 'quantity_prescribed') {
      const quantity = typeof value === 'number' ? value : parseInt(value) || 0;
      updated[index].duration_days = Math.ceil(quantity / tabletsPerDay);
    }
    
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.prescription_date) {
        throw new Error('Prescription date is required');
      }

      if (medications.some(m => !m.drug_name || !m.dosage)) {
        throw new Error('All medications must have drug name and dosage');
      }

      if (medications.some(m => !m.drug_id)) {
        throw new Error('Please select medications from the pharmacy inventory');
      }

      // Create prescription via pharmacy API
      const clinicalNotes = `PEP Prescription (28-day regimen)
PEP Information ID: ${pepInformationId}
${formData.prescriber_notes ? '\nNotes: ' + formData.prescriber_notes : ''}`;
      
      await pharmacyApi.createPrescription({
        patient_id: patientId,
        diagnosis: 'Post-Exposure Prophylaxis (PEP)',
        clinical_notes: clinicalNotes,
        items: medications.map(m => ({
          drug_id: m.drug_id!,
          quantity_prescribed: m.quantity_prescribed,
          dosage: m.dosage,
          frequency: m.frequency as any,
          duration_days: m.duration_days,
          instructions: `Complete 28-day course. Next refill: ${formData.next_refill_date || 'TBD'}`,
        })),
      });

      // Create a followup record to track next refill date
      if (formData.next_refill_date) {
        try {
          // First, get the commencement record to get the commencement ID
          const pepData = await pepApi.getById(pepInformationId);
          if (pepData.commencement) {
            await pepApi.createFollowup(pepData.commencement.id, {
              pep_commencement_id: pepData.commencement.id,
              followup_date: new Date().toISOString().split('T')[0],
              followup_type: 'Unscheduled',
              next_refill_date: formData.next_refill_date,
              adherence_level: 'Good',
              missed_doses: 0,
              side_effects: null,
              clinical_notes: `Prescription created for 28-day PEP regimen. Next refill: ${formData.next_refill_date}`,
              iit_status: false,
              ltfu_status: false,
            });
          }
        } catch (followupErr) {
          console.error('Failed to create followup record:', followupErr);
          // Don't fail the whole operation if this fails
        }
      }

      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Pill className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add PEP Prescription</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prescribe medications for Post-Exposure Prophylaxis (28-day regimen)</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* PEP Info Alert */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>PEP Treatment Duration:</strong> Standard PEP regimen is 28 days of antiretroviral therapy. Ensure patient adherence counseling is provided.
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prescription_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prescription Date *
              </label>
              <input
                type="date"
                id="prescription_date"
                value={formData.prescription_date}
                onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="next_refill_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next Refill Date (Auto-calculated)
              </label>
              <input
                type="date"
                id="next_refill_date"
                value={formData.next_refill_date}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medications</h3>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </button>
            </div>

            {medications.map((med, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Medication {index + 1}</h4>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Drug Name * <span className="text-xs text-gray-500 dark:text-gray-400">(from pharmacy inventory)</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={activeSearchIndex === index ? searchTerm : med.drug_name}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setActiveSearchIndex(index);
                          updateMedication(index, 'drug_name', e.target.value);
                        }}
                        onFocus={() => setActiveSearchIndex(index)}
                        placeholder="Search from pharmacy inventory..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    
                    {/* Autocomplete dropdown */}
                    {activeSearchIndex === index && searchTerm.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {drugs
                          .filter(drug => 
                            drug.commodity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            drug.commodity_id.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((drug) => (
                            <button
                              key={drug.id}
                              type="button"
                              onClick={() => {
                                const updated = [...medications];
                                updated[index] = { 
                                  ...updated[index], 
                                  drug_id: drug.id,
                                  drug_name: drug.commodity_name 
                                };
                                setMedications(updated);
                                setSearchTerm('');
                                setActiveSearchIndex(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="font-medium text-sm text-gray-900 dark:text-white">{drug.commodity_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {drug.commodity_id} • {drug.pack_type}
                                {drug.quantity !== null && (
                                  <span className={drug.quantity > 10 ? 'text-green-600' : 'text-red-600'}>
                                    {' '}• Stock: {drug.quantity}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        {drugs.filter(drug => 
                          drug.commodity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          drug.commodity_id.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No drugs found. Type to search or add manually.
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
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="e.g., 300/200/50mg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="Once Daily">Once daily</option>
                      <option value="Twice Daily">Twice daily</option>
                      <option value="Three Times Daily">Three times daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={med.duration_days || ''}
                      onChange={(e) => updateMedication(index, 'duration_days', e.target.value ? parseInt(e.target.value) : 0)}
                      min="1"
                      max="28"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity Prescribed *
                    </label>
                    <input
                      type="number"
                      value={med.quantity_prescribed || ''}
                      onChange={(e) => updateMedication(index, 'quantity_prescribed', e.target.value ? parseInt(e.target.value) : 0)}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prescriber Notes */}
          <div>
            <label htmlFor="prescriber_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prescriber Notes
            </label>
            <textarea
              id="prescriber_notes"
              value={formData.prescriber_notes}
              onChange={(e) => setFormData({ ...formData, prescriber_notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or instructions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Prescription...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
