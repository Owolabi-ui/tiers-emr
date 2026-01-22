'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Calendar, TrendingDown, Plus, ExternalLink, Upload, FileSpreadsheet, Download, Loader2, X, History, Bell } from 'lucide-react';
import Link from 'next/link';
import { api, getErrorMessage } from '@/lib/api';
import { pharmacyApi, DrugCatalog, ReceiveDrugStockRequest } from '@/lib/pharmacy';
import { inventoryApi, InventoryItem, AlertSummary, StockAlertResponse, getAlertSeverityColor, formatAlertType } from '@/lib/inventory';

export default function InventoryPage() {
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [drugs, setDrugs] = useState<DrugCatalog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<DrugCatalog | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  
  // Alert state
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<StockAlertResponse[]>([]);
  const [showAlertsTab, setShowAlertsTab] = useState(false);

  // Receive stock form state
  const [receiveStockForm, setReceiveStockForm] = useState<{
    isNewDrug: boolean;
    itemId: number | null;
    commodityId: string;
    commodityName: string;
    packType: string;
    packTypeId: string;
    commodityType: string;
    quantity: number;
    batchNumber: string;
    expiryDate: string;
    referenceNo: string;
    notes: string;
  }>({
    isNewDrug: false,
    itemId: null,
    commodityId: '',
    commodityName: '',
    packType: '',
    packTypeId: '',
    commodityType: '',
    quantity: 0,
    batchNumber: '',
    expiryDate: '',
    referenceNo: '',
    notes: '',
  });
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState('');

  // Fetch drugs and inventory items on component mount
  useEffect(() => {
    fetchDrugs();
    fetchInventoryItems();
    fetchAlerts();
  }, []);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await pharmacyApi.getDrugs();
      setDrugs(response.drugs);
    } catch (err) {
      console.error('Failed to fetch drugs:', err);
      const errorMsg = getErrorMessage(err);
      console.error('Error details:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await inventoryApi.getItems();
      setInventoryItems(response.items);
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const [summary, alerts] = await Promise.all([
        inventoryApi.getAlertSummary(),
        inventoryApi.getAlerts(),
      ]);
      setAlertSummary(summary);
      setActiveAlerts(alerts.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const handleDismissAlert = async (alertId: number) => {
    try {
      await inventoryApi.dismissAlert(alertId);
      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      console.log('Uploading file:', uploadFile.name, uploadFile.type, uploadFile.size);

      // Use the correct API path with /api/v1 prefix
      // Important: Delete Content-Type header to let the browser set it with correct boundary
      const response = await api.post('/api/v1/pharmacy/drugs/bulk-upload', formData, {
        headers: {
          'Content-Type': undefined, // Let browser set this automatically
        },
      });
      
      console.log('Upload response:', response.data);

      const result = response.data;
      
      if (result.failed > 0) {
        // Show partial success with errors
        setUploadError(
          `Upload completed with errors:\n` +
          `✓ ${result.successful} items added successfully\n` +
          `✗ ${result.failed} items failed\n\n` +
          `First few errors:\n${result.errors.slice(0, 5).join('\n')}\n` +
          (result.errors.length > 5 ? `\n...and ${result.errors.length - 5} more errors` : '')
        );
      } else {
        setUploadSuccess(`Bulk upload completed! ${result.successful} items added successfully.`);
      }
      
      setUploadFile(null);
      
      // Refresh drug list after successful upload
      if (result.successful > 0) {
        await fetchDrugs();
      }
      
      if (result.failed === 0) {
        setTimeout(() => {
          setShowBulkUpload(false);
          setUploadSuccess('');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      
      // Get detailed error message
      const errorMsg = err.response?.data?.error || 
                      err.response?.data || 
                      getErrorMessage(err);
      
      setUploadError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setUploadFile(file);
      setUploadError('');
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!receiveStockForm.isNewDrug && !receiveStockForm.itemId) {
      setReceiveError('Please select a drug or choose to add a new one');
      return;
    }

    if (receiveStockForm.isNewDrug) {
      if (!receiveStockForm.commodityId || !receiveStockForm.commodityName ||
          !receiveStockForm.packType || !receiveStockForm.packTypeId ||
          !receiveStockForm.commodityType) {
        setReceiveError('Please fill in all required fields for new drug');
        return;
      }
    }

    if (receiveStockForm.quantity <= 0) {
      setReceiveError('Quantity must be greater than 0');
      return;
    }

    setSubmittingReceive(true);
    setReceiveError('');

    try {
      let commodityId: string;
      let commodityName: string;
      let packType: string;
      let packTypeId: string;
      let commodityType: string;

      if (receiveStockForm.isNewDrug) {
        // Use the form data for new drug
        commodityId = receiveStockForm.commodityId;
        commodityName = receiveStockForm.commodityName;
        packType = receiveStockForm.packType;
        packTypeId = receiveStockForm.packTypeId;
        commodityType = receiveStockForm.commodityType;
      } else {
        // Find the existing drug
        const currentDrug = drugs.find(d => d.id === receiveStockForm.itemId);
        if (!currentDrug) {
          setReceiveError('Drug not found');
          return;
        }
        commodityId = currentDrug.commodity_id;
        commodityName = currentDrug.commodity_name;
        packType = currentDrug.pack_type;
        packTypeId = currentDrug.pack_type_id;
        commodityType = currentDrug.commodity_type;
      }

      // Parse expiry date if provided (format: YYYY-MM-DD)
      let expiryMonth: number | undefined;
      let expiryYear: number | undefined;
      if (receiveStockForm.expiryDate) {
        const expiryDate = new Date(receiveStockForm.expiryDate);
        expiryMonth = expiryDate.getMonth() + 1; // JavaScript months are 0-indexed
        expiryYear = expiryDate.getFullYear();
      }

      // Prepare receive stock request
      const receiveData: ReceiveDrugStockRequest = {
        commodity_id: commodityId,
        commodity_name: commodityName,
        pack_type: packType,
        pack_type_id: packTypeId,
        commodity_type: commodityType,
        quantity: receiveStockForm.quantity,
        batch_no: receiveStockForm.batchNumber || undefined,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        reference_no: receiveStockForm.referenceNo || undefined,
        notes: receiveStockForm.notes || undefined,
      };

      // Call the receive stock API
      await pharmacyApi.receiveStock(receiveData);

      // Reset form and close modal
      setReceiveStockForm({
        isNewDrug: false,
        itemId: null,
        commodityId: '',
        commodityName: '',
        packType: '',
        packTypeId: '',
        commodityType: '',
        quantity: 0,
        batchNumber: '',
        expiryDate: '',
        referenceNo: '',
        notes: '',
      });
      setShowReceiveStock(false);

      // Refresh drug list
      await fetchDrugs();

    } catch (err) {
      console.error('Failed to receive stock:', err);
      setReceiveError(getErrorMessage(err));
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Calculate stats from real data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const outOfStock = drugs.filter(d => (d.quantity || 0) === 0).length;
  const lowStock = drugs.filter(d => {
    const qty = d.quantity || 0;
    return qty > 0 && qty <= 10;
  }).length;
  const expiringThisMonth = drugs.filter(d => {
    if (!d.expiry_month || !d.expiry_year) return false;
    return d.expiry_month === currentMonth && d.expiry_year === currentYear;
  }).length;

  const stats = [
    {
      name: 'Items Below Minimum',
      value: lowStock.toString(),
      icon: AlertTriangle,
      changeType: 'warning' as const,
      description: 'Reorder needed',
    },
    {
      name: 'Expiring This Month',
      value: expiringThisMonth.toString(),
      icon: Calendar,
      changeType: 'warning' as const,
      description: 'Check expiry dates',
    },
    {
      name: 'Total Items',
      value: drugs.length.toString(),
      icon: Package,
      changeType: 'neutral' as const,
      description: 'In catalog',
    },
    {
      name: 'Out of Stock',
      value: outOfStock.toString(),
      icon: TrendingDown,
      changeType: 'error' as const,
      description: 'Urgent restocking',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor stock levels and manage inventory
        </p>
      </div>

      {/* Alert Banner */}
      {alertSummary && (alertSummary.critical_count > 0 || alertSummary.warning_count > 0) && (
        <div className={`rounded-xl border p-4 ${
          alertSummary.critical_count > 0
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className={`h-5 w-5 mt-0.5 ${
                alertSummary.critical_count > 0 ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-semibold ${
                  alertSummary.critical_count > 0 ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {alertSummary.critical_count > 0 ? 'Critical Stock Alerts' : 'Stock Warnings'}
                </h3>
                <p className={`text-sm mt-1 ${
                  alertSummary.critical_count > 0 ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {alertSummary.out_of_stock_count > 0 && (
                    <span className="font-medium">{alertSummary.out_of_stock_count} items out of stock</span>
                  )}
                  {alertSummary.out_of_stock_count > 0 && alertSummary.low_stock_count > 0 && ', '}
                  {alertSummary.low_stock_count > 0 && (
                    <span>{alertSummary.low_stock_count} items low on stock</span>
                  )}
                  {alertSummary.near_expiry_count > 0 && (
                    <span>, {alertSummary.near_expiry_count} items near expiry</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAlertsTab(true)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                alertSummary.critical_count > 0
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${
                stat.changeType === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : stat.changeType === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-[#5b21b6]/10'
              }`}>
                <stat.icon className={`h-5 w-5 ${
                  stat.changeType === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : stat.changeType === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#5b21b6]'
                }`} />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'warning'
                    ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'
                    : stat.changeType === 'error'
                    ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                }`}
              >
                {stat.description}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowReceiveStock(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Receive Stock
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </button>
          <Link
            href="/dashboard/inventory/movements"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <History className="h-4 w-4" />
            Stock Movement History
          </Link>
          <Link
            href="/dashboard/pharmacy/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#5b21b6] text-[#5b21b6] text-sm font-medium hover:bg-[#5b21b6]/10 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Pharmacy Inventory
          </Link>
        </div>
      </div>
      {/* Inventory Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Current Stock
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pack Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5b21b6]" />
                    <p className="mt-2 text-sm text-gray-500">Loading inventory...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No items in inventory</p>
                    <p className="text-xs text-gray-400">Upload drugs to get started</p>
                  </td>
                </tr>
              ) : (
                drugs.map((drug) => {
                  const qty = drug.quantity || 0;
                  const isExpired = drug.expiry_month && drug.expiry_year && 
                    (drug.expiry_year < currentYear || 
                     (drug.expiry_year === currentYear && drug.expiry_month < currentMonth));
                  const isExpiringSoon = drug.expiry_month && drug.expiry_year &&
                    drug.expiry_year === currentYear && 
                    drug.expiry_month >= currentMonth &&
                    drug.expiry_month <= currentMonth + 3;
                  
                  const status = qty === 0 ? 'out' : qty <= 10 ? 'low' : isExpired ? 'expired' : isExpiringSoon ? 'expiring' : 'good';
                  
                  return (
                    <tr key={drug.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {drug.commodity_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`font-semibold ${
                          status === 'out' ? 'text-red-600 dark:text-red-400' :
                          status === 'low' ? 'text-amber-600 dark:text-amber-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {qty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {drug.pack_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={
                          isExpired || isExpiringSoon
                            ? 'text-amber-600 dark:text-amber-400 font-medium' 
                            : 'text-gray-900 dark:text-white'
                        }>
                          {drug.expiry_month && drug.expiry_year 
                            ? `${String(drug.expiry_month).padStart(2, '0')}/${drug.expiry_year}`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'good'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : status === 'low'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : status === 'out'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : status === 'expired'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {status === 'good' ? 'In Stock' :
                           status === 'low' ? 'Low Stock' :
                           status === 'out' ? 'Out of Stock' :
                           status === 'expired' ? 'Expired' :
                           'Expiring Soon'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedDrug(drug);
                            setManageModalOpen(true);
                          }}
                          className="text-[#5b21b6] hover:text-[#4c1d95] font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Drug Modal */}
      {manageModalOpen && selectedDrug && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#5b21b6] px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">Manage Drug - {selectedDrug.commodity_name}</h3>
              <button
                onClick={() => {
                  setManageModalOpen(false);
                  setSelectedDrug(null);
                }}
                className="text-white hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commodity ID</label>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedDrug.commodity_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pack Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedDrug.pack_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Stock</label>
                  <p className="text-gray-900 dark:text-white font-semibold text-lg">{selectedDrug.quantity || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch No</label>
                  <p className="text-gray-900 dark:text-white">{selectedDrug.batch_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedDrug.expiry_month && selectedDrug.expiry_year 
                      ? `${String(selectedDrug.expiry_month).padStart(2, '0')}/${selectedDrug.expiry_year}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedDrug.commodity_type}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setManageModalOpen(false);
                    setSelectedDrug(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {showAlertsTab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Stock Alerts
              </h2>
              <button
                onClick={() => setShowAlertsTab(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Alert Summary */}
            {alertSummary && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{alertSummary.critical_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Critical</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{alertSummary.warning_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Warning</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertSummary.out_of_stock_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Out of Stock</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertSummary.low_stock_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Low Stock</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">
                              {formatAlertType(alert.alert_type)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {alert.item_code || 'N/A'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {alert.item_name || 'Unknown Item'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {alert.message}
                          </p>
                          {alert.current_value !== null && (
                            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                              <span>Current: <strong>{alert.current_value}</strong></span>
                              {alert.threshold_value !== null && (
                                <span>Threshold: <strong>{alert.threshold_value}</strong></span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="px-3 py-1 text-sm rounded bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
              <button
                onClick={() => setShowAlertsTab(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Receive Stock
              </h3>
              <button
                onClick={() => {
                  setShowReceiveStock(false);
                  setReceiveError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {receiveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {receiveError}
                </div>
              )}
              <form onSubmit={handleReceiveStock} className="space-y-4">
                {/* Toggle for New Drug */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newDrugToggle"
                    checked={receiveStockForm.isNewDrug}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, isNewDrug: e.target.checked, itemId: null })}
                    className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="newDrugToggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add New Drug
                  </label>
                </div>

                {!receiveStockForm.isNewDrug ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Item *
                    </label>
                    <select
                      value={receiveStockForm.itemId || ''}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, itemId: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      required={!receiveStockForm.isNewDrug}
                    >
                      <option value="">Choose a drug...</option>
                      {drugs.length > 0 ? (
                        drugs.map((drug) => (
                          <option key={drug.id} value={drug.id}>
                            {drug.commodity_name} ({drug.commodity_id}) - Current Stock: {drug.quantity || 0}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No drugs found. Please upload drugs first using Bulk Upload.</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Commodity ID *
                        </label>
                        <input
                          type="text"
                          value={receiveStockForm.commodityId}
                          onChange={(e) => setReceiveStockForm({ ...receiveStockForm, commodityId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                          placeholder="ARV-001"
                          required={receiveStockForm.isNewDrug}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Commodity Name *
                        </label>
                        <input
                          type="text"
                          value={receiveStockForm.commodityName}
                          onChange={(e) => setReceiveStockForm({ ...receiveStockForm, commodityName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                          placeholder="Dolutegravir 50mg"
                          required={receiveStockForm.isNewDrug}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pack Type *
                        </label>
                        <input
                          type="text"
                          value={receiveStockForm.packType}
                          onChange={(e) => setReceiveStockForm({ ...receiveStockForm, packType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                          placeholder="Bottle"
                          required={receiveStockForm.isNewDrug}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pack Type ID *
                        </label>
                        <input
                          type="text"
                          value={receiveStockForm.packTypeId}
                          onChange={(e) => setReceiveStockForm({ ...receiveStockForm, packTypeId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                          placeholder="BTL-001"
                          required={receiveStockForm.isNewDrug}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Commodity Type *
                      </label>
                      <input
                        type="text"
                        value={receiveStockForm.commodityType}
                        onChange={(e) => setReceiveStockForm({ ...receiveStockForm, commodityType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                        placeholder="ARV"
                        required={receiveStockForm.isNewDrug}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    value={receiveStockForm.quantity || ''}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    placeholder="0"
                    required
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={receiveStockForm.batchNumber}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, batchNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                      placeholder="Enter batch no"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={receiveStockForm.expiryDate}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference No
                  </label>
                  <input
                    type="text"
                    value={receiveStockForm.referenceNo}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    placeholder="PO-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={receiveStockForm.notes}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
                    placeholder="Additional notes (optional)"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingReceive}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submittingReceive && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submittingReceive ? 'Receiving Stock...' : 'Receive Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiveStock(false);
                      setReceiveError('');
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bulk Upload Inventory
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload an Excel file with drug inventory data
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setUploadFile(null);
                  setUploadError('');
                  setUploadSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Excel File Requirements
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>IMPORTANT:</strong> Columns must be in this exact order (left to right):
                    </p>
                    <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li><strong>commodity_name</strong> - Drug/item name (REQUIRED)</li>
                      <li><strong>commodity_id</strong> - Unique commodity identifier (REQUIRED)</li>
                      <li><strong>pack_type</strong> - Package type e.g., Bottle, Box, Strip (REQUIRED)</li>
                      <li><strong>pack_type_id</strong> - Pack type identifier (REQUIRED)</li>
                      <li><strong>commodity_type</strong> - Type category e.g., Drug, Supply (REQUIRED)</li>
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
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-semibold">
                      ⚠️ The first row should contain these column headers in the exact order shown above.
                    </p>
                    <a
                      href="/templates/inventory-template.xlsx"
                      download="inventory-template.xlsx"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Download Template (Pre-formatted with correct columns)
                    </a>
                  </div>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleBulkUpload} className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Excel File
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#5b21b6] dark:hover:border-[#5b21b6] transition-colors bg-gray-50 dark:bg-neutral-800">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {uploadFile ? (
                            <span className="font-medium text-[#5b21b6]">{uploadFile.name}</span>
                          ) : (
                            <>
                              <span className="font-medium text-[#5b21b6]">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{uploadFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        className="ml-auto text-red-600 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {uploadError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono">
                      {uploadError}
                    </p>
                  </div>
                )}

                {/* Success Display */}
                {uploadSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">{uploadSuccess}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUpload(false);
                      setUploadFile(null);
                      setUploadError('');
                      setUploadSuccess('');
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
