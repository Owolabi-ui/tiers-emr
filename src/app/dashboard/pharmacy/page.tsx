'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  pharmacyApi, 
  Prescription, 
  PrescriptionStatus,
  getPrescriptionStatusColor,
  formatPrescriptionNumber,
  StockAlert,
  isStockLow,
  isOutOfStock
} from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';

type TabType = 'pending' | 'all' | 'alerts';

export default function PharmacyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | undefined>(undefined);
  const [showPrepOnly, setShowPrepOnly] = useState(false);
  const [showPepOnly, setShowPepOnly] = useState(false);
  const [showArtOnly, setShowArtOnly] = useState(false);
  const perPage = 20;

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadStockAlerts();
    } else {
      loadPrescriptions();
    }
  }, [activeTab, currentPage, statusFilter, showPrepOnly, showPepOnly, showArtOnly]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = activeTab === 'pending' ? 'Pending' : statusFilter;
      const response = await pharmacyApi.listPrescriptions({
        status,
        page: currentPage,
        per_page: perPage,
      });
      // Filter for PrEP/PEP/ART prescriptions if checkboxes are checked
      let filtered = response.data;
      if (showPrepOnly) {
        filtered = filtered.filter(p => p.diagnosis?.includes('PrEP') || p.diagnosis?.includes('Pre-Exposure Prophylaxis'));
      }
      if (showPepOnly) {
        filtered = filtered.filter(p => p.diagnosis?.includes('PEP') || p.diagnosis?.includes('Post-Exposure Prophylaxis'));
      }
      if (showArtOnly) {
        filtered = filtered.filter(p => p.diagnosis?.includes('HIV/AIDS') || p.diagnosis?.includes('ART') || p.diagnosis?.includes('On ART'));
      }
      setPrescriptions(filtered);
      setTotalItems((showPrepOnly || showPepOnly || showArtOnly) ? filtered.length : response.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadStockAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyApi.getStockAlerts();
      setStockAlerts(response.alerts);
      setTotalItems(response.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = (id: string) => {
    router.push(`/dashboard/pharmacy/${id}`);
  };

  const handleDispense = (id: string) => {
    router.push(`/dashboard/pharmacy/dispense/${id}`);
  };

  const totalPages = Math.ceil(totalItems / perPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b21b6] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading pharmacy data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading pharmacy data</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={() => activeTab === 'alerts' ? loadStockAlerts() : loadPrescriptions()}
                className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#5b21b6]">Pharmacy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage prescriptions and medication dispensing
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/pharmacy/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Prescription
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pending Prescriptions
          </button>
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Prescriptions
          </button>
          <button
            onClick={() => { setActiveTab('alerts'); setCurrentPage(1); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'alerts'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Stock Alerts
            {stockAlerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {stockAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push('/dashboard/pharmacy/inventory')}
            className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 font-medium text-sm transition-colors"
          >
            Inventory
          </button>
        </nav>
      </div>

      {/* Status Filter (for "All Prescriptions" tab) */}
      {activeTab === 'all' && (
        <div className="mb-4 flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value as PrescriptionStatus || undefined);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Dispensed">Partially Dispensed</option>
            <option value="Dispensed">Dispensed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showPrepOnly}
              onChange={(e) => setShowPrepOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">PrEP Only</span>
          </label>
          <label className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showPepOnly}
              onChange={(e) => setShowPepOnly(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-300">PEP Only</span>
          </label>
          <label className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showArtOnly}
              onChange={(e) => setShowArtOnly(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <span className="text-sm font-medium text-red-900 dark:text-red-300">ART Only</span>
          </label>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'alerts' ? (
        /* Stock Alerts Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commodity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Drug Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Alert Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stockAlerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No stock alerts at this time
                  </td>
                </tr>
              ) : (
                stockAlerts.map((alert) => (
                  <tr key={alert.drug_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {alert.commodity_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {alert.commodity_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${
                        isOutOfStock(alert.current_stock)
                          ? 'text-red-600 dark:text-red-400'
                          : isStockLow(alert.current_stock)
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {alert.current_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.alert_type === 'Out of Stock'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {alert.alert_type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Prescriptions Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prescription #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prescribed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No prescriptions found
                  </td>
                </tr>
              ) : (
                prescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleViewPrescription(prescription.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#5b21b6]">
                      {formatPrescriptionNumber(prescription.prescription_number)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {prescription.patient_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {prescription.prescribed_by_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(prescription.prescribed_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {prescription.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrescriptionStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                        {(prescription.diagnosis?.includes('PrEP') || prescription.diagnosis?.includes('Pre-Exposure Prophylaxis')) && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            PrEP
                          </span>
                        )}
                        {(prescription.diagnosis?.includes('PEP') || prescription.diagnosis?.includes('Post-Exposure Prophylaxis')) && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            PEP
                          </span>
                        )}
                        {(prescription.diagnosis?.includes('HIV/AIDS') || prescription.diagnosis?.includes('ART') || prescription.diagnosis?.includes('On ART')) && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            ART
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewPrescription(prescription.id)}
                          className="text-sm text-[#5b21b6] hover:underline"
                        >
                          View
                        </button>
                        {prescription.status === 'Pending' && (
                          <button
                            onClick={() => handleDispense(prescription.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Dispense
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} results
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
