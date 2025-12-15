'use client';

import { useState } from 'react';
import { psychologyIntakeApi, ScreeningFrequency, SubstanceUseFrequency, ReferralSource, SessionPreference } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { X, Loader2, Save } from 'lucide-react';

interface ManualIntakeData {
  patient_id: string;
  feeling_nervous: ScreeningFrequency;
  uncontrolled_worrying: ScreeningFrequency;
  feeling_depressed: ScreeningFrequency;
  little_interest: ScreeningFrequency;
  suicidal_thoughts: ScreeningFrequency;
  substance_use_frequency: SubstanceUseFrequency;
  substances_used: string | null;
  physical_health_conditions: string | null;
  has_prior_therapy: boolean;
  prior_therapy_details: string | null;
  presenting_concern: string;
  referral_source: ReferralSource;
  referral_source_other: string | null;
  session_preference: SessionPreference;
  submitted_via: 'staff';
}

interface ManualIntakeFormProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManualIntakeForm({ patientId, patientName, onClose, onSuccess }: ManualIntakeFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ManualIntakeData>({
    patient_id: patientId,
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
    submitted_via: 'staff',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.presenting_concern.trim()) {
      setError('Please describe what brings the patient to therapy');
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
      
      await psychologyIntakeApi.createManual(formData);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const frequencyOptions: ScreeningFrequency[] = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
  const substanceOptions: SubstanceUseFrequency[] = ['Never', 'Rarely', 'Sometimes', 'Frequently'];
  const referralOptions: ReferralSource[] = ['Google search', 'Social media', 'Friend', 'Family', 'Healthcare provider', 'Workplace/school', 'Returning client', 'Community org', 'Other'];
  const sessionOptions: SessionPreference[] = ['Physical', 'Virtual/Online'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manual Intake Entry</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">For: {patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-medium text-gray-900 dark:text-white">
              Presenting Concern <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.presenting_concern}
              onChange={(e) => setFormData({ ...formData, presenting_concern: e.target.value })}
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Mental Health Screening</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Little interest</label>
                <select value={formData.little_interest} onChange={(e) => setFormData({ ...formData, little_interest: e.target.value as ScreeningFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Feeling depressed</label>
                <select value={formData.feeling_depressed} onChange={(e) => setFormData({ ...formData, feeling_depressed: e.target.value as ScreeningFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Feeling nervous</label>
                <select value={formData.feeling_nervous} onChange={(e) => setFormData({ ...formData, feeling_nervous: e.target.value as ScreeningFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Uncontrolled worrying</label>
                <select value={formData.uncontrolled_worrying} onChange={(e) => setFormData({ ...formData, uncontrolled_worrying: e.target.value as ScreeningFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Suicidal thoughts</label>
                <select value={formData.suicidal_thoughts} onChange={(e) => setFormData({ ...formData, suicidal_thoughts: e.target.value as ScreeningFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Substance Use</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select value={formData.substance_use_frequency} onChange={(e) => setFormData({ ...formData, substance_use_frequency: e.target.value as SubstanceUseFrequency })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                {substanceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            
            {formData.substance_use_frequency !== 'Never' && (
              <textarea
                value={formData.substances_used || ''}
                onChange={(e) => setFormData({ ...formData, substances_used: e.target.value })}
                rows={2}
                placeholder="Details..."
                className="w-full px-4 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white"
              />
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Health & History</h3>
            <textarea
              value={formData.physical_health_conditions || ''}
              onChange={(e) => setFormData({ ...formData, physical_health_conditions: e.target.value || null })}
              rows={2}
              placeholder="Physical health conditions (optional)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white"
            />
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_prior_therapy}
                onChange={(e) => setFormData({ ...formData, has_prior_therapy: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Has prior therapy experience</span>
            </label>
            
            {formData.has_prior_therapy && (
              <textarea
                value={formData.prior_therapy_details || ''}
                onChange={(e) => setFormData({ ...formData, prior_therapy_details: e.target.value })}
                rows={2}
                placeholder="Prior therapy details"
                className="w-full px-4 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white"
              />
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Referral & Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Referral source</label>
                <select value={formData.referral_source} onChange={(e) => setFormData({ ...formData, referral_source: e.target.value as ReferralSource })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {referralOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session preference</label>
                <select value={formData.session_preference} onChange={(e) => setFormData({ ...formData, session_preference: e.target.value as SessionPreference })} className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white">
                  {sessionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            
            {formData.referral_source === 'Other' && (
              <input
                type="text"
                value={formData.referral_source_other || ''}
                onChange={(e) => setFormData({ ...formData, referral_source_other: e.target.value })}
                placeholder="Other referral source"
                className="w-full px-3 py-2 border rounded-lg dark:bg-neutral-900 dark:text-white"
              />
            )}
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 text-gray-900 dark:text-white font-semibold rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Intake
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
