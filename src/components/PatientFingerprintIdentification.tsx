'use client';

import { useState } from 'react';
import { getFingerprintBridge } from '@/lib/fingerprint';
import { biometricsApi } from '@/lib/biometrics';
import { Fingerprint, Loader2, AlertCircle, UserCheck, X } from 'lucide-react';
import { useToast } from './toast-provider';

interface IdentifiedPatient {
  patient_id: string;
  name?: string;
  matched_finger?: string;
  confidence?: number;
}

interface PatientFingerprintIdentificationProps {
  onPatientIdentified: (patientId: string) => void;
  onCancel?: () => void;
}

export default function PatientFingerprintIdentification({
  onPatientIdentified,
  onCancel,
}: PatientFingerprintIdentificationProps) {
  const [status, setStatus] = useState<'ready' | 'connecting' | 'scanning' | 'identifying' | 'success' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [identifiedPatient, setIdentifiedPatient] = useState<IdentifiedPatient | null>(null);
  const { showSuccess, showError } = useToast();

  const bridge = getFingerprintBridge();

  const handleScan = async () => {
    setStatus('connecting');
    setError(null);
    setIdentifiedPatient(null);

    try {
      // Connect to bridge
      await bridge.connect();

      // Check device
      const device = await bridge.detectDevice();
      if (!device.detected) {
        throw new Error('Fingerprint scanner not detected. Please ensure it is connected.');
      }

      // Capture fingerprint
      setStatus('scanning');
      const result = await bridge.captureFingerprint(50);

      // Identify patient
      setStatus('identifying');
      const identificationResult = await biometricsApi.identify(result.imageData);

      if (identificationResult.verified && identificationResult.patient_id) {
        setIdentifiedPatient({
          patient_id: identificationResult.patient_id,
          matched_finger: identificationResult.matched_biometric_type || undefined,
          confidence: identificationResult.match_score || undefined,
        });
        setStatus('success');
        showSuccess('Patient identified', 'Patient found successfully');

        // Call callback with patient ID
        setTimeout(() => {
          onPatientIdentified(identificationResult.patient_id!);
        }, 1000);
      } else {
        throw new Error('No matching patient found. The fingerprint is not registered in the system.');
      }
    } catch (err: any) {
      console.error('Patient identification failed:', err);
      setError(err.message || 'Failed to identify patient');
      setStatus('error');
      showError('Identification failed', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Patient Identification
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan fingerprint to identify patient
          </p>
        </div>

        {/* Status Messages */}
        {status === 'connecting' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Connecting to scanner...</p>
          </div>
        )}

        {status === 'scanning' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="relative">
              <Fingerprint className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-purple-600 dark:text-purple-400 font-medium">
              Place your finger on the scanner...
            </p>
          </div>
        )}

        {status === 'identifying' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Searching for patient...
            </p>
          </div>
        )}

        {status === 'success' && identifiedPatient && (
          <div className="py-6">
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Patient Identified!
                </p>
                {identifiedPatient.matched_finger && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Matched: {identifiedPatient.matched_finger}
                  </p>
                )}
                {identifiedPatient.confidence && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Confidence: {(identifiedPatient.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-sm text-green-800 dark:text-green-200">
                Loading patient information...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Identification Failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Make sure the patient's fingerprint has been registered in the system.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {status === 'ready' || status === 'error' ? (
            <>
              <button
                onClick={handleScan}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Scan Fingerprint
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </>
          ) : status === 'success' ? (
            <button
              disabled
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium cursor-not-allowed opacity-75"
            >
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </button>
          ) : (
            <button
              disabled
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
            >
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </button>
          )}
        </div>

        {/* Instructions */}
        {status === 'ready' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
              <strong>Quick Check-in:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Ensure scanner is connected</li>
              <li>Ask patient to place registered finger on scanner</li>
              <li>System will automatically find and load patient record</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
