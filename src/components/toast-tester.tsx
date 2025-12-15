'use client';

import { useToast } from '@/components/toast-provider';

/**
 * Component for testing toast notifications
 * Can be temporarily added to any page for testing
 */
export function ToastTester() {
  const { showSuccess, showError, showWarning, showInfo, showOffline } = useToast();

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg">
      <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Toast Tester</p>
      <div className="space-y-2">
        <button
          onClick={() => showSuccess('Success!', 'This is a success message')}
          className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Success
        </button>
        <button
          onClick={() => showError('Error!', 'This is an error message')}
          className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test Error
        </button>
        <button
          onClick={() => showWarning('Warning!', 'This is a warning message')}
          className="w-full px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          Test Warning
        </button>
        <button
          onClick={() => showInfo('Info!', 'This is an info message')}
          className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Info
        </button>
        <button
          onClick={() => showOffline('Connection lost')}
          className="w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Offline
        </button>
        <button
          onClick={() => {
            console.log('Navigator.onLine:', navigator.onLine);
            alert(`Online status: ${navigator.onLine}`);
          }}
          className="w-full px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}
