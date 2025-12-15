'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { laboratoryApi, LabTestOrderWithDetails } from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
import {
  ArrowLeft,
  FlaskConical,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Syringe,
  Send,
} from 'lucide-react';

export default function LabOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<LabTestOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Sample collection state
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [sampleId, setSampleId] = useState('');

  // Result entry state
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultValue, setResultValue] = useState('');
  const [resultUnit, setResultUnit] = useState('copies/mL');
  const [resultInterpretation, setResultInterpretation] = useState<'Undetectable' | 'Low' | 'High' | ''>('');
  const [resultNotes, setResultNotes] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laboratoryApi.getOrderById(id);
      setOrder(response.order);
      
      // Auto-set result unit based on test type
      if (response.order.test_info.test_name.toLowerCase().includes('viral load')) {
        setResultUnit('copies/mL');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async () => {
    if (!sampleId.trim()) {
      showError('Sample ID Required', 'Please enter a sample ID');
      return;
    }

    try {
      setProcessing(true);
      await laboratoryApi.collectSample(id, { sample_id: sampleId.trim() });
      showSuccess('Sample Collected', 'Sample has been collected and logged');
      setShowSampleForm(false);
      setSampleId('');
      await fetchOrder();
    } catch (err) {
      showError('Collection Failed', getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!resultValue.trim()) {
      showError('Result Required', 'Please enter a result value');
      return;
    }

    try {
      setProcessing(true);
      const interpretationValue = resultInterpretation || 'Normal';
      const formattedValue = resultUnit ? `${resultValue.trim()} ${resultUnit}` : resultValue.trim();
      await laboratoryApi.enterResult(id, {
        result_value: formattedValue,
        result_interpretation: interpretationValue as any,
        result_notes: resultNotes.trim() || undefined,
      });
      showSuccess('Result Submitted', 'Test result has been recorded successfully');
      setShowResultForm(false);
      setResultValue('');
      setResultInterpretation('');
      setResultNotes('');
      await fetchOrder();
    } catch (err) {
      showError('Submission Failed', getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ordered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Ordered
          </span>
        );
      case 'Sample Collected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <FlaskConical className="h-4 w-4" />
            Sample Collected
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'stat' || priorityLower === 'urgent') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          {priority}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading lab order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading lab order
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error || 'Lab order not found'}
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
    <div className="space-y-6">
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
                {order.test_info.test_name}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="font-mono">{order.order_number}</span>
              <span>•</span>
              <span>{order.test_info.test_category}</span>
              <span>•</span>
              {getPriorityBadge(order.priority)}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-[#5b21b6]" />
          Patient Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Patient Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {order.patient_name || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Patient ID</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1 font-mono">
              {order.patient_id}
            </p>
          </div>
        </div>
      </div>

      {/* Test Information */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#5b21b6]" />
          Test Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Test Code</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1 font-mono">
              {order.test_info.test_code}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sample Type</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
              {order.test_info.sample_type}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ordered Date</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          {order.test_info.turnaround_time_hours && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expected Turnaround</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {order.test_info.turnaround_time_hours} hours
              </p>
            </div>
          )}
          {order.clinical_indication && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Clinical Indication</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {order.clinical_indication}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sample Collection */}
      {order.status === 'Ordered' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Syringe className="h-5 w-5 text-[#5b21b6]" />
            Sample Collection
          </h2>
          
          {!showSampleForm ? (
            <button
              onClick={() => setShowSampleForm(true)}
              className="w-full px-4 py-3 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors font-medium"
            >
              Collect Sample
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sample ID *
                </label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  placeholder="Enter sample barcode or ID"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCollectSample}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Collecting...
                    </span>
                  ) : (
                    'Confirm Collection'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowSampleForm(false);
                    setSampleId('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Info (if collected) */}
      {order.sample_id && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Sample ID: <span className="font-mono">{order.sample_id}</span>
              </p>
              <p className="text-blue-800 dark:text-blue-200 mt-1">
                Collected: {order.sample_collected_at ? new Date(order.sample_collected_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Entry */}
      {order.status === 'Sample Collected' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-[#5b21b6]" />
            Enter Results
          </h2>
          
          {!showResultForm ? (
            <button
              onClick={() => setShowResultForm(true)}
              className="w-full px-4 py-3 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors font-medium"
            >
              Enter Test Results
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Result Value *
                  </label>
                  <input
                    type="text"
                    value={resultValue}
                    onChange={(e) => setResultValue(e.target.value)}
                    placeholder="e.g., 450"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={resultUnit}
                    onChange={(e) => setResultUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interpretation
                </label>
                <select
                  value={resultInterpretation}
                  onChange={(e) => setResultInterpretation(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                >
                  <option value="">Select interpretation...</option>
                  <option value="Undetectable">Undetectable (&lt;50 copies/mL)</option>
                  <option value="Low">Low (50-1000 copies/mL)</option>
                  <option value="High">High (&gt;1000 copies/mL)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional observations or notes..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitResult}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Results'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowResultForm(false);
                    setResultValue('');
                    setResultInterpretation('');
                    setResultNotes('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results (if completed) */}
      {order.result_value && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Test Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Result</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {order.result_value} {order.result_unit}
              </p>
              {order.result_interpretation && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {order.result_interpretation}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
              <p className="text-base font-medium text-green-900 dark:text-green-100 mt-1">
                {order.resulted_at ? new Date(order.resulted_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            {order.result_notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-green-700 dark:text-green-300">Notes</p>
                <p className="text-base text-green-900 dark:text-green-100 mt-1">
                  {order.result_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reference Information */}
      {order.test_info.reference_range_text && (
        <div className="bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">Reference Range</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {order.test_info.reference_range_text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
