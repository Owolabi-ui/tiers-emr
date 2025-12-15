'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  pharmacyApi, 
  Prescription,
  getPrescriptionStatusColor,
  formatPrescriptionNumber,
  frequencyOptions
} from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params?.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prescriptionId) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyApi.getPrescription(prescriptionId);
      setPrescription(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = () => {
    router.push(`/dashboard/pharmacy/dispense/${prescriptionId}`);
  };

  const handleBack = () => {
    router.push('/dashboard/pharmacy');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b21b6] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading prescription...</p>
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
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading prescription</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <div className="mt-3 space-x-3">
                <button
                  onClick={loadPrescription}
                  className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  Try again
                </button>
                <button
                  onClick={handleBack}
                  className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  Back to Pharmacy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return null;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="mb-4 text-[#5b21b6] hover:underline flex items-center text-sm"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pharmacy
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#5b21b6]">
              {formatPrescriptionNumber(prescription.prescription_number)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Prescription Details
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#5b21b6] text-[#5b21b6] text-sm font-medium hover:bg-[#5b21b6] hover:text-white transition-colors print:hidden"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            {prescription.status === 'Pending' && (
              <button
                onClick={handleDispense}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors print:hidden"
              >
                Dispense Medication
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPrescriptionStatusColor(prescription.status)}`}>
          {prescription.status}
        </span>
      </div>

      {/* Patient & Provider Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Patient Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Patient Information</h2>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Patient Name</label>
              <p className="text-gray-900 dark:text-white font-medium">
                {prescription.patient_name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Patient ID</label>
              <p className="text-gray-900 dark:text-white font-mono text-sm">
                {prescription.patient_id}
              </p>
            </div>
          </div>
        </div>

        {/* Prescription Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Prescription Information</h2>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Prescribed By</label>
              <p className="text-gray-900 dark:text-white font-medium">
                {prescription.prescribed_by_name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Date Prescribed</label>
              <p className="text-gray-900 dark:text-white">
                {new Date(prescription.prescribed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {prescription.dispensed_at && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Date Dispensed</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(prescription.dispensed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Information */}
      {(prescription.diagnosis || prescription.clinical_notes) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Clinical Information</h2>
          </div>
          <div className="p-6 space-y-4">
            {prescription.diagnosis && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnosis</label>
                <p className="text-gray-900 dark:text-white mt-1">{prescription.diagnosis}</p>
              </div>
            )}
            {prescription.clinical_notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Clinical Notes</label>
                <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {prescription.clinical_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prescription Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">
            Prescribed Medications ({prescription.items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qty Prescribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qty Dispensed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {prescription.items.map((item) => {
                const frequencyLabel = frequencyOptions.find(f => f.value === item.frequency)?.label || item.frequency;
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.drug_info.commodity_name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {item.drug_info.commodity_id} • {item.drug_info.pack_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.dosage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {frequencyLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.duration_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.quantity_prescribed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={item.quantity_dispensed > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500'}>
                        {item.quantity_dispensed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${
                        (item.drug_info.current_stock || 0) === 0
                          ? 'text-red-600 dark:text-red-400'
                          : (item.drug_info.current_stock || 0) < item.quantity_prescribed
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.drug_info.current_stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.is_dispensed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {item.is_dispensed ? 'Dispensed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        {prescription.items.some(item => item.instructions) && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Special Instructions:
            </h3>
            <ul className="space-y-1">
              {prescription.items
                .filter(item => item.instructions)
                .map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    • <span className="font-medium">{item.drug_info.commodity_name}:</span> {item.instructions}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
