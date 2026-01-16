'use client';

import { useState, useEffect } from 'react';
import { TestTube, Beaker, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { createHTSScreeningOrder, createHTSAdditionalTests, getOrdersByService, type LabTestOrder } from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';

interface HtsLabOrderingStepProps {
  htsInitialId: string;
  patientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

export default function HtsLabOrderingStep({
  htsInitialId,
  patientId,
  onNext,
  onPrevious,
}: HtsLabOrderingStepProps) {
  const [orders, setOrders] = useState<LabTestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Individual STI test selections
  const [includeSyphilis, setIncludeSyphilis] = useState(true);
  const [includeHepB, setIncludeHepB] = useState(true);
  const [includeHepC, setIncludeHepC] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [htsInitialId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const existingOrders = await getOrdersByService('HTS', htsInitialId);
      setOrders(existingOrders);
    } catch (err) {
      console.error('Error loading lab orders:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setCreating(true);
      setError(null);
      
      // Check if pending orders already exist to prevent duplicates
      // Allow creating new orders if all existing orders are completed/communicated
      const hasPendingOrders = orders.some(o => 
        ['Ordered', 'Sample Collected', 'In Progress'].includes(o.status)
      );
      
      if (hasPendingOrders) {
        setError('Pending lab orders already exist for this HTS session. Please wait for them to be completed before creating new orders.');
        return;
      }
      
      // Create HIV screening order (always required)
      await createHTSScreeningOrder(
        patientId,
        htsInitialId,
        'HIV screening test requested after pre-test counseling'
      );

      // Create additional STI screening tests based on individual selections
      const hasAnySTITest = includeSyphilis || includeHepB || includeHepC;
      if (hasAnySTITest) {
        await createHTSAdditionalTests(
          patientId,
          htsInitialId,
          'STI co-infection screening as part of HIV testing services',
          {
            includeSyphilis,
            includeHepB,
            includeHepC,
          }
        );
      }
      
      // Reload orders to show all new ones
      await loadOrders();
    } catch (err) {
      console.error('Error creating lab orders:', err);
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const hasCompletedOrder = orders.some(o => ['Completed', 'Reviewed', 'Communicated'].includes(o.status));
  const hasPendingOrder = orders.some(o => ['Ordered', 'Sample Collected', 'In Progress'].includes(o.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading lab orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${hasCompletedOrder ? 'bg-green-100' : 'bg-purple-100'}`}>
            {hasCompletedOrder ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <TestTube className="h-6 w-6 text-[#5b21b6]" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {hasCompletedOrder ? 'Laboratory Results' : 'Laboratory Testing'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {hasCompletedOrder 
                ? 'Lab results are ready. Review the results below and continue to confirm them in your clinical records.'
                : 'Create lab orders for HIV screening test. Optional STI co-infection screening can be included based on risk assessment.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Section */}
      {orders.length === 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Laboratory Orders</h3>
              <p className="text-sm text-gray-600">
                Select which tests to order for this client. HIV screening is mandatory, additional STI screening is recommended based on risk assessment.
              </p>
            </div>

            {/* Test Selection */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="h-4 w-4 text-[#5b21b6] border-gray-300 rounded mt-1 cursor-not-allowed opacity-50"
                />
                <div className="ml-3 flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    HIV Rapid Screening Test <span className="text-red-500">*Required</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Mandatory HIV rapid antibody test (30-minute turnaround)
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-semibold text-gray-900 mb-3">STI Co-infection Screening <span className="text-blue-600 font-normal">Recommended</span></p>
                <p className="text-xs text-gray-600 mb-3 italic">
                  Recommended for: sexually active clients, multiple partners, history of STIs, injection drug use
                </p>
                <div className="space-y-3 ml-2">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="includeSyphilis"
                      checked={includeSyphilis}
                      onChange={(e) => setIncludeSyphilis(e.target.checked)}
                      className="h-4 w-4 text-[#5b21b6] border-gray-300 rounded focus:ring-[#5b21b6] mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <label htmlFor="includeSyphilis" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Syphilis Screening (TPHA)
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Treponema pallidum hemagglutination assay
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="includeHepB"
                      checked={includeHepB}
                      onChange={(e) => setIncludeHepB(e.target.checked)}
                      className="h-4 w-4 text-[#5b21b6] border-gray-300 rounded focus:ring-[#5b21b6] mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <label htmlFor="includeHepB" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Hepatitis B Screening (HBsAg)
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Hepatitis B Surface Antigen test
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="includeHepC"
                      checked={includeHepC}
                      onChange={(e) => setIncludeHepC(e.target.checked)}
                      className="h-4 w-4 text-[#5b21b6] border-gray-300 rounded focus:ring-[#5b21b6] mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <label htmlFor="includeHepC" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Hepatitis C Screening (HCV-AB)
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Hepatitis C Antibody test
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleCreateOrder}
                disabled={creating || hasPendingOrder}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Orders...
                  </>
                ) : hasPendingOrder ? (
                  <>
                    <Clock className="h-5 w-5" />
                    Pending Orders Exist
                  </>
                ) : (
                  <>
                    <TestTube className="h-5 w-5" />
                    Create Lab Orders ({1 + (includeSyphilis ? 1 : 0) + (includeHepB ? 1 : 0) + (includeHepC ? 1 : 0)} {1 + (includeSyphilis ? 1 : 0) + (includeHepB ? 1 : 0) + (includeHepC ? 1 : 0) === 1 ? 'Test' : 'Tests'})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Orders */}
      {orders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Lab Orders</h3>
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-black/10 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{order.test_info.test_name}</h4>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Order #{order.order_number}</p>
                  
                  {order.result_value && (
                    <div className="mt-4 p-4 rounded-lg bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">Result</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {order.result_value} {order.result_unit}
                      </p>
                      {order.result_interpretation && (
                        <p className="text-sm text-gray-600 mt-1">
                          Interpretation: {order.result_interpretation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {hasPendingOrder && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Lab Order Pending</p>
              <p className="text-sm text-blue-700 mt-1">
                The laboratory will process this order. You can proceed to the next step once the results are ready, or continue now and enter results manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrevious}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={orders.length === 0}
          className="px-6 py-2.5 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasCompletedOrder ? 'Review & Confirm Results' : 'Continue to Testing'}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Ordered: 'bg-blue-100 text-blue-800',
    SampleCollected: 'bg-yellow-100 text-yellow-800',
    Testing: 'bg-orange-100 text-orange-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
