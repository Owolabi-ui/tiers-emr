'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  laboratoryApi,
  LabTestOrderWithDetails,
  LabTestStatus,
  LabTestPriority,
  LabStatisticsResponse,
  getStatusColor,
  getPriorityColor,
  formatOrderNumber,
} from '@/lib/laboratory';
import { getErrorMessage } from '@/lib/api';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  Filter,
  FlaskConical,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<LabTestOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<LabStatisticsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LabTestStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LabTestPriority | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        status?: LabTestStatus;
        priority?: LabTestPriority;
      } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const [ordersResponse, stats] = await Promise.all([
        laboratoryApi.getOrders(params),
        laboratoryApi.getStatistics(),
      ]);

      setOrders(ordersResponse.data || []);
      setStatistics(stats);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(search) ||
      order.test_info?.test_name.toLowerCase().includes(search) ||
      order.patient_name?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading laboratory data...</p>
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
            <p className="text-lg font-medium text-red-800 dark:text-red-300">Error loading laboratory data</p>
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
          <h1 className="text-2xl font-bold text-[#5b21b6]">Laboratory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage lab test orders, sample collection, and results
          </p>
        </div>
        <Link
          href="/dashboard/laboratory/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Lab Order
        </Link>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.total_orders || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FlaskConical className="h-6 w-6 text-[#5b21b6]" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {statistics.pending_results || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {statistics.completed_orders || 0}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {statistics.completed_today || 0} today
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Critical Results</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {statistics.critical_results_pending || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Repeat Tests Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {statistics.repeat_tests_pending || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, test name, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LabTestStatus | 'all')}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
            >
              <option value="all">All Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Communicated">Communicated</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as LabTestPriority | 'all')}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
            >
              <option value="all">All Priorities</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Lab Test Orders</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No lab orders found matching your filters'
                : 'No lab orders yet'}
            </p>
            <Link
              href="/dashboard/laboratory/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Lab Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Test Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ordered Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {formatOrderNumber(order.order_number)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {order.patient_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {order.test_info?.test_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {order.test_info?.test_category || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/laboratory/${order.id}`}
                        className="text-sm text-[#5b21b6] hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
