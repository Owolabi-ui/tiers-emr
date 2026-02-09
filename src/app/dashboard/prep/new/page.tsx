'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prepApi, CreatePrepCommencementRequest, PrepType } from '@/lib/prep';
import { HtsInitialResponse } from '@/lib/hts';
import { getErrorMessage } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Shield,
  FileText,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Select HTS Record', description: 'Choose the HTS test record for this patient' },
  { id: 2, name: 'PrEP Commencement', description: 'Document PrEP initiation and baseline counseling' },
];

export default function NewPrepPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: HTS record selection
  const [htsRecords, setHtsRecords] = useState<HtsInitialResponse[]>([]);
  const [selectedHtsId, setSelectedHtsId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingHts, setLoadingHts] = useState(true);

  // Step 2: PrEP commencement form
  const [formData, setFormData] = useState<CreatePrepCommencementRequest>({
    date_initial_adherence_counseling: new Date().toISOString().split('T')[0],
    date_prep_initiated: null,
    prep_type_at_start: null,
    history_of_drug_allergies: false,
    allergy_details: null,
    transferred_in: false,
    previous_enrollment_id: null,
    transferred_from_facility: null,
  });

  // Load eligible HTS records
  useEffect(() => {
    const fetchHtsRecords = async () => {
      try {
        setLoadingHts(true);
        const records = await prepApi.getEligibleHtsRecords();
        setHtsRecords(records);
      } catch (err) {
        console.error('Error loading HTS records:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoadingHts(false);
      }
    };

    fetchHtsRecords();
  }, []);

  const filteredHtsRecords = htsRecords.filter((record) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.patient_name?.toLowerCase().includes(search) ||
      record.client_code.toLowerCase().includes(search)
    );
  });

  const handleNext = () => {
    if (currentStep === 1 && !selectedHtsId) {
      setError('Please select an HTS record to continue');
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHtsId) {
      setError('No HTS record selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await prepApi.createCommencement(selectedHtsId, formData);
      router.push(`/dashboard/prep/${selectedHtsId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">PrEP requires prior HTS testing</p>
                  <p>Select an HTS record below to enroll the patient in PrEP. Only HTS records that are not already enrolled in PrEP are shown.</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or client code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
              />
            </div>

            {/* HTS Records List */}
            {loadingHts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
              </div>
            ) : filteredHtsRecords.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No HTS records found matching your search.' : 'No eligible HTS records found.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Patients must complete HTS testing before enrolling in PrEP.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHtsRecords.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedHtsId(record.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedHtsId === record.id
                        ? 'border-[#5b21b6] bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {record.patient_name || 'Unknown Patient'}
                          </h3>
                          {selectedHtsId === record.id && (
                            <CheckCircle2 className="h-5 w-5 text-[#5b21b6]" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Client Code: </span>
                            <span className="text-gray-900 font-medium">{record.client_code}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Target Group: </span>
                            <span className="text-gray-900">{record.target_group_code}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Visit Date: </span>
                            <span className="text-gray-900">
                              {new Date(record.date_of_visit).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status: </span>
                            <span className="text-gray-900">{record.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Counseling Date */}
            <div>
              <label htmlFor="date_initial_adherence_counseling" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Initial Adherence Counseling <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date_initial_adherence_counseling"
                required
                value={formData.date_initial_adherence_counseling}
                onChange={(e) => setFormData({ ...formData, date_initial_adherence_counseling: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
              />
            </div>

            {/* PrEP Initiation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_prep_initiated" className="block text-sm font-medium text-gray-700 mb-2">
                  Date PrEP Initiated
                </label>
                <input
                  type="date"
                  id="date_prep_initiated"
                  value={formData.date_prep_initiated || ''}
                  onChange={(e) => setFormData({ ...formData, date_prep_initiated: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                />
              </div>

              <div>
                <label htmlFor="prep_type_at_start" className="block text-sm font-medium text-gray-700 mb-2">
                  PrEP Type at Start
                </label>
                <select
                  id="prep_type_at_start"
                  value={formData.prep_type_at_start || ''}
                  onChange={(e) => setFormData({ ...formData, prep_type_at_start: (e.target.value as PrepType) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                >
                  <option value="">Select PrEP type...</option>
                  <option value="ED PrEP">ED PrEP</option>
                  <option value="Injectable / CAB-LA">Injectable / CAB-LA</option>
                  <option value="ORAL">Oral</option>
                  <option value="RING">Ring</option>
                </select>
              </div>
            </div>

            {/* Drug Allergies */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="history_of_drug_allergies"
                  checked={formData.history_of_drug_allergies}
                  onChange={(e) => setFormData({ ...formData, history_of_drug_allergies: e.target.checked })}
                  className="h-4 w-4 text-[#5b21b6] focus:ring-[#5b21b6] border-gray-300 rounded"
                />
                <label htmlFor="history_of_drug_allergies" className="ml-3 text-sm text-gray-700">
                  Patient has history of drug allergies
                </label>
              </div>

              {formData.history_of_drug_allergies && (
                <div>
                  <label htmlFor="allergy_details" className="block text-sm font-medium text-gray-700 mb-2">
                    Allergy Details
                  </label>
                  <textarea
                    id="allergy_details"
                    rows={3}
                    value={formData.allergy_details || ''}
                    onChange={(e) => setFormData({ ...formData, allergy_details: e.target.value || null })}
                    placeholder="Describe the drug allergies..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                  />
                </div>
              )}
            </div>

            {/* Transfer Information */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="transferred_in"
                  checked={formData.transferred_in}
                  onChange={(e) => setFormData({ ...formData, transferred_in: e.target.checked })}
                  className="h-4 w-4 text-[#5b21b6] focus:ring-[#5b21b6] border-gray-300 rounded"
                />
                <label htmlFor="transferred_in" className="ml-3 text-sm text-gray-700">
                  Patient transferred in from another facility
                </label>
              </div>

              {formData.transferred_in && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                  <div>
                    <label htmlFor="previous_enrollment_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Enrollment ID
                    </label>
                    <input
                      type="text"
                      id="previous_enrollment_id"
                      value={formData.previous_enrollment_id || ''}
                      onChange={(e) => setFormData({ ...formData, previous_enrollment_id: e.target.value || null })}
                      placeholder="Enter previous ID..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                    />
                  </div>

                  <div>
                    <label htmlFor="transferred_from_facility" className="block text-sm font-medium text-gray-700 mb-2">
                      Transferred From Facility
                    </label>
                    <input
                      type="text"
                      id="transferred_from_facility"
                      value={formData.transferred_from_facility || ''}
                      onChange={(e) => setFormData({ ...formData, transferred_from_facility: e.target.value || null })}
                      placeholder="Enter facility name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#5b21b6] hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Complete Enrollment
                  </>
                )}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 p-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to PrEP Management
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#5b21b6]/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#5b21b6]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New PrEP Enrollment</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enroll a patient in Pre-Exposure Prophylaxis program
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                  {currentStep > step.id ? (
                    <>
                      {stepIdx !== STEPS.length - 1 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-[#5b21b6]" />
                        </div>
                      )}
                      <div className="relative flex items-center justify-center w-10 h-10 bg-[#5b21b6] rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : currentStep === step.id ? (
                    <>
                      {stepIdx !== STEPS.length - 1 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                      )}
                      <div className="relative flex items-center justify-center w-10 h-10 bg-white border-2 border-[#5b21b6] rounded-full">
                        <span className="text-[#5b21b6] font-semibold">{step.id}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {stepIdx !== STEPS.length - 1 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                      )}
                      <div className="relative flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-full">
                        <span className="text-gray-500">{step.id}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep === 1 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedHtsId}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#5b21b6] hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={handlePrevious}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6]"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
