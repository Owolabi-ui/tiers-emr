'use client';

import { useState } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { prepApi } from '@/lib/prep';
import { getErrorMessage } from '@/lib/api';

interface PrepFollowupFormProps {
  commencementId: string;
  patientName: string;
  lastVisitDate: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PrepFollowupForm({
  commencementId,
  patientName,
  lastVisitDate,
  onSuccess,
  onCancel,
}: PrepFollowupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: 'Routine' as 'Routine' | 'Unscheduled',
    clinical_notes: '',
    adherence_good: true,
    adherence_notes: '',
    side_effects_reported: false,
    side_effects_details: '',
    hiv_test_done: false,
    hiv_test_result: null as 'Non-reactive' | 'Reactive' | null,
    seroconversion_detected: false,
    next_appointment_date: '',
  });

  // Calculate days since last visit
  const daysSinceLastVisit = lastVisitDate 
    ? Math.floor((new Date().getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysSinceLastVisit !== null && daysSinceLastVisit > 90;
  const isIITRisk = daysSinceLastVisit !== null && daysSinceLastVisit > 28;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.visit_date) {
        throw new Error('Visit date is required');
      }

      if (formData.side_effects_reported && !formData.side_effects_details) {
        throw new Error('Please provide details about side effects');
      }

      if (formData.hiv_test_done && !formData.hiv_test_result) {
        throw new Error('Please select HIV test result');
      }

      // Check for seroconversion
      const seroconversion = formData.hiv_test_result === 'Reactive';

      // Note: The API types need updating - this matches backend expectations
      await prepApi.createFollowup({
        prep_commencement_id: commencementId,
        patient_id: '', // Will be looked up by backend
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        clinical_notes: formData.clinical_notes || null,
        adherence_good: formData.adherence_good,
        adherence_notes: formData.adherence_notes || null,
        side_effects_reported: formData.side_effects_reported,
        side_effects_details: formData.side_effects_details || null,
        hiv_test_done: formData.hiv_test_done,
        hiv_test_result: formData.hiv_test_result,
        seroconversion_detected: seroconversion,
        next_appointment_date: formData.next_appointment_date || null,
      } as any);

      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">PREP Follow-up Visit</h2>
              <p className="text-sm text-gray-500">{patientName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alert for overdue visits */}
          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Patient Overdue for Follow-up</p>
                <p className="text-sm text-red-700 mt-1">
                  Last visit was {daysSinceLastVisit} days ago. Consider IIT/LTFU tracking.
                </p>
              </div>
            </div>
          )}

          {isIITRisk && !isOverdue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">At Risk for IIT</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Last visit was {daysSinceLastVisit} days ago (&gt;28 days).
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Visit Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date *
                </label>
                <input
                  type="date"
                  id="visit_date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="visit_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Type *
                </label>
                <select
                  id="visit_type"
                  value={formData.visit_type}
                  onChange={(e) => setFormData({ ...formData, visit_type: e.target.value as 'Routine' | 'Unscheduled' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Routine">Routine</option>
                  <option value="Unscheduled">Unscheduled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Adherence Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Adherence Assessment</h3>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.adherence_good === true}
                  onChange={() => setFormData({ ...formData, adherence_good: true })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Good Adherence
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.adherence_good === false}
                  onChange={() => setFormData({ ...formData, adherence_good: false })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Poor Adherence
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="adherence_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Adherence Notes
              </label>
              <textarea
                id="adherence_notes"
                value={formData.adherence_notes}
                onChange={(e) => setFormData({ ...formData, adherence_notes: e.target.value })}
                rows={2}
                placeholder="Notes about adherence, missed doses, barriers..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Side Effects */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Side Effects</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="side_effects_reported"
                checked={formData.side_effects_reported}
                onChange={(e) => setFormData({ ...formData, side_effects_reported: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="side_effects_reported" className="ml-3 text-sm text-gray-700">
                Patient reports side effects
              </label>
            </div>

            {formData.side_effects_reported && (
              <div>
                <label htmlFor="side_effects_details" className="block text-sm font-medium text-gray-700 mb-1">
                  Side Effects Details *
                </label>
                <textarea
                  id="side_effects_details"
                  value={formData.side_effects_details}
                  onChange={(e) => setFormData({ ...formData, side_effects_details: e.target.value })}
                  rows={2}
                  placeholder="Describe the side effects..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>

          {/* HIV Testing */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">HIV Testing</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hiv_test_done"
                checked={formData.hiv_test_done}
                onChange={(e) => setFormData({ ...formData, hiv_test_done: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hiv_test_done" className="ml-3 text-sm text-gray-700">
                HIV test performed during this visit
              </label>
            </div>

            {formData.hiv_test_done && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HIV Test Result *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hiv_test_result === 'Non-reactive'}
                      onChange={() => setFormData({ ...formData, hiv_test_result: 'Non-reactive' })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Non-reactive</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hiv_test_result === 'Reactive'}
                      onChange={() => setFormData({ ...formData, hiv_test_result: 'Reactive' })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-red-700 font-medium">Reactive (Seroconversion)</span>
                  </label>
                </div>

                {formData.hiv_test_result === 'Reactive' && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800">⚠️ HIV Seroconversion Detected</p>
                    <p className="text-sm text-red-700 mt-1">
                      Patient must be discontinued from PrEP and referred for HIV care and treatment.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          <div>
            <label htmlFor="clinical_notes" className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Notes
            </label>
            <textarea
              id="clinical_notes"
              value={formData.clinical_notes}
              onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
              rows={3}
              placeholder="Additional clinical observations, concerns, or recommendations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Next Appointment */}
          <div>
            <label htmlFor="next_appointment_date" className="block text-sm font-medium text-gray-700 mb-1">
              Next Appointment Date
            </label>
            <input
              type="date"
              id="next_appointment_date"
              value={formData.next_appointment_date}
              onChange={(e) => setFormData({ ...formData, next_appointment_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving Follow-up...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
