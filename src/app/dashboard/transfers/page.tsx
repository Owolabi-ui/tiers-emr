'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  transfersApi,
  Transfer,
  TransferStatus,
  getTransferStatusColor,
  getTransferReasonLabel,
  transferStatusOptions,
} from '@/lib/transfers';
import { patientsApi } from '@/lib/patients';
import { clinicsApi } from '@/lib/clinics';

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'incoming' | 'outgoing'>('incoming');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | ''>('');
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [clinicNames, setClinicNames] = useState<Record<string, string>>({});
  const [currentClinicId, setCurrentClinicId] = useState<string>('');

  useEffect(() => {
    // Get first available clinic for now
    // TODO: Get actual clinic ID from user context/session
    const initClinic = async () => {
      try {
        const clinics = await clinicsApi.getAll();
        if (clinics.clinics.length > 0) {
          setCurrentClinicId(clinics.clinics[0].id);
        } else {
          // No clinics available, stop loading
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
        setLoading(false);
      }
    };
    initClinic();
  }, []);

  useEffect(() => {
    if (currentClinicId) {
      fetchTransfers();
    }
  }, [currentClinicId, viewMode, statusFilter]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      let response;
      
      if (viewMode === 'incoming') {
        response = await transfersApi.getIncoming(
          currentClinicId,
          statusFilter as TransferStatus || undefined
        );
      } else {
        response = await transfersApi.getOutgoing(
          currentClinicId,
          statusFilter as TransferStatus || undefined
        );
      }

      setTransfers(response.transfers);

      // Fetch patient and clinic names
      const patientIds = [...new Set(response.transfers.map(t => t.patient_id))];
      const clinicIds = [...new Set([
        ...response.transfers.map(t => t.from_clinic_id),
        ...response.transfers.map(t => t.to_clinic_id),
      ])];

      // Fetch patient names
      const patientNamesMap: Record<string, string> = {};
      await Promise.all(
        patientIds.map(async (id) => {
          try {
            const patient = await patientsApi.getById(id);
            patientNamesMap[id] = `${patient.first_name} ${patient.last_name}`;
          } catch (error) {
            patientNamesMap[id] = 'Unknown Patient';
          }
        })
      );
      setPatientNames(patientNamesMap);

      // Fetch clinic names
      const clinicNamesMap: Record<string, string> = {};
      const clinicsList = await clinicsApi.getAll();
      clinicsList.clinics.forEach((clinic: { id: string; name: string }) => {
        clinicNamesMap[clinic.id] = clinic.name;
      });
      setClinicNames(clinicNamesMap);

    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transferId: string) => {
    if (!confirm('Are you sure you want to approve this transfer?')) return;

    try {
      await transfersApi.approve(transferId, { notes: 'Transfer approved' });
      fetchTransfers();
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert('Failed to approve transfer');
    }
  };

  const handleReject = async (transferId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await transfersApi.reject(transferId, { rejection_reason: reason });
      fetchTransfers();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      alert('Failed to reject transfer');
    }
  };

  const handleComplete = async (transferId: string) => {
    if (!confirm('Mark this transfer as completed?')) return;

    try {
      await transfersApi.complete(transferId, { notes: 'Transfer completed' });
      fetchTransfers();
    } catch (error) {
      console.error('Error completing transfer:', error);
      alert('Failed to complete transfer');
    }
  };

  const handleCancel = async (transferId: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    try {
      await transfersApi.cancel(transferId, { cancellation_reason: reason });
      fetchTransfers();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      alert('Failed to cancel transfer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading transfers...</div>
      </div>
    );
  }

  if (!currentClinicId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Patient Transfers
          </h1>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            No Clinics Available
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            You need to create at least one clinic before you can manage transfers. 
            Please contact your administrator to set up clinics in the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Patient Transfers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage patient transfers between clinics
        </p>
      </div>

      {/* View Mode Toggle and Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('incoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'incoming'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
              }`}
            >
              Incoming
            </button>
            <button
              onClick={() => setViewMode('outgoing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'outgoing'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
              }`}
            >
              Outgoing
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransferStatus | '')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              {transferStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              href="/dashboard/transfers/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap"
            >
              + New Transfer
            </Link>
          </div>
        </div>
      </div>

      {/* Transfers List */}
      {transfers.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No {viewMode} transfers found
            {statusFilter && ` with status: ${statusFilter}`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transfer #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {viewMode === 'incoming' ? 'From Clinic' : 'To Clinic'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transfer Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                    onClick={() => router.push(`/dashboard/transfers/${transfer.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {transfer.transfer_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {patientNames[transfer.patient_id] || 'Loading...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {viewMode === 'incoming'
                        ? clinicNames[transfer.from_clinic_id] || 'Loading...'
                        : clinicNames[transfer.to_clinic_id] || 'Loading...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(transfer.transfer_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {getTransferReasonLabel(transfer.reason)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransferStatusColor(
                          transfer.status
                        )}`}
                      >
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {viewMode === 'incoming' && transfer.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transfer.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(transfer.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {transfer.status === 'Approved' && (
                          <button
                            onClick={() => handleComplete(transfer.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Complete
                          </button>
                        )}
                        {viewMode === 'outgoing' &&
                          transfer.status === 'Pending' && (
                            <button
                              onClick={() => handleCancel(transfer.id)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          )}
                        <Link
                          href={`/dashboard/transfers/${transfer.id}`}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Transfers</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {transfers.length}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {transfers.filter((t) => t.status === 'Pending').length}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {transfers.filter((t) => t.status === 'Completed').length}
          </div>
        </div>
      </div>
    </div>
  );
}
