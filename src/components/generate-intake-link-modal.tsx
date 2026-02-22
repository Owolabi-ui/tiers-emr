'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { psychologyIntakeApi, GenerateIntakeTokenResponse } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { X, Loader2, Copy, Check, QrCode, Send, Calendar, ExternalLink, FileText } from 'lucide-react';

interface GenerateIntakeLinkModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmitted?: () => void;
}

export function GenerateIntakeLinkModal({
  patientId,
  patientName,
  onClose,
  onSuccess,
  onSubmitted,
}: GenerateIntakeLinkModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakeData, setIntakeData] = useState<GenerateIntakeTokenResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'share' | 'fill' | null>(null);

  const resolveShareableLink = (link: string) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (/^https?:\/\//i.test(link)) {
      if (isDevelopment) {
        try {
          const parsed = new URL(link);
          return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
          return link;
        }
      }
      return link;
    }

    const baseUrl = (
      isDevelopment ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    ).replace(/\/$/, '');
    const normalizedPath = link.startsWith('/') ? link : `/${link}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[GenerateIntakeModal] Generating token for patient:', patientId);
      const response = await psychologyIntakeApi.generateToken({ patient_id: patientId });
      console.log('[GenerateIntakeModal] Token response:', response);

      const fullUrl = resolveShareableLink(response.shareable_link);
      const updatedResponse = { ...response, shareable_link: fullUrl };
      setIntakeData(updatedResponse);
      
      // Generate QR code
      console.log('[GenerateIntakeModal] Generating QR code for URL:', fullUrl);
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
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

  const handleOptionSelect = (option: 'share' | 'fill') => {
    setSelectedOption(option);
    setShowOptions(false);
    
    if (option === 'share') {
      handleGenerate();
    } else if (option === 'fill') {
      // Client-side navigation keeps app context and avoids full reload.
      router.push(`/dashboard/psychology/intake/new/${patientId}?mode=fill`);
    }
  };

  // Poll for form submission every 3 seconds
  useEffect(() => {
    if (!intakeData || formSubmitted) return;

    const pollInterval = setInterval(async () => {
      try {
        // Token-level polling avoids false positives from older completed intake rows.
        await psychologyIntakeApi.getPublicForm(intakeData.token);
      } catch (err: any) {
        const message = String(err?.response?.data?.error || err?.message || '').toLowerCase();
        if (message.includes('token already used')) {
          setFormSubmitted(true);
          onSubmitted?.();
          clearInterval(pollInterval);
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(pollInterval);
  }, [intakeData, formSubmitted]);

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
          {showOptions && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how you want the patient to complete the intake form:
              </p>

              {/* Share Option */}
              <button
                onClick={() => handleOptionSelect('share')}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <QrCode className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      📱 Share via QR Code or Link
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate a QR code and shareable link. Patient can complete the intake form on their own device before or after the session.
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                      Best for patients with smartphones
                    </p>
                  </div>
                </div>
              </button>

              {/* Fill Now Option */}
              <button
                onClick={() => handleOptionSelect('fill')}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      💻 Fill Now (Assisted)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fill out the intake form together on this device. You or the patient can input responses directly into the system.
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                      Best for patients without phones or during in-person sessions
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {loading && !showOptions && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          )}

          {!intakeData && !showOptions && !loading && (
            // Error state
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
          )}

          {intakeData && !showOptions && (
            // Generated state
            <>
              {formSubmitted && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Form Submitted!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {patientName} has completed the intake form
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  {formSubmitted ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ✓ Patient has submitted their intake form
                    </span>
                  ) : (
                    'Patient can scan this QR code with their phone camera to access the intake form'
                  )}
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
