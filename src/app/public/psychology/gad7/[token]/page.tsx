'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assessmentTokenApi, GAD7Submission } from '@/lib/assessment-token';
import { getErrorMessage } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, Brain } from 'lucide-react';

export default function PublicGAD7Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientId, setPatientId] = useState('');
  
  const [formData, setFormData] = useState<GAD7Submission>({
    q1_nervous: 0,
    q2_control_worry: 0,
    q3_worry_too_much: 0,
    q4_trouble_relaxing: 0,
    q5_restless: 0,
    q6_irritable: 0,
    q7_afraid: 0,
  });

  const questions = [
    { id: 'q1_nervous', text: 'Feeling nervous, anxious, or on edge' },
    { id: 'q2_control_worry', text: 'Not being able to stop or control worrying' },
    { id: 'q3_worry_too_much', text: 'Worrying too much about different things' },
    { id: 'q4_trouble_relaxing', text: 'Trouble relaxing' },
    { id: 'q5_restless', text: 'Being so restless that it\'s hard to sit still' },
    { id: 'q6_irritable', text: 'Becoming easily annoyed or irritable' },
    { id: 'q7_afraid', text: 'Feeling afraid as if something awful might happen' },
  ];

  const options = [
    { value: 0, label: 'Not at all' },
    { value: 1, label: 'Several days' },
    { value: 2, label: 'More than half the days' },
    { value: 3, label: 'Nearly every day' },
  ];

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await assessmentTokenApi.getGAD7Form(token);
      setPatientId(response.patient_id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      await assessmentTokenApi.submitGAD7(token, formData);
      setSuccess(true);
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push('/public/psychology/assessment/success');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (questionId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please contact your healthcare provider for a new assessment link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Thank you for completing the GAD-7 anxiety screening. Your responses have been recorded.
          </p>
          <p className="text-sm text-gray-500">Your healthcare provider will review your results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GAD-7 Anxiety Screening</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generalized Anxiety Disorder Assessment</p>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by the following problems?
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {index + 1}. {question.text}
              </h3>
              
              <div className="space-y-2">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={formData[question.id as keyof GAD7Submission] === option.value}
                      onChange={() => handleChange(question.id, option.value)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      required
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Your responses are confidential and will only be shared with your healthcare provider.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
