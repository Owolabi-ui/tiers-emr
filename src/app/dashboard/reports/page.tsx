'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  reportsApi, 
  SavedReport, 
  ReportType, 
  ReportStatus,
  ReportFormat,
  GenerateReportRequest 
} from '@/lib/reports';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/toast-provider';
import { 
  FileText, 
  Download, 
  Plus, 
  X, 
  Calendar,
  Filter,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [filters, setFilters] = useState({
    report_type: '' as ReportType | '',
    status: '' as ReportStatus | '',
  });

  // Generate report form state
  const [generateData, setGenerateData] = useState<GenerateReportRequest>({
    title: '',
    description: '',
    report_type: 'CLINICAL',
    period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    report_format: 'EXCEL',
  });

  // Fetch reports with polling for in-progress reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => {
      const params: any = {};
      if (filters.report_type) params.report_type = filters.report_type;
      if (filters.status) params.status = filters.status;
      return reportsApi.list(params);
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Poll every 5 seconds if there are pending/processing reports
      const hasActiveReports = query.state.data?.reports.some(
        r => r.status === 'PENDING' || r.status === 'PROCESSING'
      );
      return hasActiveReports ? 5000 : false;
    },
  });

  const reports = reportsData?.reports || [];

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: reportsApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowGenerateModal(false);
      setGenerateData({
        title: '',
        description: '',
        report_type: 'CLINICAL',
        period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        report_format: 'EXCEL',
      });
      showSuccess('Report generation started', 'Your report is being generated and will be ready shortly');
    },
    onError: (error: any) => {
      console.error('Failed to generate report:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      showError('Failed to generate report', errorMessage);
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete report:', error);
      showError('Failed to delete report', 'An error occurred while deleting the report');
    },
  });

  const handleGenerate = () => {
    // Convert date strings to ISO 8601 datetime format
    const payload = {
      ...generateData,
      period_start: `${generateData.period_start}T00:00:00Z`,
      period_end: `${generateData.period_end}T23:59:59Z`,
    };
    generateMutation.mutate(payload);
  }; 

  const handleDownload = async (report: SavedReport) => {
    try {
      const blob = await reportsApi.download(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Map report format to proper file extensions
      const extensionMap: Record<string, string> = {
        'EXCEL': 'xlsx',
        'JSON': 'json',
        'CSV': 'csv',
        'PDF': 'pdf',
      };
      const extension = extensionMap[report.report_format] || report.report_format.toLowerCase();
      a.download = `${report.title}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download report:', error);
      const errorMessage = error.response?.data?.error || 'Unable to download the report';
      showError('Download failed', errorMessage);
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PROCESSING':
      case 'PENDING':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatReportType = (type: ReportType) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and manage system reports
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.report_type}
          onChange={(e) => setFilters({ ...filters, report_type: e.target.value as ReportType | '' })}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="">All Types</option>
          <option value="PEPFAR_MER">PEPFAR MER</option>
          <option value="CLINICAL">Clinical</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="LABORATORY">Laboratory</option>
          <option value="CUSTOM">Custom</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as ReportStatus | '' })}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No reports found</p>
            <p className="text-sm mt-2">Generate your first report to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(report.status)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {report.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {formatReportType(report.report_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                      </span>
                      <span>Format: {report.report_format}</span>
                      {report.file_size && <span>Size: {formatFileSize(report.file_size)}</span>}
                      <span>{formatDate(report.created_at)}</span>
                    </div>

                    {report.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error: {report.error_message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {report.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this report?')) {
                          deleteMutation.mutate(report.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Report</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={generateData.title}
                  onChange={(e) => setGenerateData({ ...generateData, title: e.target.value })}
                  placeholder="Enter report title"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={generateData.description}
                  onChange={(e) => setGenerateData({ ...generateData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  value={generateData.report_type}
                  onChange={(e) => setGenerateData({ ...generateData, report_type: e.target.value as ReportType })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="CLINICAL">Clinical</option>
                  <option value="PEPFAR_MER">PEPFAR MER</option>
                          <option value="PHARMACY">Pharmacy</option>
                  <option value="LABORATORY">Laboratory</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={generateData.period_start}
                    onChange={(e) => setGenerateData({ ...generateData, period_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={generateData.period_end}
                    onChange={(e) => setGenerateData({ ...generateData, period_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Format is fixed to EXCEL - no need to show selector */}
              <input type="hidden" value="EXCEL" />

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !generateData.title.trim()}
                  className="flex-1 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
