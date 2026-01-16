'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  transfersApi,
  Transfer,
  getTransferStatusColor,
  getTransferReasonLabel,
} from '@/lib/transfers';
import { patientsApi, Patient } from '@/lib/patients';
import { clinicsApi, Clinic } from '@/lib/clinics';
import { useToast } from '@/components/toast-provider';

export default function TransferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const transferId = params.id as string;
  const { showSuccess, showError } = useToast();

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [fromClinic, setFromClinic] = useState<Clinic | null>(null);
  const [toClinic, setToClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransferDetails();
  }, [transferId]);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      const transferData = await transfersApi.getById(transferId);
      setTransfer(transferData);

      // Fetch related data
      const [patientData, clinics] = await Promise.all([
        patientsApi.getById(transferData.patient_id),
        clinicsApi.getAll(),
      ]);

      setPatient(patientData);
      setFromClinic(clinics.clinics.find((c: { id: string }) => c.id === transferData.from_clinic_id) || null);
      setToClinic(clinics.clinics.find((c: { id: string }) => c.id === transferData.to_clinic_id) || null);
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      showError('Failed to load transfer details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this transfer?')) return;

    try {
      await transfersApi.approve(transferId, { notes: 'Transfer approved' });
      showSuccess('Transfer approved successfully');
      fetchTransferDetails();
    } catch (error) {
      console.error('Error approving transfer:', error);
      showError('Failed to approve transfer');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await transfersApi.reject(transferId, { rejection_reason: reason });
      showSuccess('Transfer rejected');
      fetchTransferDetails();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      showError('Failed to reject transfer');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this transfer as completed?')) return;

    try {
      await transfersApi.complete(transferId, { notes: 'Transfer completed' });
      showSuccess('Transfer completed successfully! Patient clinic has been updated.');
      fetchTransferDetails();
    } catch (error) {
      console.error('Error completing transfer:', error);
      showError('Failed to complete transfer');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    try {
      await transfersApi.cancel(transferId, { cancellation_reason: reason });
      showSuccess('Transfer cancelled');
      fetchTransferDetails();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      showError('Failed to cancel transfer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading transfer details...</div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Transfer Not Found
          </h1>
          <Link
            href="/dashboard/transfers"
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            ← Back to Transfers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/transfers"
          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 mb-4 inline-block"
        >
          ← Back to Transfers
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {transfer.transfer_number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Patient Transfer Details
            </p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${getTransferStatusColor(
              transfer.status
            )}`}
          >
            {transfer.status}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {transfer.status === 'Pending' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve Transfer
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject Transfer
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel Transfer
            </button>
          </div>
        </div>
      )}

      {transfer.status === 'Approved' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 mb-6">
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Mark as Completed
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Patient Information
          </h2>
          {patient && (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Full Name</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {patient.first_name} {patient.middle_name} {patient.last_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hospital Number</div>
                <div className="text-gray-900 dark:text-white font-medium">
                  {patient.hospital_no}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</div>
                <div className="text-gray-900 dark:text-white">
                  {formatDate(patient.date_of_birth)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gender</div>
                <div className="text-gray-900 dark:text-white">{patient.gender}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Phone</div>
                <div className="text-gray-900 dark:text-white">
                  {patient.phone_number || 'N/A'}
                </div>
              </div>
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-sm"
              >
                View Full Patient Record →
              </Link>
            </div>
          )}
        </div>

        {/* Transfer Details */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Transfer Details
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Transfer Date</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {formatDate(transfer.transfer_date)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reason</div>
              <div className="text-gray-900 dark:text-white">
                {getTransferReasonLabel(transfer.reason)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">From Clinic</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {fromClinic?.name || 'Loading...'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">To Clinic</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {toClinic?.name || 'Loading...'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Requested At</div>
              <div className="text-gray-900 dark:text-white">
                {formatDateTime(transfer.requested_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Summary */}
        {transfer.medical_summary && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Medical Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {transfer.medical_summary}
            </p>
          </div>
        )}

        {/* Medications List */}
        {transfer.medications_list && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Medications
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {transfer.medications_list}
            </p>
          </div>
        )}

        {/* Lab Results Summary */}
        {transfer.lab_results_summary && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Lab Results Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {transfer.lab_results_summary}
            </p>
          </div>
        )}

        {/* Continuity of Care Notes */}
        {transfer.continuity_of_care_notes && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Continuity of Care Notes
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {transfer.continuity_of_care_notes}
            </p>
          </div>
        )}

        {/* Status History */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Status History
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Transfer Requested
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDateTime(transfer.requested_at)}
                </div>
              </div>
            </div>

            {transfer.approved_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Transfer Approved
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(transfer.approved_at)}
                  </div>
                </div>
              </div>
            )}

            {transfer.rejected_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Transfer Rejected
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(transfer.rejected_at)}
                  </div>
                  {transfer.rejection_reason && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Reason: {transfer.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {transfer.completed_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Transfer Completed
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(transfer.completed_at)}
                  </div>
                </div>
              </div>
            )}

            {transfer.cancelled_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-500 mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Transfer Cancelled
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(transfer.cancelled_at)}
                  </div>
                  {transfer.cancellation_reason && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Reason: {transfer.cancellation_reason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
