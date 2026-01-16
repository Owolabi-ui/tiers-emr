'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  patientsApi,
  Patient,
  PatientListResponse,
  ServiceType,
  getPatientFullName,
  formatPatientAge,
  formatDate,
  sexOptions,
  SexType,
} from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  Shield,
  Heart,
  Brain,
  Fingerprint,
} from 'lucide-react';
import PatientFingerprintIdentification from '@/components/PatientFingerprintIdentification';

// Service badge colors
const serviceColors: Record<ServiceType, string> = {
  PREP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PEP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ART: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Mental Health': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

// Short labels for compact display
const serviceLabels: Record<ServiceType, string> = {
  PREP: 'PrEP',
  PEP: 'PEP',
  ART: 'ART',
  'Mental Health': 'MH',
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientServices, setPatientServices] = useState<Record<string, ServiceType[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState<SexType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFingerprintScan, setShowFingerprintScan] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response: PatientListResponse;

      if (searchTerm || sexFilter) {
        response = await patientsApi.search({
          page,
          page_size: perPage,
          search: searchTerm || undefined,
          sex: sexFilter || undefined,
        });
      } else {
        response = await patientsApi.list(page, perPage);
      }

      // Backend returns 'data', not 'patients'
      const patients = response.data || response.patients || [];
      setPatients(patients);
      setTotal(response.total);
      setTotalPages(response.total_pages);

      // Fetch services for all patients in parallel
      if (patients.length > 0) {
        setLoadingServices(true);
        const servicesMap: Record<string, ServiceType[]> = {};

        await Promise.all(
          patients.map(async (patient) => {
            try {
              const services = await patientsApi.getServices(patient.id);
              servicesMap[patient.id] = services;
            } catch {
              servicesMap[patient.id] = [];
            }
          })
        );

        setPatientServices(servicesMap);
        setLoadingServices(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sexFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5b21b6]">Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage patient records and demographics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFingerprintScan(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-purple-700 transition-all"
          >
            <Fingerprint className="h-4 w-4" />
            Quick Check-in
          </button>
          <Link
            href="/dashboard/patients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#5b21b6] px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-[#4c1d95] transition-all"
          >
            <UserPlus className="h-4 w-4" />
            New Patient
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5b21b6]/10">
              <Users className="h-5 w-5 text-[#5b21b6]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
              <p className="text-sm text-gray-500">Total Patients</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {patients.filter((p) => p.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{perPage}</p>
              <p className="text-sm text-gray-500">Per Page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, hospital number, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 focus:border-[#5b21b6]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || sexFilter
                ? 'border-[#5b21b6] text-[#5b21b6] bg-[#5b21b6]/10'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => fetchPatients()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sex
                </label>
                <select
                  value={sexFilter}
                  onChange={(e) => {
                    setSexFilter(e.target.value as SexType | '');
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  <option value="">All</option>
                  {sexOptions.map((sex) => (
                    <option key={sex} value={sex}>
                      {sex}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {sexFilter && (
              <button
                type="button"
                onClick={() => {
                  setSexFilter('');
                  setPage(1);
                }}
                className="mt-3 text-sm text-[#5b21b6] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error loading patients
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15 bg-purple-100 dark:bg-[#5b21b6]/10 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#5b21b6] text-white">
              <th className="px-4 py-3 text-left font-medium">Hospital No.</th>
              <th className="px-4 py-3 text-left font-medium">Patient Name</th>
              <th className="px-4 py-3 text-left font-medium">Sex</th>
              <th className="px-4 py-3 text-left font-medium">Age</th>
              <th className="px-4 py-3 text-left font-medium">Services</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading patients...</p>
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No patients found</p>
                  <Link
                    href="/dashboard/patients/new"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Add your first patient
                  </Link>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-t border-black/5 dark:border-white/10 hover:bg-purple-50/50 dark:hover:bg-[#5b21b6]/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {patient.hospital_no}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getPatientFullName(patient)}
                      </p>
                      {patient.email && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {patient.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        patient.sex === 'Male'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : patient.sex === 'Female'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {patient.sex}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatPatientAge(patient)}
                  </td>
                  <td className="px-4 py-3">
                    {loadingServices ? (
                      <span className="text-xs text-gray-400">...</span>
                    ) : patientServices[patient.id]?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patientServices[patient.id].map((service) => (
                          <span
                            key={service}
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${serviceColors[service]}`}
                            title={service}
                          >
                            {serviceLabels[service]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not enrolled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {patient.phone_number || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        patient.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#5b21b6] hover:bg-[#5b21b6]/10 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/patients/${patient.id}/edit`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#5b21b6] hover:bg-[#5b21b6]/10 transition-colors"
                        title="Edit patient"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}{' '}
            patients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fingerprint Quick Check-in Modal */}
      {showFingerprintScan && (
        <PatientFingerprintIdentification
          onPatientIdentified={(patientId) => {
            setShowFingerprintScan(false);
            router.push(`/dashboard/patients/${patientId}`);
          }}
          onCancel={() => setShowFingerprintScan(false)}
        />
      )}
    </div>
  );
}
