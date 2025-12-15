'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  pharmacyApi, 
  Prescription,
  DispenseMedicationRequest,
  formatPrescriptionNumber,
  frequencyOptions
} from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';

interface DispenseFormItem extends DispenseMedicationRequest {
  drug_name: string;
  quantity_prescribed: number;
  quantity_already_dispensed: number;
  current_stock: number;
}

export default function DispensePage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params?.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [dispenseItems, setDispenseItems] = useState<DispenseFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      
      if (data.status !== 'Pending' && data.status !== 'Partially Dispensed') {
        setError('This prescription cannot be dispensed');
        return;
      }

      setPrescription(data);
      
      // Initialize dispense form items
      const items: DispenseFormItem[] = data.items
        .filter(item => !item.is_dispensed)
        .map(item => ({
          prescription_item_id: item.id,
          quantity_dispensed: item.quantity_prescribed - item.quantity_dispensed,
          batch_no: '',
          notes: '',
          drug_name: item.drug_info.commodity_name,
          quantity_prescribed: item.quantity_prescribed,
          quantity_already_dispensed: item.quantity_dispensed,
          current_stock: item.drug_info.current_stock || 0,
        }));
      
      setDispenseItems(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseInt(value) || 0;
    const item = dispenseItems[index];
    const maxQuantity = item.quantity_prescribed - item.quantity_already_dispensed;
    
    if (quantity > maxQuantity) {
      setSubmitError(`Cannot dispense more than ${maxQuantity} units`);
      return;
    }
    
    if (quantity > item.current_stock) {
      setSubmitError(`Insufficient stock. Available: ${item.current_stock}`);
      return;
    }

    setSubmitError(null);
    const updated = [...dispenseItems];
    updated[index].quantity_dispensed = quantity;
    setDispenseItems(updated);
  };

  const handleBatchChange = (index: number, value: string) => {
    const updated = [...dispenseItems];
    updated[index].batch_no = value;
    setDispenseItems(updated);
  };

  const handleNotesChange = (index: number, value: string) => {
    const updated = [...dispenseItems];
    updated[index].notes = value;
    setDispenseItems(updated);
  };

  const validateDispense = (): boolean => {
    // Check if at least one item has quantity > 0
    const hasItems = dispenseItems.some(item => item.quantity_dispensed > 0);
    if (!hasItems) {
      setSubmitError('Please enter quantity for at least one medication');
      return false;
    }

    // Check stock availability
    for (const item of dispenseItems) {
      if (item.quantity_dispensed > 0 && item.quantity_dispensed > item.current_stock) {
        setSubmitError(`Insufficient stock for ${item.drug_name}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateDispense()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Filter items with quantity > 0
      const itemsToDispense = dispenseItems
        .filter(item => item.quantity_dispensed > 0)
        .map(({ prescription_item_id, quantity_dispensed, batch_no, notes }) => ({
          prescription_item_id,
          quantity_dispensed,
          batch_no: batch_no || undefined,
          notes: notes || undefined,
        }));

      await pharmacyApi.dispensePrescription(prescriptionId, {
        items: itemsToDispense,
      });

      router.push(`/dashboard/pharmacy/${prescriptionId}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/pharmacy/${prescriptionId}`);
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
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={handleCancel}
                className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Back to Pharmacy
              </button>
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
          onClick={handleCancel}
          className="mb-4 text-[#5b21b6] hover:underline flex items-center text-sm"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-[#5b21b6]">
          Dispense Medication
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {formatPrescriptionNumber(prescription.prescription_number)} • {prescription.patient_name}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Dispensing Instructions
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Verify patient identity before dispensing</li>
                <li>Check medication expiry dates</li>
                <li>Enter batch numbers for traceability</li>
                <li>Provide counseling on medication usage</li>
                <li>You can partially dispense if stock is insufficient</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dispense Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">
            Medications to Dispense ({dispenseItems.length})
          </h2>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {dispenseItems.map((item, index) => {
            const remaining = item.quantity_prescribed - item.quantity_already_dispensed;
            const stockStatus = item.current_stock === 0 
              ? 'out' 
              : item.current_stock < remaining 
              ? 'low' 
              : 'ok';

            return (
              <div key={item.prescription_item_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.drug_name}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Prescribed: {item.quantity_prescribed}</span>
                      {item.quantity_already_dispensed > 0 && (
                        <span>Already Dispensed: {item.quantity_already_dispensed}</span>
                      )}
                      <span>Remaining: {remaining}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      stockStatus === 'out'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : stockStatus === 'low'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      Stock: {item.current_stock}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity to Dispense *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={Math.min(remaining, item.current_stock)}
                      value={item.quantity_dispensed}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={stockStatus === 'out'}
                    />
                    {stockStatus === 'low' && (
                      <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                        Limited stock available
                      </p>
                    )}
                    {stockStatus === 'out' && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Out of stock
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={item.batch_no}
                      onChange={(e) => handleBatchChange(index, e.target.value)}
                      placeholder="Enter batch number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={stockStatus === 'out'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={stockStatus === 'out'}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || dispenseItems.every(item => item.current_stock === 0)}
            className="px-6 py-3 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Dispensing...
              </>
            ) : (
              'Dispense Medications'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
