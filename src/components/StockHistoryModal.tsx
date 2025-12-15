'use client';

import { useState, useEffect } from 'react';
import {
  inventoryApi,
  StockMovementResponse,
  formatMovementType,
  getMovementTypeBadgeColor,
} from '@/lib/inventory';
import { getErrorMessage } from '@/lib/api';
import {
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Tag,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StockHistoryModalProps {
  itemId: number;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StockHistoryModal({
  itemId,
  itemName,
  isOpen,
  onClose,
}: StockHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, itemId]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.getItemMovements(itemId);
      setMovements(response.movements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-4xl w-full border border-black/10 dark:border-white/15 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center justify-between rounded-t-xl flex-shrink-0">
          <div>
            <h3 className="font-semibold text-white">Stock Movement History</h3>
            <p className="text-sm text-white/80">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-grow">
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
                    Error Loading History
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No stock movements recorded for this item yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="border border-black/10 dark:border-white/15 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Icon and Type */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getMovementIcon(movement.movement_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Movement Type and Quantity */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${getMovementTypeBadgeColor(
                              movement.movement_type
                            )}`}
                          >
                            {formatMovementType(movement.movement_type)}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {movement.movement_type === 'Receipt' ||
                            movement.movement_type === 'Adjustment'
                              ? '+'
                              : '-'}
                            {movement.quantity}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
                          <div className="mt-2 text-sm">
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/10 dark:border-white/15 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
