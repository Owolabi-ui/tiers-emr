'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  inventoryApi,
  StockMovementResponse,
  MovementType,
  formatMovementType,
  getMovementTypeBadgeColor,
} from '@/lib/inventory';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Tag,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type FilterMovementType = MovementType | 'All';

// ============================================================================
// COMPONENT
// ============================================================================

export default function StockMovementsPage() {
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<
    StockMovementResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<FilterMovementType>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchTerm, selectedType, dateFrom, dateTo]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.getMovements();
      setMovements(response.movements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = [...movements];

    // Filter by search term (item name or code)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.item_name.toLowerCase().includes(term) ||
          m.item_code.toLowerCase().includes(term) ||
          m.reference_no?.toLowerCase().includes(term) ||
          m.batch_number?.toLowerCase().includes(term)
      );
    }

    // Filter by movement type
    if (selectedType !== 'All') {
      filtered = filtered.filter((m) => m.movement_type === selectedType);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(
        (m) => new Date(m.performed_at) >= fromDate
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter((m) => new Date(m.performed_at) <= toDate);
    }

    setFilteredMovements(filtered);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'Receipt':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'Dispensing':
      case 'Wastage':
      case 'Expiry':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'Adjustment':
        return <Package className="h-5 w-5 text-yellow-600" />;
      case 'Transfer':
        return <Package className="h-5 w-5 text-purple-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const movementTypes: FilterMovementType[] = [
    'All',
    'Receipt',
    'Dispensing',
    'Adjustment',
    'Transfer',
    'Wastage',
    'Expiry',
  ];

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Item Code',
      'Item Name',
      'Movement Type',
      'Quantity',
      'Unit Cost',
      'Batch Number',
      'Reference',
      'Performed By',
      'Reason',
      'Notes',
    ];

    const rows = filteredMovements.map((m) => [
      formatDate(m.performed_at),
      m.item_code,
      m.item_name,
      m.movement_type,
      m.quantity,
      m.unit_cost || '',
      m.batch_number || '',
      m.reference_no || '',
      m.performed_by_name || '',
      m.reason || '',
      m.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `stock-movements-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-[#5b21b6] text-white px-4 py-3 sm:px-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/inventory">
              <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Stock Movement History</h1>
              <p className="text-sm text-white/80">
                Complete audit trail of all stock movements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMovements}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredMovements.length === 0}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-neutral-900 border-b border-black/10 dark:border-white/15 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search item, code, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Movement Type */}
            <div>
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as FilterMovementType)
                }
                className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {movementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : formatMovementType(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Active filters summary */}
          {(searchTerm || selectedType !== 'All' || dateFrom || dateTo) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              <span>
                Showing {filteredMovements.length} of {movements.length}{' '}
                movements
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('All');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  Error Loading Movements
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
                <button
                  onClick={loadMovements}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {movements.length === 0
                ? 'No stock movements recorded yet.'
                : 'No movements match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="border border-black/10 dark:border-white/15 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon and Details */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getMovementIcon(movement.movement_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Item Name and Movement Type */}
                      <div className="flex items-start gap-3 flex-wrap mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {movement.item_name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getMovementTypeBadgeColor(
                            movement.movement_type
                          )}`}
                        >
                          {formatMovementType(movement.movement_type)}
                        </span>
                      </div>

                      {/* Item Code */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Code: {movement.item_code}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {/* Quantity */}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Quantity:
                          </span>{' '}
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {movement.movement_type === 'Receipt' ||
                            movement.movement_type === 'Adjustment'
                              ? '+'
                              : '-'}
                            {movement.quantity}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(movement.performed_at)}</span>
                        </div>

                        {/* Performed By */}
                        {movement.performed_by_name && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span>{movement.performed_by_name}</span>
                          </div>
                        )}

                        {/* Batch Number */}
                        {movement.batch_number && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Tag className="h-4 w-4" />
                            <span>Batch: {movement.batch_number}</span>
                          </div>
                        )}

                        {/* Reference */}
                        {movement.reference_no && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FileText className="h-4 w-4" />
                            <span>Ref: {movement.reference_no}</span>
                          </div>
                        )}

                        {/* Reference Type */}
                        {movement.reference_type && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FileText className="h-4 w-4" />
                            <span className="capitalize">
                              {movement.reference_type.replace('_', ' ')}
                            </span>
                          </div>
                        )}

                        {/* Unit Cost */}
                        {movement.unit_cost !== null && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Cost:</span> $
                            {movement.unit_cost.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      {movement.reason && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Reason:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            {movement.reason}
                          </span>
                        </div>
                      )}

                      {/* Notes */}
                      {movement.notes && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Notes:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            {movement.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
