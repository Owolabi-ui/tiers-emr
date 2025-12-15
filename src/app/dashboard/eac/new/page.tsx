'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { eacApi, EacTrigger } from '@/lib/eac';
import { patientsApi } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  Loader2,
  User,
  FileText,
} from 'lucide-react';

const triggerOptions: { value: EacTrigger; label: string; description: string }[] = [
  { 
    value: 'High Viral Load', 
    label: 'High Viral Load',
    description: 'VL > 1000 copies/mL' 
  },
  { 
    value: 'Missed Appointments', 
    label: 'Missed Appointments',
    description: 'Multiple missed clinic/refill visits' 
  },
  { 
    value: 'Poor Adherence', 
    label: 'Poor Adherence',
    description: 'Self-reported or observed' 
  },
  { 
    value: 'Treatment Interruption', 
    label: 'Treatment Interruption',
    description: 'Gap in medication pickup' 
  },
  { 
    value: 'Clinical Deterioration', 
    label: 'Clinical Deterioration',
    description: 'WHO stage progression, etc.' 
  },
];

export default function InitiateEacPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();

  const patientId = searchParams.get('patient_id');
  const artId = searchParams.get('art_id');

  const [patientName, setPatientName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [formData, setFormData] = useState({
    trigger_reason: '' as EacTrigger | '',
    trigger_details: '',
    baseline_viral_load: '',
    baseline_vl_date: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!patientId || !artId) {
      showError('Missing patient or ART information');
      router.back();
      return;
    }

    const fetchPatient = async () => {
      try {
        const patient = await patientsApi.getById(patientId);
        setPatientName(patient.first_name + ' ' + patient.last_name);
      } catch (err) {
        console.error('Failed to fetch patient:', err);
        showError('Failed to load patient information');
      } finally {
        setLoadingPatient(false);
      }
    };

    fetchPatient();
  }, [patientId, artId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trigger_reason) {
      showError('Please select a trigger reason');
      return;
    }

    if (!patientId || !artId) {
      showError('Missing required information');
      return;
    }

    try {
      setLoading(true);

      const episode = await eacApi.createEpisode({
        patient_id: patientId,
        art_id: artId,
        trigger_reason: formData.trigger_reason,
        trigger_details: formData.trigger_details || undefined,
        baseline_viral_load: formData.baseline_viral_load ? parseFloat(formData.baseline_viral_load) : undefined,
        baseline_vl_date: formData.baseline_vl_date || undefined,
        start_date: formData.start_date,
      });

      showSuccess('EAC episode initiated successfully');
      router.push(`/dashboard/eac/${episode.id}`);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading patient information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg mt-1"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              Initiate Enhanced Adherence Counseling
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Start a 3-session EAC intervention for adherence support
            </p>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <User className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Patient</p>
            <p className="text-base font-semibold">{patientName}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trigger Reason */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            EAC Trigger Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trigger Reason *
              </label>
              <div className="space-y-2">
                {triggerOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.trigger_reason === option.value
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="trigger_reason"
                      value={option.value}
                      checked={formData.trigger_reason === option.value}
                      onChange={(e) => setFormData({ ...formData, trigger_reason: e.target.value as EacTrigger })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trigger Details
              </label>
              <textarea
                value={formData.trigger_details}
                onChange={(e) => setFormData({ ...formData, trigger_details: e.target.value })}
                rows={3}
                placeholder="e.g., VL: 5,450 copies/mL on recent test; Missed last 2 refill appointments"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Baseline Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Baseline Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Baseline Viral Load (copies/mL)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.baseline_viral_load}
                onChange={(e) => setFormData({ ...formData, baseline_viral_load: e.target.value })}
                placeholder="e.g., 5450"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Baseline VL Date
              </label>
              <input
                type="date"
                value={formData.baseline_vl_date}
                onChange={(e) => setFormData({ ...formData, baseline_vl_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                EAC Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-medium mb-1">EAC Protocol:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>3 counseling sessions will be scheduled over ~3 months</li>
                <li>Each session tracks barriers and interventions</li>
                <li>Repeat viral load recommended after completing all sessions</li>
                <li>Patient ART status will be updated to "On EAC"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.trigger_reason}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initiating EAC...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Initiate EAC Episode
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
