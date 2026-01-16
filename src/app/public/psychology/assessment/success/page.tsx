'use client';

import { CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Your assessment has been submitted successfully.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Your healthcare provider has received your responses and will review them as part of your care plan.
          </p>
        </div>

        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul className="text-left space-y-2 pl-4">
            <li>• Your provider will review your assessment results</li>
            <li>• They may discuss the results with you at your next appointment</li>
            <li>• If needed, they will recommend next steps for your care</li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You can close this page now. If you have any urgent concerns, please contact your healthcare provider directly.
          </p>
        </div>
      </div>
    </div>
  );
}
