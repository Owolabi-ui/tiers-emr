'use client';

import { useState } from 'react';
import { X, AlertTriangle, UserX, ArrowRight } from 'lucide-react';
import { prepApi } from '@/lib/prep';
import { getErrorMessage } from '@/lib/api';

interface PrepStatusChangeFormProps {
  commencementId: string;
  patientName: string;
  currentStatus: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', description: 'Client actively on PrEP with regular follow-ups' },
  { value: 'IIT', label: 'IIT (Interruption In Treatment)', description: 'Missed appointments >28 days, tracking in progress' },
  { value: 'LTFU', label: 'LTFU (Lost To Follow-Up)', description: 'Unable to locate after tracking attempts' },
  { value: 'Discontinued', label: 'Discontinued', description: 'PrEP stopped (seroconversion, side effects, patient choice)' },
  { value: 'Transferred Out', label: 'Transferred Out', description: 'Transferred to another facility' },
];

export default function PrepStatusChangeForm({
  commencementId,
  patientName,
  currentStatus,
  onSuccess,
  onCancel,
}: PrepStatusChangeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    new_status: currentStatus,
    reason: '',
    tracking_attempts: 0,
    tracking_notes: '',
    transfer_to_facility: '',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (formData.new_status === currentStatus) {
        throw new Error('Please select a different status');
      }

      if (!formData.reason) {
        throw new Error('Reason for status change is required');
      }

      if (formData.new_status === 'IIT' || formData.new_status === 'LTFU') {
        if (formData.tracking_attempts === 0) {
          throw new Error('Number of tracking attempts is required for IIT/LTFU status');
        }
      }

      if (formData.new_status === 'Transferred Out' && !formData.transfer_to_facility) {
        throw new Error('Transfer facility is required for Transferred Out status');
      }

      // Call API to update status (this endpoint needs to be created in the backend)
      await prepApi.updateCommencementStatus(commencementId, {
        status: formData.new_status,
        reason: formData.reason,
        tracking_attempts: formData.tracking_attempts || null,
        tracking_notes: formData.tracking_notes || null,
        transfer_to_facility: formData.transfer_to_facility || null,
        effective_date: formData.effective_date,
      });

      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedStatus = STATUS_OPTIONS.find(s => s.value === formData.new_status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Change PREP Status</h2>
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
          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Current Status</p>
            <p className="text-lg font-semibold text-gray-900">{currentStatus}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Status *
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.new_status === status.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${status.value === currentStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    value={status.value}
                    checked={formData.new_status === status.value}
                    onChange={(e) => setFormData({ ...formData, new_status: e.target.value })}
                    disabled={status.value === currentStatus}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{status.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{status.description}</p>
                    </div>
                    {formData.new_status === status.value && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Effective Date */}
          <div>
            <label htmlFor="effective_date" className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              id="effective_date"
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Reason for Change */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Status Change *
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Explain why the status is being changed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* IIT/LTFU Specific Fields */}
          {(formData.new_status === 'IIT' || formData.new_status === 'LTFU') && (
            <div className="space-y-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Tracking Information Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Document tracking attempts made to locate the patient
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="tracking_attempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Tracking Attempts *
                </label>
                <input
                  type="number"
                  id="tracking_attempts"
                  value={formData.tracking_attempts}
                  onChange={(e) => setFormData({ ...formData, tracking_attempts: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="tracking_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Notes
                </label>
                <textarea
                  id="tracking_notes"
                  value={formData.tracking_notes}
                  onChange={(e) => setFormData({ ...formData, tracking_notes: e.target.value })}
                  rows={2}
                  placeholder="Details of phone calls, home visits, etc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Transferred Out Specific Fields */}
          {formData.new_status === 'Transferred Out' && (
            <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div>
                <label htmlFor="transfer_to_facility" className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer To Facility *
                </label>
                <input
                  type="text"
                  id="transfer_to_facility"
                  value={formData.transfer_to_facility}
                  onChange={(e) => setFormData({ ...formData, transfer_to_facility: e.target.value })}
                  placeholder="Name of the facility patient is transferring to..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Warning for Discontinued Status */}
          {formData.new_status === 'Discontinued' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <UserX className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Discontinuing PrEP</p>
                <p className="text-xs text-red-700 mt-1">
                  This will mark the patient as no longer on PrEP. Ensure proper documentation of the reason.
                </p>
              </div>
            </div>
          )}

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
              disabled={loading || formData.new_status === currentStatus}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Status...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
