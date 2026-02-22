'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { psychologyIntakeApi, SubmitPublicIntakeRequest, ScreeningFrequency, SubstanceUseFrequency, ReferralSource, SessionPreference } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, Heart, Brain } from 'lucide-react';

export default function PublicIntakePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState('');
  
  const [formData, setFormData] = useState<SubmitPublicIntakeRequest>({
    little_interest: 'Not at all',
    feeling_depressed: 'Not at all',
    feeling_nervous: 'Not at all',
    uncontrolled_worrying: 'Not at all',
    suicidal_thoughts: 'Not at all',
    substance_use_frequency: 'Never',
    substances_used: null,
    physical_health_conditions: null,
    has_prior_therapy: false,
    prior_therapy_details: null,
    presenting_concern: '',
    referral_source: 'Google search',
    referral_source_other: null,
    session_preference: 'Physical',
  });

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await psychologyIntakeApi.getPublicForm(token);
      setPatientName(response.patient_name);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.presenting_concern.trim()) {
      setError('Please describe what brings you to therapy today');
      return;
    }

    if (formData.substance_use_frequency !== 'Never' && !formData.substances_used?.trim()) {
      setError('Please provide details about substance use');
      return;
    }

    if (formData.has_prior_therapy && !formData.prior_therapy_details?.trim()) {
      setError('Please provide details about prior therapy');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await psychologyIntakeApi.submitPublicForm(token, formData);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const frequencyOptions: ScreeningFrequency[] = [
    'Not at all',
    'Several days',
    'More than half the days',
    'Nearly every day'
  ];

  const substanceOptions: SubstanceUseFrequency[] = [
    'Never',
    'Rarely',
    'Sometimes',
    'Frequently'
  ];

  const referralOptions: ReferralSource[] = [
    'Google search',
    'Social media (Instagram, TikTok, etc.)',
    'Referral from a friend',
    'Referral from family member',
    'Referral from a healthcare provider',
    'Workplace or school referral',
    'Returning client',
    'Community organization',
    'Other'
  ];

  const sessionOptions: SessionPreference[] = [
    'Physical',
    'Virtual/Online'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !patientName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact your psychologist for a new intake form link.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank You, {patientName}!
            </h1>
            <p className="text-lg text-gray-600">
              Your intake form has been submitted successfully.
            </p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-indigo-900 mb-4 text-lg flex items-center gap-2">
              📋 Before Your First Session:
            </h2>
            <ul className="space-y-3 text-indigo-800">
              <li className="flex items-start gap-3">
                <span className="font-bold text-xl">•</span>
                <span>Please arrive <strong>10-15 minutes early</strong> to complete any additional paperwork</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-xl">•</span>
                <span>If this is a <strong>virtual session</strong>, ensure you have a stable internet connection and a private space</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-xl">•</span>
                <span>Come prepared with any <strong>questions or concerns</strong> you'd like to discuss</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 text-center mb-6">
            <p className="text-green-900 font-semibold mb-2 flex items-center justify-center gap-2">
              <Heart className="h-5 w-5" />
              Your psychologist has been notified
            </p>
            <p className="text-sm text-green-700">
              They will review your information before your first session
            </p>
          </div>
          
          <p className="text-center text-gray-500 text-sm">
            You can now close this window
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Psychology Intake Form</h1>
              <p className="text-gray-600">Welcome, {patientName}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Confidential:</strong> This information helps your psychologist understand your needs before your first session.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Presenting Concern */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900">
              What brings you to therapy today? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.presenting_concern}
              onChange={(e) => setFormData({ ...formData, presenting_concern: e.target.value })}
              rows={4}
              required
              placeholder="Please describe in your own words what you're seeking help with..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mental Health Screening */}
          <div className="border-t pt-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-red-500" />
                Mental Health Screening
              </h2>
              <p className="text-sm text-gray-600">
                Over the last 2 weeks, how often have you been bothered by:
              </p>
            </div>

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                Little interest or pleasure in doing things?
              </label>
              <select
                value={formData.little_interest}
                onChange={(e) => setFormData({ ...formData, little_interest: e.target.value as ScreeningFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                Feeling down, depressed, or hopeless?
              </label>
              <select
                value={formData.feeling_depressed}
                onChange={(e) => setFormData({ ...formData, feeling_depressed: e.target.value as ScreeningFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                Feeling nervous, anxious, or on edge?
              </label>
              <select
                value={formData.feeling_nervous}
                onChange={(e) => setFormData({ ...formData, feeling_nervous: e.target.value as ScreeningFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                Not being able to stop or control worrying?
              </label>
              <select
                value={formData.uncontrolled_worrying}
                onChange={(e) => setFormData({ ...formData, uncontrolled_worrying: e.target.value as ScreeningFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* Suicide Risk */}
          <div className="border-t pt-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                Important Safety Question
              </p>
              <p className="text-sm text-red-700">
                If you are in crisis, please contact emergency services (911) or the National Suicide Prevention Lifeline (988) immediately.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                Thoughts of harming yourself or that you'd be better off dead?
              </label>
              <select
                value={formData.suicidal_thoughts}
                onChange={(e) => setFormData({ ...formData, suicidal_thoughts: e.target.value as ScreeningFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* Substance Use */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Substance Use</h3>
            
            <div className="space-y-3">
              <label className="block font-medium text-gray-900">
                How frequently do you use alcohol or other substances?
              </label>
              <select
                value={formData.substance_use_frequency}
                onChange={(e) => setFormData({ ...formData, substance_use_frequency: e.target.value as SubstanceUseFrequency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {substanceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {formData.substance_use_frequency !== 'Never' && (
              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  Please provide details (type, amount, frequency):
                </label>
                <textarea
                  value={formData.substances_used || ''}
                  onChange={(e) => setFormData({ ...formData, substances_used: e.target.value })}
                  rows={3}
                  placeholder="What substances? How much? How often?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Physical Health */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Physical Health</h3>
            
            <div className="space-y-2">
              <label className="block font-medium text-gray-900">
                Do you have any physical health conditions we should know about?
              </label>
              <textarea
                value={formData.physical_health_conditions || ''}
                onChange={(e) => setFormData({ ...formData, physical_health_conditions: e.target.value || null })}
                rows={3}
                placeholder="Chronic illnesses, medications, allergies, etc. (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Prior Therapy */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Prior Therapy Experience</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_prior_therapy}
                  onChange={(e) => setFormData({ ...formData, has_prior_therapy: e.target.checked, prior_therapy_details: e.target.checked ? formData.prior_therapy_details : null })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-medium text-gray-900">I have had therapy or counseling before</span>
              </label>
            </div>

            {formData.has_prior_therapy && (
              <div className="space-y-2">
                <label className="block font-medium text-gray-900">
                  Please tell us about your previous therapy experience:
                </label>
                <textarea
                  value={formData.prior_therapy_details || ''}
                  onChange={(e) => setFormData({ ...formData, prior_therapy_details: e.target.value })}
                  rows={3}
                  placeholder="When? What type? Was it helpful?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Referral & Preferences */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">How did you hear about us?</h3>
            
            <div className="space-y-3">
              <label className="block font-medium text-gray-900">Referral source:</label>
              <select
                value={formData.referral_source}
                onChange={(e) => setFormData({ ...formData, referral_source: e.target.value as ReferralSource })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {referralOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {formData.referral_source === 'Other' && (
              <div className="space-y-2">
                <label className="block font-medium text-gray-900">Please specify:</label>
                <input
                  type="text"
                  value={formData.referral_source_other || ''}
                  onChange={(e) => setFormData({ ...formData, referral_source_other: e.target.value })}
                  placeholder="How did you hear about us?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="block font-medium text-gray-900">Preferred session type:</label>
              <div className="grid grid-cols-2 gap-3">
                {sessionOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="session_preference"
                      value={option}
                      checked={formData.session_preference === option}
                      onChange={(e) => setFormData({ ...formData, session_preference: e.target.value as SessionPreference })}
                      className="text-indigo-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Submit Intake Form
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By submitting this form, you acknowledge that your information will be kept confidential and used only for providing psychological services.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
