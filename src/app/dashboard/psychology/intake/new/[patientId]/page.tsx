'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { patientsApi, Patient } from '@/lib/patients';
import { psychologyIntakeApi } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { GenerateIntakeLinkModal } from '@/components/generate-intake-link-modal';
import { ManualIntakeForm } from '@/components/manual-intake-form';
import { ArrowLeft, Loader2, AlertCircle, QrCode, FileText } from 'lucide-react';

export default function QuickPsychologyIntakeLauncherPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params?.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [hasIntake, setHasIntake] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const refreshIntakeStatus = async () => {
    try {
      const status = await psychologyIntakeApi.checkIntakeStatus(patientId);
      if (status.completed) {
        setHasIntake(true);
        setSubmitSuccess(true);
      }
    } catch {
      // Non-blocking status check; keep launcher usable even if this fails.
    }
  };

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const [patientData, intakeHistory] = await Promise.all([
          patientsApi.getById(patientId),
          psychologyIntakeApi.getIntakeHistory(patientId).catch(() => []),
        ]);
        setPatient(patientData);
        setHasIntake(intakeHistory.length > 0);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  useEffect(() => {
    if (searchParams.get('mode') === 'fill' && patient) {
      setShowManualModal(true);
    }
  }, [searchParams, patient]);

  useEffect(() => {
    if (patientId) {
      refreshIntakeStatus();
    }
  }, [patientId]);

  useEffect(() => {
    const handleFocus = () => {
      if (patientId) {
        refreshIntakeStatus();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">
              {error || 'Unable to load patient information.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Profile
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Intake for: {patientName}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Hospital #: <span className="font-medium">{patient.hospital_no}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {hasIntake ? '✓ Previous intake on file' : 'No previous intake'}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Generate QR Code
          </button>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Fill Now (Assisted)
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            ✓ Intake form submitted! Psychologist has been notified.
          </p>
        </div>
      )}

      {showQrModal && (
        <GenerateIntakeLinkModal
          patientId={patient.id}
          patientName={patientName}
          onClose={() => {
            setShowQrModal(false);
            refreshIntakeStatus();
          }}
          onSubmitted={() => {
            setSubmitSuccess(true);
            setHasIntake(true);
          }}
        />
      )}

      {showManualModal && (
        <ManualIntakeForm
          patientId={patient.id}
          patientName={patientName}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setSubmitSuccess(true);
            setHasIntake(true);
          }}
        />
      )}
    </div>
  );
}
