'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { prepApi, CompletePrepWorkflowResponse } from '@/lib/prep';
import { pharmacyApi, Prescription, getPrescriptionStatusColor } from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';
import PrepPrescriptionForm from '@/components/prep/PrepPrescriptionForm';
import PrepFollowupForm from '@/components/prep/PrepFollowupForm';
import PrepStatusChangeForm from '@/components/prep/PrepStatusChangeForm';
import {
  ChevronLeft,
  Shield,
  Loader2,
  AlertCircle,
  Calendar,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function PrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CompletePrepWorkflowResponse | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prepApi.getById(id);
      setData(response);
      
      // Fetch PrEP prescriptions for this patient
      if (response.initial?.patient_id) {
        const prescriptionsResponse = await pharmacyApi.listPrescriptions({
          patient_id: response.initial.patient_id as string,
        });
        // Filter for PrEP prescriptions only
        const prepPrescriptions = prescriptionsResponse.data.filter(p => 
          p.diagnosis?.includes('PrEP') || p.diagnosis?.includes('Pre-Exposure Prophylaxis')
        );
        setPrescriptions(prepPrescriptions);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleFormSuccess = () => {
    setShowPrescriptionForm(false);
    setShowFollowupForm(false);
    setShowStatusForm(false);
    fetchData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading PrEP details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading PrEP details</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error || 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">No data available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { prep_commencement: commencement, prep_prescription: prescription, prep_followup: followups } = data;
  const patientName = data.patient_name || 'PrEP Patient';
  const hospitalNo = data.patient_hospital_no || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to PrEP Management
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#5b21b6]/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#5b21b6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {patientName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hospital No: {hospitalNo}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                commencement?.status?.toLowerCase().includes('active')
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {commencement?.status?.toLowerCase().includes('active') && <CheckCircle2 className="h-4 w-4" />}
                {commencement?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* HIV Test Result from HTS */}
            {data.initial && data.testing && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Baseline HIV Test</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">HIV Status (From HTS Record)</p>
                    <div className="mt-1">
                      {data.testing.final_result ? (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          data.testing.final_result === 'Reactive' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {data.testing.final_result === 'Reactive' ? (
                            <><AlertTriangle className="h-4 w-4" /> Positive (Reactive)</>
                          ) : (
                            <><CheckCircle2 className="h-4 w-4" /> Negative (Non-reactive)</>
                          )}
                        </span>
                      ) : (
                        <p className="text-base font-medium text-gray-900 dark:text-white">Not Available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">HTS Client Code</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {(data.initial.client_code as string) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date of Test</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {data.initial.date_of_visit ? new Date(data.initial.date_of_visit as string).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  PrEP is only prescribed to HIV-negative individuals. This baseline test confirms eligibility.
                </p>
              </div>
            )}

            {/* Commencement Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">PrEP Commencement</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Initial Adherence Counseling</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {commencement?.date_initial_adherence_counseling 
                      ? new Date(commencement.date_initial_adherence_counseling).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                
                {commencement?.date_prep_initiated && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PrEP Initiated</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(commencement.date_prep_initiated).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {commencement?.prep_type_at_start && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PrEP Type</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {commencement.prep_type_at_start}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Drug Allergies</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {commencement?.history_of_drug_allergies ? 'Yes' : 'No'}
                  </p>
                  {commencement?.allergy_details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{commencement.allergy_details}</p>
                  )}
                </div>
              </div>

              {commencement?.transferred_in && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Transfer Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commencement.transferred_from_facility && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">From Facility</p>
                        <p className="text-base text-gray-900 dark:text-white mt-1">
                          {commencement.transferred_from_facility}
                        </p>
                      </div>
                    )}
                    {commencement.previous_enrollment_id && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Previous ID</p>
                        <p className="text-base text-gray-900 dark:text-white mt-1">
                          {commencement.previous_enrollment_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prescription */}
            {prescription && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Current Prescription
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prescription.prescription.status === 'Dispensed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {prescription.prescription.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Prescribed</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(prescription.prescription.date_prescribed).toLocaleDateString()}
                      </p>
                    </div>
                    {prescription.prescription.dispensed_at && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Dispensed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(prescription.prescription.dispensed_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prescription Items */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Medications</p>
                    <div className="space-y-2">
                      {prescription.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-neutral-900 rounded p-3">
                          <p className="font-medium text-gray-900 dark:text-white">{item.drug_name}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {item.dosage && (
                              <div>
                                <span className="text-gray-500">Dosage:</span> {item.dosage}
                              </div>
                            )}
                            {item.frequency && (
                              <div>
                                <span className="text-gray-500">Frequency:</span> {item.frequency}
                              </div>
                            )}
                            {item.duration_days && (
                              <div>
                                <span className="text-gray-500">Duration:</span> {item.duration_days} days
                              </div>
                            )}
                            {item.quantity && (
                              <div>
                                <span className="text-gray-500">Quantity:</span> {item.quantity}
                              </div>
                            )}
                          </div>
                          {item.instructions && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              <span className="text-gray-500">Instructions:</span> {item.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Follow-ups */}
            {followups && followups.length > 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Follow-up Schedule
                </h2>

                <div className="space-y-3">
                  {followups.map((followup) => (
                    <div
                      key={followup.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {followup.next_refill_date && (
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(followup.next_refill_date).toLocaleDateString()}
                              </p>
                              {followup.days_until_refill !== null && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({followup.days_until_refill > 0 ? `in ${followup.days_until_refill} days` : `${Math.abs(followup.days_until_refill)} days overdue`})
                                </span>
                              )}
                            </div>
                          )}
                          {followup.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{followup.notes}</p>
                          )}
                        </div>
                        <div>
                          {followup.refill_completed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          ) : followup.status === 'Overdue' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Clock className="h-3 w-3" />
                              {followup.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setShowPrescriptionForm(true)}
                >
                  <Pill className="h-4 w-4" />
                  Add Prescription
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setShowFollowupForm(true)}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Follow-up
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setShowStatusForm(true)}
                >
                  <ArrowRight className="h-4 w-4" />
                  Change Status
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  onClick={() => commencement?.hts_initial_id && router.push(`/dashboard/hts/${commencement.hts_initial_id}`)}
                >
                  View HTS Record
                </button>
              </div>
            </div>

            {/* Prescription History */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Prescription History</h3>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No prescriptions yet</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/pharmacy/${prescription.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {prescription.prescription_number}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPrescriptionStatusColor(prescription.status)}`}>
                              {prescription.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(prescription.prescribed_at).toLocaleDateString()} • {prescription.items.length} item(s)
                          </p>
                          {prescription.prescribed_by_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Prescribed by: {prescription.prescribed_by_name}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      {prescription.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Medications:</p>
                          <ul className="mt-1 space-y-1">
                            {prescription.items.map((item, idx) => (
                              <li key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                                • {item.drug_info.commodity_name} - {item.dosage} ({item.frequency}) x {item.duration_days} days
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-[#5b21b6]"></div>
                    <div className="w-px h-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enrolled in PrEP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {commencement?.created_at 
                        ? new Date(commencement.created_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {commencement?.date_prep_initiated && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">PrEP Initiated</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(commencement.date_prep_initiated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {prescription && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Prescription Added</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(prescription.prescription.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Modals */}
        {showPrescriptionForm && commencement && data.initial && (
          <PrepPrescriptionForm 
            commencementId={commencement.hts_initial_id}
            prepCommencementId={commencement.id}
            patientId={data.initial.patient_id as string}
            prepType={commencement.prep_type_at_start}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowPrescriptionForm(false)}
          />
        )}

        {showFollowupForm && commencement && (
          <PrepFollowupForm
            commencementId={commencement.id}
            patientName={patientName}
            lastVisitDate={followups && followups.length > 0 
              ? followups[followups.length - 1].created_at 
              : commencement.date_prep_initiated
            }
            onSuccess={handleFormSuccess}
            onCancel={() => setShowFollowupForm(false)}
          />
        )}

        {showStatusForm && commencement && (
          <PrepStatusChangeForm
            commencementId={commencement.id}
            patientName={patientName}
            currentStatus={commencement.status}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowStatusForm(false)}
          />
        )}
      </div>
    </div>
  );
}
