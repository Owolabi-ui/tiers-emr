'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pepApi, type PepInformationWithPatient } from '@/lib/pep';
import { pharmacyApi, Prescription, getPrescriptionStatusColor } from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';
import PepPrescriptionForm from '@/components/pep/PepPrescriptionForm';
import {
  ArrowLeft,
  Shield,
  User,
  Calendar,
  Phone,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Pill,
} from 'lucide-react';

export default function PepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [pepInfo, setPepInfo] = useState<PepInformationWithPatient | null>(null);
  const [htsInitial, setHtsInitial] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pepApi.getById(id);
      
      // Ensure pep_information exists
      if (!response.pep_information) {
        setError('PEP information not found');
        return;
      }
      
      // Combine pep_information with patient fields from HTS initial record
      const combinedData: PepInformationWithPatient = {
        ...response.pep_information,
        patient_id: response.initial?.patient_id || '',
        patient_name: response.initial?.patient_name || '',
        patient_hospital_no: '', // HTS doesn't have hospital_no
        next_refill_date: null, // This comes from followups, not used here
      };
      setPepInfo(combinedData);
      
      // Store HTS initial data
      const htsData = response.initial || response.testing?.initial || null;
      setHtsInitial(htsData);
      
      // Fetch PEP prescriptions for this patient
      if (combinedData.patient_id) {
        const prescriptionsResponse = await pharmacyApi.listPrescriptions({
          patient_id: combinedData.patient_id,
        });
        // Filter for PEP prescriptions only
        const pepPrescriptions = prescriptionsResponse.data.filter(p => 
          p.diagnosis?.includes('PEP') || p.diagnosis?.includes('Post-Exposure Prophylaxis')
        );
        setPrescriptions(pepPrescriptions);
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

  const getUrgencyBadge = (duration: string) => {
    if (duration === '<24hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Critical (&lt;24hrs)
        </span>
      );
    }
    if (duration === '<48hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          <Clock className="h-3 w-3" />
          Urgent (&lt;48hrs)
        </span>
      );
    }
    if (duration === '<72hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3" />
          Time-Sensitive (&lt;72hrs)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {duration}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('ongoing')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Active
        </span>
      );
    }
    if (statusLower.includes('complete')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle2 className="h-4 w-4" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading PEP information...</p>
        </div>
      </div>
    );
  }

  if (error || !pepInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading PEP information
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error || 'PEP record not found'}
              </p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-medium"
              >
                ← Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg mt-1"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pepInfo.patient_name}
              </h1>
              {getStatusBadge(pepInfo.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Hospital No: {pepInfo.patient_hospital_no}</span>
              <span>•</span>
              <span className="font-mono">PEP No: {pepInfo.pep_no}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgency Alert */}
          {pepInfo.duration_before_pep === '<24hrs' && pepInfo.status.toLowerCase().includes('active') && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300">
                  <p className="font-medium">Critical Time Window</p>
                  <p className="mt-1">
                    This patient presented within 24 hours of exposure. Ensure PEP regimen is initiated immediately 
                    for maximum effectiveness.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Exposure Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#5b21b6]" />
              Exposure Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mode of Exposure</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {pepInfo.mode_of_exposure}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration Before PEP</p>
                <div className="mt-1">
                  {getUrgencyBadge(pepInfo.duration_before_pep)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">HIV Status at Exposure</p>
                <div className="mt-1">
                  {htsInitial?.final_result ? (
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      htsInitial.final_result === 'Reactive' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {htsInitial.final_result === 'Reactive' ? (
                        <><AlertTriangle className="h-4 w-4" /> Positive (Reactive)</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Negative (Non-reactive)</>
                      )}
                    </span>
                  ) : (
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {pepInfo.hiv_status_at_exposure}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    From HTS Record: {htsInitial?.client_code || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enrollment Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(pepInfo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Supporter Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#5b21b6]" />
              Treatment Supporter
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {pepInfo.pep_supporter}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Relationship</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {pepInfo.supporter_relationship}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {pepInfo.supporter_telephone}
                </p>
              </div>
            </div>
          </div>

          {/* Linked HTS Record */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#5b21b6]" />
              Linked HTS Record
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This PEP case is linked to an HTS testing record
                </p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-2">
                  HTS Record ID: {pepInfo.hts_initial_id}
                </p>
              </div>
              <Link
                href={`/dashboard/hts/${pepInfo.hts_initial_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                View HTS Record
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowPrescriptionForm(true)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5b21b6] hover:bg-[#4c1d95] rounded-lg"
              >
                <Pill className="h-4 w-4" />
                Prescribe Medication
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Information
              </button>
              <Link
                href={`/dashboard/hts/${pepInfo.hts_initial_id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <ExternalLink className="h-4 w-4" />
                View HTS Record
              </Link>
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
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
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
                      <ExternalLink className="h-4 w-4 text-gray-400" />
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    PEP Enrollment
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(pepInfo.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Patient enrolled in PEP program
                  </p>
                </div>
              </div>

              {pepInfo.updated_at !== pepInfo.created_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Information Updated
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(pepInfo.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PEP Information */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800 dark:text-purple-300">
                <p className="font-medium">PEP Treatment Window</p>
                <p className="mt-1">
                  PEP is most effective when started within 72 hours of exposure. 
                  Monitor adherence and schedule follow-up testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <PepPrescriptionForm
          pepInformationId={pepInfo.id}
          patientId={pepInfo.patient_id}
          onSuccess={() => {
            setShowPrescriptionForm(false);
            // Refetch data to update prescription list
            fetchData();
          }}
          onCancel={() => setShowPrescriptionForm(false)}
        />
      )}
    </div>
  );
}
