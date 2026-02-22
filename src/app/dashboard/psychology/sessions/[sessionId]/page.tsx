'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Calendar, Clock, Brain, FileText, User } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { psychologyApi, CounselingSession } from '@/lib/psychology';
import { patientsApi, Patient } from '@/lib/patients';

export default function TherapySessionDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<CounselingSession | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessionData = await psychologyApi.getSession(sessionId);
        setSession(sessionData);

        const patientData = await patientsApi.getById(sessionData.patient_id);
        setPatient(patientData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  if (error || !session || !patient) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/psychology"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">
              {error || 'Unable to load session details.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/dashboard/psychology/patients/${patient.id}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Psychology
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Therapy Session Details</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Session ID: {session.id}</p>
          </div>
          <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
            {session.session_type}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h2>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Name: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {patient.first_name} {patient.last_name}
            </span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Hospital #: </span>
            <span className="font-medium text-gray-900 dark:text-white">{patient.hospital_no}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Session Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {formatDateTime(session.session_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {session.duration_minutes ?? 'N/A'} minutes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Presenting Concerns</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(session.presenting_concerns || []).map((area, idx) => (
                  <span
                    key={`${area}-${idx}`}
                    className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Notes</h2>
        </div>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          {session.subjective && (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Subjective</p>
              <p className="whitespace-pre-wrap">{session.subjective}</p>
            </div>
          )}
          {session.objective && (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Objective</p>
              <p className="whitespace-pre-wrap">{session.objective}</p>
            </div>
          )}
          {session.assessment && (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Assessment</p>
              <p className="whitespace-pre-wrap">{session.assessment}</p>
            </div>
          )}
          {session.plan && (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Plan</p>
              <p className="whitespace-pre-wrap">{session.plan}</p>
            </div>
          )}
          {session.homework_assigned && (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Homework Assigned</p>
              <p className="whitespace-pre-wrap">{session.homework_assigned}</p>
            </div>
          )}
        </div>
      </div>

      {session.next_session_scheduled && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Next Session Scheduled
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            {formatDateTime(session.next_session_scheduled)}
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p>Created: {formatDateTime(session.created_at)}</p>
        {session.updated_at !== session.created_at && <p>Last updated: {formatDateTime(session.updated_at)}</p>}
      </div>
    </div>
  );
}

