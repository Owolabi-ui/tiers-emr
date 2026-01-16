'use client';

import { useState } from 'react';
import { getFingerprintBridge, FingerprintCaptureResult } from '@/lib/fingerprint';
import { biometricsApi, BiometricType } from '@/lib/biometrics';
import { Fingerprint, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from './toast-provider';

interface PatientFingerprintCaptureProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PatientFingerprintCapture({
  patientId,
  onSuccess,
  onCancel,
}: PatientFingerprintCaptureProps) {
  const [status, setStatus] = useState<'ready' | 'connecting' | 'capturing' | 'saving' | 'success' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [selectedFinger, setSelectedFinger] = useState<BiometricType>('Right Index');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  const bridge = getFingerprintBridge();

  const fingerOptions: BiometricType[] = [
    'Right Thumb',
    'Right Index',
    'Right Middle',
    'Right Ring',
    'Right Pinky',
    'Left Thumb',
    'Left Index',
    'Left Middle',
    'Left Ring',
    'Left Pinky',
  ];

  const handleCapture = async () => {
    setStatus('connecting');
    setError(null);
    setCapturedImage(null);
    setQuality(null);

    try {
      // Connect to bridge
      await bridge.connect();

      // Check device
      const device = await bridge.detectDevice();
      if (!device.detected) {
        throw new Error('Fingerprint scanner not detected. Please ensure it is connected.');
      }

      // Capture fingerprint
      setStatus('capturing');
      const result = await bridge.captureFingerprint(50);

      // Display captured image
      displayCapturedFingerprint(result);
      setQuality(result.quality);

      // Save to backend
      setStatus('saving');
      await biometricsApi.capture({
        patient_id: patientId,
        biometric_type: selectedFinger,
        fingerprint_data: result.imageData,
        fingerprint_template: result.template,
        quality_score: result.quality,
        is_primary: true,
      });

      setStatus('success');
      showSuccess('Fingerprint captured', `${selectedFinger} fingerprint registered successfully`);

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Fingerprint capture failed:', err);

      // Check for duplicate fingerprint error
      let errorMessage = err.message || 'Failed to capture fingerprint';
      if (errorMessage.includes('unique_patient_fingerprint_type') ||
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('already exists')) {
        errorMessage = `${selectedFinger} is already registered for this patient. Please select a different finger.`;
      }

      setError(errorMessage);
      setStatus('error');
      showError('Capture failed', errorMessage);
    }
  };

  const displayCapturedFingerprint = (result: FingerprintCaptureResult) => {
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imageData = ctx.createImageData(result.width, result.height);
      const rawData = atob(result.imageData);

      // Convert grayscale to RGBA
      for (let i = 0; i < rawData.length; i++) {
        const value = rawData.charCodeAt(i);
        imageData.data[i * 4] = value;
        imageData.data[i * 4 + 1] = value;
        imageData.data[i * 4 + 2] = value;
        imageData.data[i * 4 + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      setCapturedImage(canvas.toDataURL());
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Fingerprint className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Capture Patient Fingerprint
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select finger and place it on the scanner
          </p>
        </div>

        {/* Finger Selection */}
        {status !== 'success' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Finger
            </label>
            <select
              value={selectedFinger}
              onChange={(e) => setSelectedFinger(e.target.value as BiometricType)}
              disabled={status === 'capturing' || status === 'saving'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {fingerOptions.map((finger) => (
                <option key={finger} value={finger}>
                  {finger}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Messages */}
        {status === 'connecting' && (
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-4 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to scanner...</span>
          </div>
        )}

        {status === 'capturing' && (
          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-4 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Place {selectedFinger} on the scanner...</span>
          </div>
        )}

        {status === 'saving' && (
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-4 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving fingerprint...</span>
          </div>
        )}

        {status === 'error' && error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Captured Fingerprint */}
        {capturedImage && (
          <div className="mb-4">
            <div className="relative border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
              <img
                src={capturedImage}
                alt="Captured fingerprint"
                className="w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
              {quality !== null && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full">
                  <span className="text-xs font-medium text-white">Quality: {quality}%</span>
                </div>
              )}
            </div>
            {status === 'success' && (
              <div className="flex items-center justify-center gap-2 mt-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Fingerprint saved successfully!</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'ready' || status === 'error' ? (
            <>
              <button
                onClick={handleCapture}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Capture Fingerprint
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
              onClick={onCancel || onSuccess}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Done
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

        {/* Help text */}
        {status === 'ready' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Make sure the bridge server is running and your finger is clean and dry for best results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
