'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { psychologyIntakeApi, GenerateIntakeTokenResponse } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { X, Loader2, Copy, Check, QrCode, Send, Calendar, ExternalLink } from 'lucide-react';

interface GenerateIntakeLinkModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GenerateIntakeLinkModal({ patientId, patientName, onClose, onSuccess }: GenerateIntakeLinkModalProps) {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [intakeData, setIntakeData] = useState<GenerateIntakeTokenResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[GenerateIntakeModal] Generating token for patient:', patientId);
      const response = await psychologyIntakeApi.generateToken({ patient_id: patientId });
      console.log('[GenerateIntakeModal] Token response:', response);
      setIntakeData(response);
      
      // Generate QR code
      console.log('[GenerateIntakeModal] Generating QR code for URL:', response.shareable_link);
      const qrDataUrl = await QRCode.toDataURL(response.shareable_link, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      console.log('[GenerateIntakeModal] QR code generated successfully');
      setQrCodeUrl(qrDataUrl);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[GenerateIntakeModal] Error generating token:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount
  useEffect(() => {
    let mounted = true;
    
    const generate = async () => {
      if (mounted) {
        await handleGenerate();
      }
    };
    
    generate();
    
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const handleCopyLink = async () => {
    if (!intakeData) return;
    
    try {
      await navigator.clipboard.writeText(intakeData.shareable_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <QrCode className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Psychology Intake Form
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For: {patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!intakeData ? (
            // Initial state
            <>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  What is this?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Generate a secure QR code for the patient to scan</li>
                  <li>• Patient fills mental health screening on their phone</li>
                  <li>• No login required - one-time use only</li>
                  <li>• Link expires in 24 hours</li>
                  <li>• Review completed intake before therapy session</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Generate Intake Form
                  </>
                )}
              </button>
            </>
          ) : (
            // Generated state
            <>
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-neutral-900 rounded-lg">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for intake form"
                      className="w-64 h-64"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Patient can scan this QR code with their phone camera to access the intake form
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Expires: {formatExpiryDate(intakeData.expires_at)}</span>
                </div>

                <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or copy and share link:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={intakeData.shareable_link}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Important:</strong> This link can only be used once. After the patient submits the form, the link will expire.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <a
                  href={intakeData.shareable_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview Form
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
