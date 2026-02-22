'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { psychologyApi, CreateSessionRequest, sessionTypeOptions } from '@/lib/psychology';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Brain,
  Plus,
  X,
  Calendar,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const commonConcerns = [
  'Depression',
  'Anxiety',
  'Stress',
  'Relationship issues',
  'Grief/Loss',
  'Trauma',
  'Anger management',
  'Self-esteem',
  'Sleep problems',
  'Substance use',
];

const commonInterventions = [
  'Cognitive Behavioral Therapy (CBT)',
  'Psychoeducation',
  'Mindfulness techniques',
  'Breathing exercises',
  'Problem-solving',
  'Safety planning',
  'Goal setting',
  'Relaxation training',
  'Behavioral activation',
  'Supportive counseling',
];

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [interventions, setInterventions] = useState<string[]>([]);
  const [scheduleNextSession, setScheduleNextSession] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateSessionRequest>({
    defaultValues: {
      patient_id: patientId,
      session_date: new Date().toISOString().split('T')[0],
      session_type: 'Individual Therapy' as const,
      duration_minutes: 60,
      modality: 'In-person',
      presenting_concerns: [],
      interventions_used: [],
      goals_addressed: [],
      session_notes: '',
    },
  });

  const onSubmit = async (data: CreateSessionRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean up next_session_scheduled - convert empty string to undefined
      const rawNextSession = scheduleNextSession ? data.next_session_scheduled : undefined;
      const nextSessionDate = rawNextSession && rawNextSession.trim() !== ''
        ? rawNextSession
        : undefined;
      
      const sessionData: CreateSessionRequest = {
        ...data,
        patient_id: patientId,
        presenting_concerns: concerns,
        interventions_used: interventions,
        goals_addressed: [],
        next_session_scheduled: nextSessionDate,
      };
      
      await psychologyApi.createSession(sessionData);

      router.push(`/dashboard/psychology/patients/${patientId}`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/psychology/patients/${patientId}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            New Counseling Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Record therapy session notes and interventions
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Session Details */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Session Date *
              </label>
              <input
                type="date"
                {...register('session_date', { required: 'Session date is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              />
              {errors.session_date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.session_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Type *
              </label>
              <select
                {...register('session_type', { required: 'Session type is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              >
                {sessionTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.session_type && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.session_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Duration (minutes) *
              </label>
              <input
                type="number"
                {...register('duration_minutes', { 
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
                placeholder="60"
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule Next Session (Optional)
              </label>
              <label className="inline-flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={scheduleNextSession}
                  onChange={(e) => setScheduleNextSession(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-create follow-up appointment
                </span>
              </label>
              {scheduleNextSession && (
                <input
                  type="datetime-local"
                  {...register('next_session_scheduled')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
                />
              )}
              {scheduleNextSession && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  This will create an appointment record automatically for auditing.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Presenting Concerns */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Presenting Concerns</h2>
            <button
              type="button"
              onClick={() => setConcerns([...concerns, ''])}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Custom
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Common concerns (click to add):</p>
            <div className="flex flex-wrap gap-2">
              {commonConcerns.map((concern) => (
                <button
                  key={concern}
                  type="button"
                  onClick={() => setConcerns([...concerns, concern])}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {concerns.map((concern, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={concern}
                  onChange={(e) => {
                    const newConcerns = [...concerns];
                    newConcerns[index] = e.target.value;
                    setConcerns(newConcerns);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
                  placeholder="Describe presenting concern..."
                />
                <button
                  type="button"
                  onClick={() => setConcerns(concerns.filter((_, i) => i !== index))}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Interventions Used */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Interventions Used</h2>
            <button
              type="button"
              onClick={() => setInterventions([...interventions, ''])}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Custom
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Common interventions (click to add):</p>
            <div className="flex flex-wrap gap-2">
              {commonInterventions.map((intervention) => (
                <button
                  key={intervention}
                  type="button"
                  onClick={() => setInterventions([...interventions, intervention])}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  {intervention}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {interventions.map((intervention, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={intervention}
                  onChange={(e) => {
                    const newInterventions = [...interventions];
                    newInterventions[index] = e.target.value;
                    setInterventions(newInterventions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
                  placeholder="Describe intervention..."
                />
                <button
                  type="button"
                  onClick={() => setInterventions(interventions.filter((_, i) => i !== index))}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Session Notes */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Notes *
          </label>
          <textarea
            {...register('session_notes', { required: 'Session notes are required' })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
            placeholder="Document the session content, patient responses, and clinical observations..."
          />
          {errors.session_notes && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.session_notes.message}</p>
          )}
        </div>

        {/* Optional Fields */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information (Optional)</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Progress Notes
            </label>
            <textarea
              {...register('progress_notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              placeholder="Document progress towards goals..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Risk Assessment
            </label>
            <textarea
              {...register('risk_assessment')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              placeholder="Assess suicide/homicide risk, self-harm, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Safety Plan
            </label>
            <textarea
              {...register('safety_plan')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              placeholder="Crisis plan, emergency contacts, coping strategies..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Homework Assigned
            </label>
            <textarea
              {...register('homework_assigned')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              placeholder="Tasks or exercises for patient to complete before next session..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/psychology/patients/${patientId}`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Session
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
