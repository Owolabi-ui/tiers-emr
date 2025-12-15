'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { psychologyApi, CreateGAD7Request, calculateGAD7Score } from '@/lib/psychology';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Brain,
  Info,
} from 'lucide-react';
import Link from 'next/link';

const gad7Questions = [
  { key: 'feeling_nervous', label: 'Feeling nervous, anxious, or on edge' },
  { key: 'cant_stop_worrying', label: 'Not being able to stop or control worrying' },
  { key: 'worrying_too_much', label: 'Worrying too much about different things' },
  { key: 'trouble_relaxing', label: 'Trouble relaxing' },
  { key: 'restless', label: 'Being so restless that it is hard to sit still' },
  { key: 'easily_annoyed', label: 'Becoming easily annoyed or irritable' },
  { key: 'feeling_afraid', label: 'Feeling afraid, as if something awful might happen' },
];

const frequencyOptions = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const difficultyOptions = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult',
];

export default function GAD7AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.patientId as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<{ total: number; severity: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateGAD7Request>({
    defaultValues: {
      patient_id: patientId,
      assessment_date: new Date().toISOString().split('T')[0],
      feeling_nervous: 0,
      cant_stop_worrying: 0,
      worrying_too_much: 0,
      trouble_relaxing: 0,
      restless: 0,
      easily_annoyed: 0,
      feeling_afraid: 0,
    },
  });

  const watchedValues = watch();

  const calculateCurrentScore = () => {
    const score = calculateGAD7Score(watchedValues);
    setCurrentScore(score);
  };

  const onSubmit = async (data: CreateGAD7Request) => {
    try {
      setLoading(true);
      setError(null);
      
      await psychologyApi.createGAD7({
        ...data,
        patient_id: patientId,
      });

      router.push(`/dashboard/psychology/patients/${patientId}`);
    } catch (err) {
      console.error('Error creating GAD-7 assessment:', err);
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
            <Brain className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            GAD-7 Anxiety Screening
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generalized Anxiety Disorder - 7 items
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900 dark:text-purple-100">
            <p className="font-medium mb-1">Instructions</p>
            <p>Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?</p>
          </div>
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
        {/* Assessment Date */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assessment Date
          </label>
          <input
            type="date"
            {...register('assessment_date', { required: 'Assessment date is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
          />
          {errors.assessment_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assessment_date.message}</p>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Screening Questions</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {gad7Questions.map((question, index) => (
              <div key={question.key} className="p-6">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  {index + 1}. {question.label}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {frequencyOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register(question.key as keyof CreateGAD7Request, {
                          required: true,
                          valueAsNumber: true,
                        })}
                        onChange={calculateCurrentScore}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Question */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            If you checked off any problems, how <strong>difficult</strong> have these problems made it for you to do your work, take care of things at home, or get along with other people?
          </p>
          <select
            {...register('difficulty_level')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
          >
            <option value="">Select difficulty level</option>
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Current Score Display */}
        {currentScore && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{currentScore.total}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Severity</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  currentScore.severity === 'Minimal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  currentScore.severity === 'Mild' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  currentScore.severity === 'Moderate' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {currentScore.severity}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-1">Score Interpretation:</p>
              <ul className="space-y-1">
                <li>• 0-4: Minimal anxiety</li>
                <li>• 5-9: Mild anxiety</li>
                <li>• 10-14: Moderate anxiety</li>
                <li>• 15-21: Severe anxiety</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clinical Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
            placeholder="Any additional observations or context..."
          />
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
            type="button"
            onClick={calculateCurrentScore}
            className="px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
          >
            Calculate Score
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Assessment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
