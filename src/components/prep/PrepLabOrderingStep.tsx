'use client';

import { useState } from 'react';
import { FlaskConical, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createPREPBaselineTests } from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';

interface PrepLabOrderingStepProps {
  patientId: string;
  htsInitialId: string;
  patientGender?: string; // For determining pregnancy test requirement
  onComplete: () => void;
  onSkip?: () => void;
}

export default function PrepLabOrderingStep({
  patientId,
  htsInitialId,
  patientGender,
  onComplete,
  onSkip,
}: PrepLabOrderingStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Optional test selections
  const [includePregnancyTest, setIncludePregnancyTest] = useState(
    patientGender?.toLowerCase() === 'female'
  );
  const [includeLiverFunction, setIncludeLiverFunction] = useState(false);

  const handleOrderTests = async () => {
    try {
      setLoading(true);
      setError(null);

      await createPREPBaselineTests(patientId, htsInitialId, {
        includePregnancyTest,
        includeLiverFunction,
      });

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error ordering PREP baseline tests:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getTestCount = () => {
    let count = 3; // HIV, Creatinine, Hepatitis B (mandatory)
    if (includePregnancyTest) count += 1;
    if (includeLiverFunction) count += 2; // ALT + AST
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            PREP Baseline Laboratory Tests Required
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Before initiating PREP, baseline laboratory tests must be completed to assess
            eligibility and establish baseline health status.
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
              Laboratory tests ordered successfully. Proceeding to next step...
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Mandatory Baseline Tests
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">HIV Rapid Test</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be negative to initiate PREP
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Creatinine (Kidney Function)</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Baseline renal function assessment
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Hepatitis B Surface Antigen</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hepatitis B screening for PREP safety
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Optional Baseline Tests
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includePregnancyTest}
                onChange={(e) => setIncludePregnancyTest(e.target.checked)}
                disabled={loading || success}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Pregnancy Test (HCG)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Recommended for all women of childbearing age
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeLiverFunction}
                onChange={(e) => setIncludeLiverFunction(e.target.checked)}
                disabled={loading || success}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Liver Function Tests (ALT/AST)
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Baseline liver function - recommended for clients with liver disease history
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading || success}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
        
        <button
          type="button"
          onClick={handleOrderTests}
          disabled={loading || success}
          className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {success && <CheckCircle2 className="h-4 w-4" />}
          {!loading && !success && <FlaskConical className="h-4 w-4" />}
          {loading
            ? 'Ordering Tests...'
            : success
            ? 'Tests Ordered'
            : `Order ${getTestCount()} Test${getTestCount() > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
