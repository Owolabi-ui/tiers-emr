'use client';

import { useState, useEffect } from 'react';
import { getFingerprintBridge, FingerprintCaptureResult } from '@/lib/fingerprint';
import { Fingerprint, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface FingerprintCaptureProps {
  onCapture: (data: FingerprintCaptureResult) => void;
  onCancel?: () => void;
  minQuality?: number;
}

export default function FingerprintCapture({ onCapture, onCancel, minQuality = 50 }: FingerprintCaptureProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'capturing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState<number | null>(null);

  const bridge = getFingerprintBridge();

  useEffect(() => {
    checkDevice();
  }, []);

  const checkDevice = async () => {
    setStatus('connecting');
    setError(null);

    try {
      await bridge.connect();
      const device = await bridge.detectDevice();

      if (device.detected) {
        setDeviceInfo(`${device.deviceName || 'Fingerprint Scanner'} detected`);
        setStatus('ready');
      } else {
        setError('No fingerprint scanner detected. Please connect your device and try again.');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to fingerprint bridge');
      setStatus('error');
    }
  };

  const handleCapture = async () => {
    setStatus('capturing');
    setError(null);
    setCapturedImage(null);
    setQuality(null);

    try {
      const result = await bridge.captureFingerprint(minQuality);

      // Convert raw image data to displayable format
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
          imageData.data[i * 4] = value;     // R
          imageData.data[i * 4 + 1] = value; // G
          imageData.data[i * 4 + 2] = value; // B
          imageData.data[i * 4 + 3] = 255;   // A
        }

        ctx.putImageData(imageData, 0, 0);
        setCapturedImage(canvas.toDataURL());
      }

      setQuality(result.quality);
      setStatus('success');

      // Call parent callback
      onCapture(result);
    } catch (err: any) {
      setError(err.message || 'Failed to capture fingerprint');
      setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Fingerprint className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Fingerprint Capture
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {deviceInfo || 'Connecting to fingerprint scanner...'}
        </p>
      </div>

      {/* Status Messages */}
      {status === 'connecting' && (
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting to device...</span>
        </div>
      )}

      {status === 'capturing' && (
        <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Place your finger on the scanner...</span>
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

      {/* Captured Fingerprint Image */}
      {capturedImage && (
        <div className="mb-4">
          <div className="relative border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured fingerprint"
              className="w-full h-auto bg-gray-100 dark:bg-gray-900"
            />
            {quality !== null && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 rounded-full">
                <span className="text-xs font-medium text-white">
                  Quality: {quality}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Fingerprint captured successfully</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {status === 'ready' || status === 'error' ? (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-5 h-5" />
              Capture Fingerprint
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        ) : status === 'success' ? (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              Capture Again
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            )}
          </>
        ) : (
          <button
            disabled
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
          >
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </button>
        )}
      </div>

      {/* Troubleshooting */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Troubleshooting:</p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Make sure the fingerprint bridge server is running</li>
            <li>Check that your fingerprint scanner is connected</li>
            <li>Try unplugging and replugging the device</li>
            <li>Restart the bridge server</li>
          </ul>
          <button
            onClick={checkDevice}
            className="mt-3 w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
}
