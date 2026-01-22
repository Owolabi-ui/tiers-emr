'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  pharmacyApi, 
  DrugCatalog,
  isStockLow,
  isOutOfStock,
  isExpired,
  isExpiringSoon,
  CreateDrugRequest 
} from '@/lib/pharmacy';
import { getErrorMessage } from '@/lib/api';

type TabType = 'all' | 'low-stock' | 'expiring' | 'add-drug';

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [drugs, setDrugs] = useState<DrugCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [commodityTypeFilter, setCommodityTypeFilter] = useState<string>('');

  // Add drug form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newDrug, setNewDrug] = useState<CreateDrugRequest>({
    commodity_name: '',
    commodity_id: '',
    pack_type: '',
    pack_type_id: '',
    commodity_type: '',
    quantity: 0,
    batch_no: '',
    expiry_month: undefined,
    expiry_year: undefined,
  });

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pharmacyApi.getDrugs({ active_only: true });
      setDrugs(response.drugs || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrug = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      if (!newDrug.commodity_name || !newDrug.commodity_id || !newDrug.pack_type || !newDrug.commodity_type) {
        setSubmitError('Please fill in all required fields');
        return;
      }

      await pharmacyApi.createDrug(newDrug);
      
      // Reset form and reload drugs
      setNewDrug({
        commodity_name: '',
        commodity_id: '',
        pack_type: '',
        pack_type_id: '',
        commodity_type: '',
        quantity: 0,
        batch_no: '',
        expiry_month: undefined,
        expiry_year: undefined,
      });
      setShowAddForm(false);
      loadDrugs();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrugs = drugs.filter((drug) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !drug.commodity_name.toLowerCase().includes(search) &&
        !drug.commodity_id.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Commodity type filter
    if (commodityTypeFilter && drug.commodity_type !== commodityTypeFilter) {
      return false;
    }

    // Tab filter
    if (activeTab === 'low-stock') {
      return isStockLow(drug.quantity) || isOutOfStock(drug.quantity);
    }
    if (activeTab === 'expiring') {
      return isExpired(drug.expiry_month, drug.expiry_year) || 
             isExpiringSoon(drug.expiry_month, drug.expiry_year);
    }

    return true;
  });

  const commodityTypes = Array.from(new Set(drugs.map(d => d.commodity_type))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b21b6] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading inventory...</p>
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
              <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading inventory</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={loadDrugs}
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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => router.push('/dashboard/pharmacy')}
            className="mb-4 text-[#5b21b6] hover:underline flex items-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pharmacy
          </button>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Inventory Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage drug stock and inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Cancel' : 'Add Drug'}
        </button>
      </div>

      {/* Add Drug Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-6">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Add New Drug</h2>
          </div>
          
          {submitError && (
            <div className="mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commodity Name *
                </label>
                <input
                  type="text"
                  value={newDrug.commodity_name}
                  onChange={(e) => setNewDrug({ ...newDrug, commodity_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Paracetamol Tablets"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commodity ID *
                </label>
                <input
                  type="text"
                  value={newDrug.commodity_id}
                  onChange={(e) => setNewDrug({ ...newDrug, commodity_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., PAR001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pack Type *
                </label>
                <input
                  type="text"
                  value={newDrug.pack_type}
                  onChange={(e) => setNewDrug({ ...newDrug, pack_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Tablet"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pack Type ID
                </label>
                <input
                  type="text"
                  value={newDrug.pack_type_id}
                  onChange={(e) => setNewDrug({ ...newDrug, pack_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., TAB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commodity Type *
                </label>
                <input
                  type="text"
                  value={newDrug.commodity_type}
                  onChange={(e) => setNewDrug({ ...newDrug, commodity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Analgesic, ARV, Antibiotic"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newDrug.quantity || 0}
                  onChange={(e) => setNewDrug({ ...newDrug, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={newDrug.batch_no || ''}
                  onChange={(e) => setNewDrug({ ...newDrug, batch_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., BT2024001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newDrug.expiry_month || ''}
                    onChange={(e) => setNewDrug({ ...newDrug, expiry_month: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="1-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Year
                  </label>
                  <input
                    type="number"
                    min="2024"
                    value={newDrug.expiry_year || ''}
                    onChange={(e) => setNewDrug({ ...newDrug, expiry_year: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="YYYY"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDrug}
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Drug'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Drugs ({drugs.length})
          </button>
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'low-stock'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'expiring'
                ? 'border-[#5b21b6] text-[#5b21b6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Expiring Soon
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search drugs..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div>
          <select
            value={commodityTypeFilter}
            onChange={(e) => setCommodityTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Types</option>
            {commodityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drugs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Drug Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commodity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pack Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Batch No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDrugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No drugs found
                  </td>
                </tr>
              ) : (
                filteredDrugs.map((drug) => {
                  const expired = isExpired(drug.expiry_month, drug.expiry_year);
                  const expiringSoon = isExpiringSoon(drug.expiry_month, drug.expiry_year);
                  const lowStock = isStockLow(drug.quantity);
                  const outOfStock = isOutOfStock(drug.quantity);

                  return (
                    <tr key={drug.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {drug.commodity_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {drug.commodity_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {drug.commodity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {drug.pack_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          outOfStock
                            ? 'text-red-600 dark:text-red-400'
                            : lowStock
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {drug.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {drug.batch_no || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {drug.expiry_month && drug.expiry_year ? (
                          <span className={
                            expired
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : expiringSoon
                              ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                              : 'text-gray-900 dark:text-white'
                          }>
                            {drug.expiry_month}/{drug.expiry_year}
                            {expired && ' (Expired)'}
                            {!expired && expiringSoon && ' (Soon)'}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Upload Info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Excel File Requirements for Bulk Upload
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>IMPORTANT:</strong> Columns must be in this exact order (left to right):
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li><strong>commodity_name</strong> - Drug/item name (REQUIRED)</li>
              <li><strong>commodity_id</strong> - Unique commodity identifier (REQUIRED)</li>
              <li><strong>pack_type</strong> - Package type e.g., Bottle, Box, Strip (REQUIRED)</li>
              <li><strong>pack_type_id</strong> - Pack type identifier (REQUIRED)</li>
              <li><strong>commodity_type</strong> - Type category e.g., ARV, OI Drug (REQUIRED)</li>
              <li><strong>quantity</strong> - Stock quantity number (optional, defaults to 0)</li>
              <li><strong>batch_no</strong> - Batch number (optional)</li>
              <li><strong>expiry_month</strong> - Expiry month 1-12 (optional)</li>
              <li><strong>expiry_year</strong> - Expiry year e.g., 2026 (optional)</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-300">
              <strong>Validation Rules:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>commodity_id must be unique (no duplicates)</li>
                <li>expiry_month and expiry_year must both be provided together, or both left empty</li>
                <li>Expiry date cannot be in the past</li>
                <li>expiry_month must be between 1 and 12</li>
              </ul>
            </div>
            <a
              href="/templates/inventory-template.xlsx"
              download="pharmacy-bulk-upload-template.xlsx"
              className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template (Pre-formatted with correct columns)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
