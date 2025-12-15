'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pepApi, PepListItem } from '@/lib/pep';
import { pharmacyApi } from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';
import {
  Shield,
  Plus,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function PepPage() {
  const [pepRecords, setPepRecords] = useState<PepListItem[]>([]);
  const [prescriptionStatus, setPrescriptionStatus] = useState<Record<string, { hasPrescriptions: boolean; hasDispensed: boolean; hasPending: boolean; nextRefillDate: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching PEP records...');
        const records = await pepApi.getAll();
        console.log('PEP records fetched:', records);
        setPepRecords(records);
        
        // Fetch prescription status for each patient
        const statusMap: Record<string, { hasPrescriptions: boolean; hasDispensed: boolean; hasPending: boolean; nextRefillDate: string | null }> = {};
        for (const record of records) {
          try {
            const prescriptionsResponse = await pharmacyApi.listPrescriptions({
              patient_id: record.patient_id,
            });
            const pepPrescriptions = prescriptionsResponse.data.filter(p => 
              p.diagnosis?.includes('PEP') || p.diagnosis?.includes('Post-Exposure Prophylaxis')
            );
            
            // Calculate next refill date from most recent prescription if not in PEP record
            let nextRefillDate = record.next_refill_date;
            if (!nextRefillDate && pepPrescriptions.length > 0) {
              // Get most recent prescription
              const latestPrescription = pepPrescriptions.sort((a, b) => 
                new Date(b.prescribed_at).getTime() - new Date(a.prescribed_at).getTime()
              )[0];
              
              // Calculate next refill (28 days from prescription date for PEP)
              if (latestPrescription) {
                const prescriptionDate = new Date(latestPrescription.prescribed_at);
                prescriptionDate.setDate(prescriptionDate.getDate() + 28);
                nextRefillDate = prescriptionDate.toISOString().split('T')[0];
              }
            }
            
            statusMap[record.id] = {
              hasPrescriptions: pepPrescriptions.length > 0,
              hasDispensed: pepPrescriptions.some(p => p.status === 'Dispensed'),
              hasPending: pepPrescriptions.some(p => p.status === 'Pending'),
              nextRefillDate,
            };
          } catch (err) {
            console.error(`Error fetching prescriptions for patient ${record.patient_id}:`, err);
            statusMap[record.id] = { hasPrescriptions: false, hasDispensed: false, hasPending: false, nextRefillDate: null };
          }
        }
        setPrescriptionStatus(statusMap);
      } catch (err) {
        console.error('Error fetching PEP records:', err);
        const errorMsg = getErrorMessage(err);
        console.error('Error message:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecords = pepRecords.filter((record) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.patient_name.toLowerCase().includes(search) ||
      record.patient_hospital_no.toLowerCase().includes(search) ||
      record.pep_no.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('ongoing')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    }
    if (statusLower.includes('complete')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {status}
      </span>
    );
  };

  const getUrgencyBadge = (duration: string) => {
    if (duration === '<24hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Critical
        </span>
      );
    }
    if (duration === '<48hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          <Clock className="h-3 w-3" />
          Urgent
        </span>
      );
    }
    if (duration === '<72hrs') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3" />
          Time-Sensitive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {duration}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading PEP data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading PEP data</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">PEP Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Post-Exposure Prophylaxis for HIV prevention
          </p>
        </div>
        <Link
          href="/dashboard/pep/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5b21b6] hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6]"
        >
          <Plus className="h-5 w-5 mr-2" />
          New PEP Case
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pepRecords.length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {pepRecords.filter(r => r.status.toLowerCase().includes('active')).length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical (&lt;24hrs)</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {pepRecords.filter(r => r.duration_before_pep === '<24hrs').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupational</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {pepRecords.filter(r => r.mode_of_exposure === 'Occupational').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Alert for urgent cases */}
      {pepRecords.filter(r => r.duration_before_pep === '<24hrs' && r.status.toLowerCase().includes('active')).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-medium">Critical PEP Cases Requiring Immediate Attention</p>
              <p className="mt-1">
                {pepRecords.filter(r => r.duration_before_pep === '<24hrs' && r.status.toLowerCase().includes('active')).length} active case(s) 
                with exposure within 24 hours. PEP effectiveness decreases significantly after 72 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, hospital number, or PEP number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hospital No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PEP No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Exposure Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time to PEP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Refill
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prescription
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No PEP cases found matching your search.' : 'No PEP cases yet. Click "New PEP Case" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {record.patient_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {record.patient_hospital_no}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {record.pep_no}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {record.mode_of_exposure}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getUrgencyBadge(record.duration_before_pep)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {/* Use calculated next refill date if available, otherwise from backend */}
                      {prescriptionStatus[record.id]?.nextRefillDate || record.next_refill_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(prescriptionStatus[record.id]?.nextRefillDate || record.next_refill_date!).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {prescriptionStatus[record.id] ? (
                        prescriptionStatus[record.id].hasPrescriptions ? (
                          prescriptionStatus[record.id].hasDispensed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Dispensed
                            </span>
                          ) : prescriptionStatus[record.id].hasPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          <span className="text-gray-400">No Rx</span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/dashboard/pep/${record.hts_initial_id}`}
                        className="text-[#5b21b6] hover:text-[#4c1d95] font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
