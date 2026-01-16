'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getErrorMessage } from '@/lib/api';
import { assessmentTokenApi } from '@/lib/assessment-token';
import { X, Loader2, Copy, Check, QrCode as QrCodeIcon, Send, ExternalLink, FileText } from 'lucide-react';

type AssessmentType = 'phq9' | 'gad7' | 'auditc';

interface GenerateAssessmentLinkModalProps {
  patientId: string;
  patientName: string;
  assessmentType: AssessmentType;
  onClose: () => void;
}

const assessmentConfig = {
  phq9: {
    title: 'PHQ-9 Depression Assessment',
    description: 'Patient Health Questionnaire - 9 questions to assess depression severity',
    color: 'blue',
    icon: '🧠',
  },
  gad7: {
    title: 'GAD-7 Anxiety Assessment',
    description: 'Generalized Anxiety Disorder - 7 questions to assess anxiety severity',
    color: 'purple',
    icon: '😰',
  },
  auditc: {
    title: 'AUDIT-C Alcohol Screening',
    description: '3 questions to screen for alcohol use disorder',
    color: 'orange',
    icon: '🍺',
  },
};

export function GenerateAssessmentLinkModal({ 
  patientId, 
  patientName, 
  assessmentType,
  onClose 
}: GenerateAssessmentLinkModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentToken, setAssessmentToken] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'share' | 'fill' | null>(null);

  const config = assessmentConfig[assessmentType];

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call backend API to generate assessment token
      const response = await assessmentTokenApi.generateToken({
        patient_id: patientId,
        assessment_type: assessmentType,
      });
      
      // Create full URL from relative path using network-accessible URL
      // Use NEXT_PUBLIC_APP_URL if set, otherwise fall back to window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const fullUrl = `${baseUrl}${response.shareable_link}`;
      
      setAssessmentToken(response.token);
      setShareableLink(fullUrl);
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(fullUrl, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      setQrCodeUrl(qrDataUrl);
      
    } catch (err) {
      console.error('[GenerateAssessmentModal] Error generating token:', err);
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
      // Navigate to assessment form
      window.location.href = `/dashboard/psychology/assessments/${assessmentType}/${patientId}`;
    }
  };

  useEffect(() => {
    // Don't auto-generate, wait for user to select option
    setLoading(false);
  }, []);

  const handleCopy = async () => {
    if (shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleShare = async () => {
    if (shareableLink && typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${config.title} for ${patientName}`,
          text: `Please complete your ${config.title}`,
          url: shareableLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{config.icon}</span>
              {config.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {showOptions && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how you want to administer this assessment:
              </p>

              {/* Share Option */}
              <button
                onClick={() => handleOptionSelect('share')}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <QrCodeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      📱 Share via QR Code or Link
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate a QR code and shareable link. Patient can complete the assessment on their own device at their convenience.
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
                      Fill out the assessment together on this device. You or the patient can input responses directly into the system.
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

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={handleGenerate}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !showOptions && shareableLink && (
            <>
              {formSubmitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-3">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Assessment Completed! ✅
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    The patient has successfully submitted their {config.title}.
                  </p>
                </div>
              ) : (
                <>
                  {/* Description */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {config.description}
                    </p>
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                        <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Patient can scan this QR code to access the assessment
                      </p>
                    </div>
                  )}

                  {/* Shareable Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Shareable Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareableLink}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
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

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        Share Link
                      </button>
                    )}
                    <a
                      href={shareableLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </a>
                  </div>

                  {/* Instructions */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      📱 How to share:
                    </h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      <li>• Have the patient scan the QR code with their phone camera</li>
                      <li>• Or copy and send the link via SMS, email, or messaging app</li>
                      <li>• The assessment is mobile-friendly and can be completed anywhere</li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
