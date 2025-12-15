'use client';

import { useState, useEffect } from 'react';
import { FlaskConical, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createPREPMonitoringTests, getResultsByService } from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';

interface PrepMonitoringFormProps {
  patientId: string;
  prepCommencementId: string;
  visitMonth: number; // 1, 3, 6, 9, 12, etc.
  onComplete: () => void;
  onSkip?: () => void;
}

export default function PrepMonitoringForm({
  patientId,
  prepCommencementId,
  visitMonth,
  onComplete,
  onSkip,
}: PrepMonitoringFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [labResults, setLabResults] = useState<Record<string, any>>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [testsOrdered, setTestsOrdered] = useState(false);

  // Determine if creatinine is due based on visit month
  const isCreatinineDue = visitMonth === 3 || visitMonth % 6 === 0;

  // Fetch existing lab results
  useEffect(() => {
    const fetchLabResults = async () => {
      try {
        setLoadingResults(true);
        const results = await getResultsByService('PREP_MONITORING', prepCommencementId);
        setLabResults(results);

        // Check if we already have recent results
        const hasHIV = results.HIV_RAPID;
        const hasCreatinine = results.CREATININE;
        
        if (hasHIV && (!isCreatinineDue || hasCreatinine)) {
          setTestsOrdered(true);
        }
      } catch (err) {
        console.error('Error fetching lab results:', err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchLabResults();
  }, [prepCommencementId, isCreatinineDue]);

  const handleOrderTests = async () => {
    try {
      setLoading(true);
      setError(null);

      await createPREPMonitoringTests(patientId, prepCommencementId, {
        includeCreatinine: isCreatinineDue,
      });

      setTestsOrdered(true);
      setSuccess(true);

      setTimeout(() => {
        window.location.reload(); // Refresh to show new orders
      }, 1500);
    } catch (err) {
      console.error('Error ordering PREP monitoring tests:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getResultValue = (testCode: string) => {
    return labResults[testCode]?.value || 'Pending';
  };

  const getResultInterpretation = (testCode: string) => {
    const result = labResults[testCode];
    if (!result) return 'pending';

    const value = result.value?.toLowerCase() || '';
    const interpretation = result.interpretation?.toLowerCase() || '';

    if (testCode === 'HIV_RAPID') {
      if (value.includes('non-reactive')) return 'safe';
      if (value.includes('reactive')) return 'critical';
    }

    if (interpretation === 'normal') return 'safe';
    if (interpretation === 'abnormal' || interpretation === 'critical') return 'warning';

    return 'pending';
  };

  const getResultColor = (interpretation: string) => {
    switch (interpretation) {
      case 'safe':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'critical':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const allResultsAvailable = () => {
    const hasHIV = labResults.HIV_RAPID;
    const hasCreatinine = !isCreatinineDue || labResults.CREATININE;
    return hasHIV && hasCreatinine;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            PREP Monitoring - Month {visitMonth} Visit
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {isCreatinineDue
              ? 'HIV and Creatinine tests required for this visit'
              : 'HIV test required for this visit'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">Error</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 dark:text-green-100">Success</h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Monitoring tests ordered successfully. Refreshing...
            </p>
          </div>
        </div>
      )}

      {/* Lab Results Display */}
      {testsOrdered && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Laboratory Results
          </h4>

          {loadingResults ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading results...
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`flex justify-between p-3 rounded border ${getResultColor(getResultInterpretation('HIV_RAPID'))}`}>
                <span className="text-sm font-medium">HIV Rapid Test:</span>
                <span className="text-sm font-mono">{getResultValue('HIV_RAPID')}</span>
              </div>

              {isCreatinineDue && (
                <div className={`flex justify-between p-3 rounded border ${getResultColor(getResultInterpretation('CREATININE'))}`}>
                  <span className="text-sm font-medium">Creatinine (Kidney Function):</span>
                  <span className="text-sm font-mono">{getResultValue('CREATININE')}</span>
                </div>
              )}

              {!allResultsAvailable() && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⏳ Waiting for laboratory to complete tests...
                  </p>
                </div>
              )}

              {labResults.HIV_RAPID?.value?.toLowerCase().includes('reactive') && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-red-900 dark:text-red-100">CRITICAL ALERT</h5>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        HIV test is REACTIVE. Client has seroconverted while on PREP. Immediately:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                        <li>Discontinue PREP</li>
                        <li>Provide post-test counseling</li>
                        <li>Refer for HIV confirmatory testing</li>
                        <li>Initiate ART if confirmed positive</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Tests Section */}
      {!testsOrdered && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Required Tests for This Visit
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>HIV Rapid Test (every visit)</span>
            </li>
            {isCreatinineDue && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Creatinine - Kidney function (Month {visitMonth})</span>
              </li>
            )}
          </ul>

          <button
            type="button"
            onClick={handleOrderTests}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Ordering Tests...' : `Order ${isCreatinineDue ? '2' : '1'} Test${isCreatinineDue ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {allResultsAvailable() && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={onComplete}
            disabled={labResults.HIV_RAPID?.value?.toLowerCase().includes('reactive')}
            className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continue to Prescription
          </button>
        </div>
      )}
    </div>
  );
}
