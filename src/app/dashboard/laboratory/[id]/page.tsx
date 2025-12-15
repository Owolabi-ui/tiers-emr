'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  laboratoryApi,
  LabOrderDetailsResponse,
  getStatusColor,
  getPriorityColor,
  getInterpretationColor,
  formatOrderNumber,
  resultInterpretationOptions,
  ResultInterpretation,
  isQualitativeTest,
  getQualitativeOptions,
} from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  FlaskConical,
  Calendar,
  FileText,
  AlertCircle,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Microscope,
  ClipboardCheck,
  Send,
  History,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// FORM SCHEMAS
// ============================================================================

const resultFormSchema = z.object({
  result_value: z.string().min(1, 'Result value is required'),
  result_interpretation: z.enum(['Normal', 'Abnormal', 'Critical', 'Indeterminate', 'Pending']),
  result_notes: z.string().optional(),
});

const cancelFormSchema = z.object({
  cancellation_reason: z.string().min(1, 'Cancellation reason is required'),
});

type ResultFormData = z.infer<typeof resultFormSchema>;
type CancelFormData = z.infer<typeof cancelFormSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function LabOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [data, setData] = useState<LabOrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const resultForm = useForm<ResultFormData>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      result_interpretation: 'Normal',
    },
  });

  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelFormSchema),
  });

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laboratoryApi.getOrderById(orderId);
      console.log('Lab order data:', response);
      console.log('Test info:', response.order?.test_info);
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // Generate a unique sample ID (format: SMP-YYYYMMDD-XXXXX)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const sampleId = `SMP-${dateStr}-${randomPart}`;
      
      await laboratoryApi.collectSample(orderId, {
        sample_id: sampleId,
        sample_collected_at: now.toISOString(),
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProcessing = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await laboratoryApi.startProcessing(orderId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterResult = async (formData: ResultFormData) => {
    try {
      setActionLoading(true);
      setError(null);
      await laboratoryApi.enterResult(orderId, {
        result_value: formData.result_value,
        result_interpretation: formData.result_interpretation as ResultInterpretation,
        result_notes: formData.result_notes || null,
      });
      await loadData();
      setShowResultModal(false);
      resultForm.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await laboratoryApi.reviewResult(orderId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommunicate = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await laboratoryApi.communicateResult(orderId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (formData: CancelFormData) => {
    try {
      setActionLoading(true);
      setError(null);
      await laboratoryApi.cancelOrder(orderId, {
        cancellation_reason: formData.cancellation_reason,
      });
      await loadData();
      setShowCancelModal(false);
      cancelForm.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading lab order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/laboratory"
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Lab Order Details</h1>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading lab order</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { order, result_history, critical_result } = data;
  const canCollectSample = order.status === 'Ordered';
  const canStartProcessing = order.status === 'Sample Collected';
  const canEnterResult = order.status === 'In Progress';
  const canReview = order.status === 'Completed';
  const canCommunicate = order.status === 'Reviewed';
  const canCancel = !['Cancelled', 'Communicated'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/laboratory"
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5b21b6]">Lab Order Details</h1>
            <p className="text-sm text-gray-500 mt-1">{formatOrderNumber(order.order_number)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(order.priority)}`}>
            {order.priority}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Action failed</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Result Alert */}
      {critical_result && !critical_result.acknowledged_at && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-lg font-bold text-red-800 dark:text-red-300">CRITICAL RESULT</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                This result has been flagged as critical and requires immediate attention.
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                Detected: {new Date(critical_result.detected_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canCancel && (
        <div className="flex flex-wrap gap-3">
          {canCollectSample && (
            <button
              onClick={handleCollectSample}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              Collect Sample
            </button>
          )}

          {canStartProcessing && (
            <button
              onClick={handleStartProcessing}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Microscope className="h-4 w-4" />}
              Start Processing
            </button>
          )}

          {canEnterResult && (
            <button
              onClick={() => setShowResultModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Enter Result
            </button>
          )}

          {canReview && (
            <button
              onClick={handleReview}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Review Result
            </button>
          )}

          {canCommunicate && (
            <button
              onClick={handleCommunicate}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Communicate Result
            </button>
          )}

          <button
            onClick={() => setShowCancelModal(true)}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Information */}
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
              <FlaskConical className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Test Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Test Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.test_info?.test_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Test Code</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.test_info?.test_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.test_info?.test_category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sample Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.test_info?.sample_type || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Result Information */}
          {order.result_value && (
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
              <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
                <FileText className="h-5 w-5 text-white" />
                <h2 className="font-semibold text-white">Test Result</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Result Value</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{order.result_value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Interpretation</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getInterpretationColor(order.result_interpretation!)}`}>
                      {order.result_interpretation}
                    </span>
                  </div>
                </div>
                {order.test_info?.reference_range_text && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Normal Range</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {order.test_info.reference_range_text}
                    </p>
                  </div>
                )}
                {order.result_notes && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Result Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{order.result_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinical Notes */}
          {order.clinical_notes && (
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
              <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
                <FileText className="h-5 w-5 text-white" />
                <h2 className="font-semibold text-white">Clinical Notes</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">{order.clinical_notes}</p>
              </div>
            </div>
          )}

          {/* Result History */}
          {result_history && result_history.length > 0 && (
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
              <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
                <History className="h-5 w-5 text-white" />
                <h2 className="font-semibold text-white">Result History</h2>
              </div>
              <div className="p-6 space-y-4">
                {result_history.map((history) => (
                  <div key={history.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{history.result_value}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInterpretationColor(history.result_interpretation)}`}>
                        {history.result_interpretation}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(history.entered_at).toLocaleString()}
                    </p>
                    {history.result_notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{history.result_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Timeline & Patient */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
              <User className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Patient</h2>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{order.patient_name || 'N/A'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Patient ID: {order.patient_id}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2 rounded-t-xl">
              <Clock className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Timeline</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ordered</p>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              {order.sample_collected_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sample Collected</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.sample_collected_at).toLocaleString()}</p>
                </div>
              )}
              {order.started_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Processing Started</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.started_at).toLocaleString()}</p>
                </div>
              )}
              {order.completed_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.completed_at).toLocaleString()}</p>
                </div>
              )}
              {order.reviewed_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.reviewed_at).toLocaleString()}</p>
                </div>
              )}
              {order.communicated_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Communicated</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.communicated_at).toLocaleString()}</p>
                </div>
              )}
              {order.cancelled_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(order.cancelled_at).toLocaleString()}</p>
                  {order.cancellation_reason && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{order.cancellation_reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enter Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full border border-black/10 dark:border-white/15">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="font-semibold text-white">Enter Test Result</h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={resultForm.handleSubmit(handleEnterResult)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Result Value <span className="text-red-500">*</span>
                </label>
                {data?.order?.test_info && isQualitativeTest(data.order.test_info.test_code) ? (
                  // Qualitative test - dropdown
                  <select
                    {...resultForm.register('result_value')}
                    className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  >
                    <option value="">Select result</option>
                    {getQualitativeOptions(data.order.test_info.test_code).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  // Quantitative test - numeric input
                  <input
                    {...resultForm.register('result_value')}
                    type="text"
                    placeholder="Enter numeric value..."
                    className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                  />
                )}
                {resultForm.formState.errors.result_value && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {resultForm.formState.errors.result_value.message}
                  </p>
                )}
                {data?.order?.test_info && !isQualitativeTest(data.order.test_info.test_code) && data.order.test_info.reference_range_text && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Reference: {data.order.test_info.reference_range_text}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interpretation <span className="text-red-500">*</span>
                </label>
                <select
                  {...resultForm.register('result_interpretation')}
                  className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  {resultInterpretationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Result Notes
                </label>
                <textarea
                  {...resultForm.register('result_notes')}
                  rows={3}
                  placeholder="Enter any additional notes..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full border border-black/10 dark:border-white/15">
            <div className="bg-red-600 px-5 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="font-semibold text-white">Cancel Lab Order</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={cancelForm.handleSubmit(handleCancel)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...cancelForm.register('cancellation_reason')}
                  rows={3}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                {cancelForm.formState.errors.cancellation_reason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {cancelForm.formState.errors.cancellation_reason.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cancel Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
