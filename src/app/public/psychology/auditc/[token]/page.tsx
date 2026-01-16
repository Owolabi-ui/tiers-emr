'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assessmentTokenApi, AUDITCSubmission } from '@/lib/assessment-token';
import { getErrorMessage } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, Wine } from 'lucide-react';

export default function PublicAuditCPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientId, setPatientId] = useState('');
  
  const [formData, setFormData] = useState<AUDITCSubmission>({
    q1_frequency: 0,
    q2_quantity: 0,
    q3_binge: 0,
  });

  const questions = [
    {
      id: 'q1_frequency',
      text: 'How often do you have a drink containing alcohol?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Monthly or less' },
        { value: 2, label: '2-4 times per month' },
        { value: 3, label: '2-3 times per week' },
        { value: 4, label: '4+ times per week' },
      ],
    },
    {
      id: 'q2_quantity',
      text: 'How many drinks containing alcohol do you have on a typical day when you are drinking?',
      options: [
        { value: 0, label: '1-2' },
        { value: 1, label: '3-4' },
        { value: 2, label: '5-6' },
        { value: 3, label: '7-9' },
        { value: 4, label: '10+' },
      ],
    },
    {
      id: 'q3_binge',
      text: 'How often do you have 6 or more drinks on one occasion?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
  ];

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await assessmentTokenApi.getAUDITCForm(token);
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
      
      await assessmentTokenApi.submitAUDITC(token, formData);
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
    setFormData((prev: AUDITCSubmission) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Thank you for completing the AUDIT-C alcohol screening. Your responses have been recorded.
          </p>
          <p className="text-sm text-gray-500">Your healthcare provider will review your results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
              <Wine className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AUDIT-C Alcohol Screening</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alcohol Use Disorders Identification Test</p>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Instructions:</strong> Please answer the following questions about your alcohol consumption.
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
                {question.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={formData[question.id as keyof AUDITCSubmission] === option.value}
                      onChange={() => handleChange(question.id, option.value)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500"
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
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
