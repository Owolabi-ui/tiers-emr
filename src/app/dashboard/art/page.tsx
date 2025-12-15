'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { artApi, ArtListItem } from '@/lib/art';
import { eacApi, EacEpisode, getEacTriggerColor } from '@/lib/eac';
import { getErrorMessage } from '@/lib/api';
import {
  Heart,
  Plus,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
  TrendingUp,
  Users,
  UserCircle,
  Clock,
} from 'lucide-react';

export default function ArtPage() {
  const [artRecords, setArtRecords] = useState<ArtListItem[]>([]);
  const [eacEpisodes, setEacEpisodes] = useState<EacEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching ART records...');
        const records = await artApi.getAll();
        console.log('ART records fetched:', records);
        setArtRecords(records);

        // Fetch active EAC episodes
        try {
          const episodes = await eacApi.listEpisodes({ is_active: true });
          console.log('Active EAC episodes fetched:', episodes);
          setEacEpisodes(episodes.data);
        } catch (eacErr) {
          console.error('Error fetching EAC episodes:', eacErr);
          // Don't fail the whole page if EAC fetch fails
        }
      } catch (err) {
        console.error('Error fetching ART records:', err);
        const errorMsg = getErrorMessage(err);
        console.error('Error message:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecords = artRecords.filter((record) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.patient_name.toLowerCase().includes(search) ||
      record.patient_hospital_no.toLowerCase().includes(search) ||
      record.art_no.toLowerCase().includes(search)
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
    if (statusLower.includes('complete') || statusLower.includes('discharge')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (statusLower.includes('transfer')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Transferred
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {status}
      </span>
    );
  };

  // Calculate stats
  const activeCount = artRecords.filter(r => r.status.toLowerCase().includes('active')).length;
  const recentEnrollments = artRecords.filter(r => {
    const enrollDate = new Date(r.date_enrolled_into_hiv_care);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return enrollDate >= thirtyDaysAgo;
  }).length;
  const transferredCount = artRecords.filter(r => r.entry_point === 'Transferred in').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading ART data...</p>
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
            <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading ART data</p>
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
          <h1 className="text-2xl font-bold text-[#5b21b6]">ART Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Antiretroviral Therapy for HIV care and treatment
          </p>
        </div>
        <Link
          href="/dashboard/art/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5b21b6] hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b21b6]"
        >
          <Plus className="h-5 w-5 mr-2" />
          New ART Patient
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {artRecords.length}
              </p>
            </div>
            <Heart className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active on ART</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {activeCount}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New (30 days)</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {recentEnrollments}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transferred In</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {transferredCount}
              </p>
            </div>
            <Users className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, hospital number, or ART number..."
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
                  ART No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entry Point
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Enrolled
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
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No ART patients found matching your search.' : 'No ART patients yet. Click "New ART Patient" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p>{record.patient_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{record.patient_hospital_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {record.art_no}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {record.entry_point}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(record.date_enrolled_into_hiv_care).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/dashboard/art/${record.id}`}
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

      {/* Active EAC Episodes */}
      {eacEpisodes.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active EAC Episodes
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  {eacEpisodes.length}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ART No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trigger
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
                {eacEpisodes.map((episode) => {
                  // Find matching ART record for patient info
                  const artRecord = artRecords.find(r => r.id === episode.art_id);
                  const triggerColor = getEacTriggerColor(episode.trigger_reason);
                  
                  return (
                    <tr key={episode.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {artRecord ? artRecord.patient_name : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {artRecord ? artRecord.art_no : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${triggerColor}`}>
                          {episode.trigger_reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(episode.start_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-600 dark:bg-orange-500 rounded-full transition-all"
                                style={{ width: `${(episode.sessions_completed / 3) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {episode.sessions_completed}/3
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {episode.sessions_completed === 0 ? 'Not started' : 
                             episode.sessions_completed === 3 ? 'All sessions completed' :
                             `${episode.sessions_completed} session${episode.sessions_completed > 1 ? 's' : ''} completed`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/dashboard/eac/${episode.id}`}
                          className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
