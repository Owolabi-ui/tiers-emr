'use client';

import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import {
  inventoryApi,
  AlertSummary,
  StockAlertResponse,
  getAlertSeverityColor,
  getAlertIconColor,
  formatAlertType,
} from '@/lib/inventory';
import { getErrorMessage } from '@/lib/api';

export default function NotificationBell() {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<StockAlertResponse[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlertSummary();
    // Refresh every 5 minutes
    const interval = setInterval(loadAlertSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlertSummary = async () => {
    try {
      const summaryData = await inventoryApi.getAlertSummary();
      setSummary(summaryData);

      // Load recent alerts for dropdown
      if (summaryData.total_active > 0) {
        const alertsData = await inventoryApi.getAlerts();
        setRecentAlerts(alertsData.alerts.slice(0, 5)); // Show top 5
      }
    } catch (error) {
      console.error('Failed to load alerts:', getErrorMessage(error));
    }
  };

  const handleDismiss = async (alertId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await inventoryApi.dismissAlert(alertId);
      await loadAlertSummary(); // Refresh
    } catch (error) {
      console.error('Failed to dismiss alert:', getErrorMessage(error));
    }
  };

  const getAlertIcon = (severity: string) => {
    const iconClass = `h-4 w-4 ${getAlertIconColor(severity as any)}`;
    switch (severity) {
      case 'Critical':
        return <AlertCircle className={iconClass} />;
      case 'Warning':
        return <AlertTriangle className={iconClass} />;
      case 'Info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const totalAlerts = summary?.total_active || 0;
  const hasCritical = (summary?.critical_count || 0) > 0;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {totalAlerts > 0 && (
          <span
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium flex items-center justify-center ${
              hasCritical
                ? 'bg-red-600 text-white'
                : 'bg-yellow-500 text-white'
            }`}
          >
            {totalAlerts > 9 ? '9+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Stock Alerts
                </h3>
                <Link
                  href="/dashboard/inventory"
                  className="text-sm text-[#5b21b6] hover:text-[#4c1d95]"
                  onClick={() => setShowDropdown(false)}
                >
                  View All
                </Link>
              </div>
              {summary && (
                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                  {summary.critical_count > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      {summary.critical_count} Critical
                    </span>
                  )}
                  {summary.warning_count > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {summary.warning_count} Warning
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Alerts List */}
            <div className="overflow-y-auto flex-1">
              {recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getAlertIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAlertSeverityColor(
                                alert.severity
                              )}`}
                            >
                              {formatAlertType(alert.alert_type)}
                            </span>
                            <button
                              onClick={(e) => handleDismiss(alert.id, e)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Dismiss"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-900 mb-1">
                            {alert.item_name || 'Unknown Item'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {alert.message}
                          </p>
                          {alert.current_value !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                              Current: {alert.current_value}{' '}
                              {alert.threshold_value !== null &&
                                `(Threshold: ${alert.threshold_value})`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {recentAlerts.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/dashboard/inventory?tab=alerts"
                  className="block text-center text-sm text-[#5b21b6] hover:text-[#4c1d95] font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  View All Alerts ({totalAlerts})
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
