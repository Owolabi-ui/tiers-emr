'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { htsApi } from '@/lib/hts';
import { prepApi } from '@/lib/prep';
import { pepApi } from '@/lib/pep';
import { artApi } from '@/lib/art';
import { laboratoryApi } from '@/lib/laboratory';
import { pharmacyApi } from '@/lib/pharmacy';
import { inventoryApi } from '@/lib/inventory';
import { dashboardApi } from '@/lib/dashboard';
import {
  FileText,
  Download,
  Printer,
  Activity,
  Heart,
  Shield,
  ShieldCheck,
  FlaskConical,
  Pill,
  Package,
  Brain,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
} from 'lucide-react';

// Print styles for proper page breaks
const printStyles = `
  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
    .print-break-before {
      page-break-before: always;
    }
    .print-break-after {
      page-break-after: always;
    }
    .print-avoid-break {
      page-break-inside: avoid;
    }
    .report-section {
      page-break-inside: avoid;
      margin-bottom: 20px;
    }
    .stat-card {
      page-break-inside: avoid;
    }
    @page {
      margin: 1cm;
      size: A4;
    }
  }
`;

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function StatCard({ title, value, icon, iconBg, change, changeType }: StatCardProps) {
  return (
    <div className="stat-card rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6 print-avoid-break">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              changeType === 'positive' ? 'text-green-600' :
              changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
}

function SectionHeader({ title, icon, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 print-avoid-break">
      <div className="p-2 rounded-lg bg-[#5b21b6]/10">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const printRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Determine which sections to show based on role
  const userRole = user?.role || 'Admin';
  const showClinical = ['Admin', 'Doctor', 'Nurse'].includes(userRole);
  const showPharmacy = ['Admin', 'Pharmacist'].includes(userRole);
  const showLab = ['Admin', 'LabTech'].includes(userRole);
  const showMentalHealth = ['Admin', 'Psychologist'].includes(userRole);

  // Fetch HTS Statistics
  const { data: htsStats, isLoading: htsLoading } = useQuery({
    queryKey: ['hts-stats'],
    queryFn: () => htsApi.getStatistics(),
    enabled: showClinical,
  });

  // Fetch PrEP data
  const { data: prepData, isLoading: prepLoading } = useQuery({
    queryKey: ['prep-list'],
    queryFn: () => prepApi.getAll(),
    enabled: showClinical,
  });

  // Fetch PEP data
  const { data: pepData, isLoading: pepLoading } = useQuery({
    queryKey: ['pep-list'],
    queryFn: () => pepApi.getAll(),
    enabled: showClinical,
  });

  // Fetch ART data
  const { data: artData, isLoading: artLoading } = useQuery({
    queryKey: ['art-list'],
    queryFn: () => artApi.getAll(),
    enabled: showClinical,
  });

  // Fetch Lab Statistics
  const { data: labStats, isLoading: labLoading } = useQuery({
    queryKey: ['lab-stats'],
    queryFn: () => laboratoryApi.getStatistics(),
    enabled: showLab,
  });

  // Fetch Pharmacy data (drugs list for stock info)
  const { data: drugsData, isLoading: drugsLoading } = useQuery({
    queryKey: ['drugs-list'],
    queryFn: () => pharmacyApi.getDrugs(),
    enabled: showPharmacy,
  });

  // Fetch Pharmacy alerts
  const { data: stockAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => pharmacyApi.getStockAlerts(),
    enabled: showPharmacy,
  });

  // Fetch Inventory items
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: () => inventoryApi.getItems(),
    enabled: showPharmacy,
  });

  // Fetch Dashboard stats for overall numbers
  const { data: dashboardStats, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    enabled: true,
  });

  // Calculate derived statistics
  const prepStats = {
    total: Array.isArray(prepData) ? prepData.length : 0,
    active: Array.isArray(prepData) ? prepData.filter(p => p.status === 'Active').length : 0,
    newThisMonth: Array.isArray(prepData) ? prepData.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length : 0,
  };

  const pepStats = {
    total: Array.isArray(pepData) ? pepData.length : 0,
    active: Array.isArray(pepData) ? pepData.filter(p => p.status === 'Active').length : 0,
    occupational: Array.isArray(pepData) ? pepData.filter(p => p.mode_of_exposure === 'Occupational').length : 0,
    nonOccupational: Array.isArray(pepData) ? pepData.filter(p => p.mode_of_exposure === 'Non-occupational').length : 0,
  };

  const artStats = {
    total: Array.isArray(artData) ? artData.length : 0,
    active: Array.isArray(artData) ? artData.filter(a => a.status === 'Active').length : 0,
    onEAC: Array.isArray(artData) ? artData.filter(a => a.status === 'On EAC').length : 0,
    ltfu: Array.isArray(artData) ? artData.filter(a => a.status === 'LTFU').length : 0,
  };

  const pharmacyStats = {
    totalDrugs: drugsData?.drugs?.length || 0,
    lowStock: Array.isArray(stockAlerts) ? stockAlerts.filter((a: any) => a.alert_type === 'LowStock').length : 0,
    outOfStock: Array.isArray(stockAlerts) ? stockAlerts.filter((a: any) => a.alert_type === 'OutOfStock').length : 0,
    nearExpiry: Array.isArray(stockAlerts) ? stockAlerts.filter((a: any) => a.alert_type === 'NearExpiry').length : 0,
  };

  const inventoryStats = {
    totalItems: inventoryData?.items?.length || 0,
    lowStock: Array.isArray(inventoryData?.items) ? inventoryData.items.filter((i: any) => i.current_stock <= i.reorder_level).length : 0,
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Download as PDF (using print dialog)
  const handleDownload = () => {
    // Trigger print dialog which allows saving as PDF
    window.print();
  };

  const isLoading = htsLoading || prepLoading || pepLoading || artLoading || labLoading || drugsLoading || alertsLoading || inventoryLoading || dashboardLoading;

  return (
    <>
      {/* Inject print styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="h-full flex flex-col" ref={printRef}>
        {/* Header - Hide on print */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and export system reports
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Print Header - Show only on print */}
        <div className="hidden print:block mb-6">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold">TIERS EMR - System Report</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generated on {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-600">
              Report Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Date Range Filter - Hide on print */}
        <div className="flex gap-4 mb-6 no-print">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
              <p className="mt-4 text-sm text-gray-500">Loading report data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 flex-1 overflow-y-auto">
            {/* Overall Summary - Visible to all */}
            <div className="report-section">
              <SectionHeader
                title="Overall Summary"
                icon={<FileText className="h-5 w-5 text-[#5b21b6]" />}
                description="System-wide statistics"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Patients"
                  value={dashboardStats?.totalPatients?.toLocaleString() || '0'}
                  icon={<Users className="h-6 w-6 text-purple-600" />}
                  iconBg="bg-purple-100 dark:bg-purple-900/30"
                  change={`+${dashboardStats?.newPatientsThisMonth || 0} this month`}
                  changeType="positive"
                />
                <StatCard
                  title="Active on ART"
                  value={dashboardStats?.activeART?.toLocaleString() || '0'}
                  icon={<Heart className="h-6 w-6 text-red-600" />}
                  iconBg="bg-red-100 dark:bg-red-900/30"
                />
                <StatCard
                  title="Active on PrEP"
                  value={dashboardStats?.activePrEP?.toLocaleString() || '0'}
                  icon={<ShieldCheck className="h-6 w-6 text-green-600" />}
                  iconBg="bg-green-100 dark:bg-green-900/30"
                />
                <StatCard
                  title="Pending Lab Results"
                  value={dashboardStats?.pendingLabResults?.toLocaleString() || '0'}
                  icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                />
              </div>
            </div>

            {/* Clinical Reports - HTS */}
            {showClinical && (
              <div className="report-section print-break-before">
                <SectionHeader
                  title="HIV Testing Services (HTS)"
                  icon={<Activity className="h-5 w-5 text-[#5b21b6]" />}
                  description="Testing statistics and outcomes"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Tests"
                    value={(htsStats?.total_tests_reactive + htsStats?.total_tests_non_reactive) || 0}
                    icon={<Activity className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Positive (Reactive)"
                    value={htsStats?.total_tests_reactive || 0}
                    icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                    iconBg="bg-red-100 dark:bg-red-900/30"
                  />
                  <StatCard
                    title="Negative (Non-reactive)"
                    value={htsStats?.total_tests_non_reactive || 0}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Positivity Rate"
                    value={htsStats?.reactive_rate ? `${htsStats.reactive_rate.toFixed(1)}%` : '0%'}
                    icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                  />
                </div>
              </div>
            )}

            {/* Clinical Reports - PrEP */}
            {showClinical && (
              <div className="report-section">
                <SectionHeader
                  title="Pre-Exposure Prophylaxis (PrEP)"
                  icon={<ShieldCheck className="h-5 w-5 text-[#5b21b6]" />}
                  description="PrEP enrollment and status"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Enrolled"
                    value={prepStats.total}
                    icon={<Users className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Active Clients"
                    value={prepStats.active}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="New This Month"
                    value={prepStats.newThisMonth}
                    icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                    change="New enrollments"
                    changeType="positive"
                  />
                  <StatCard
                    title="Retention Rate"
                    value={prepStats.total > 0 ? `${((prepStats.active / prepStats.total) * 100).toFixed(1)}%` : '0%'}
                    icon={<Activity className="h-6 w-6 text-orange-600" />}
                    iconBg="bg-orange-100 dark:bg-orange-900/30"
                  />
                </div>
              </div>
            )}

            {/* Clinical Reports - PEP */}
            {showClinical && (
              <div className="report-section">
                <SectionHeader
                  title="Post-Exposure Prophylaxis (PEP)"
                  icon={<Shield className="h-5 w-5 text-[#5b21b6]" />}
                  description="PEP cases and exposure types"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Cases"
                    value={pepStats.total}
                    icon={<Users className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Active Cases"
                    value={pepStats.active}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Occupational"
                    value={pepStats.occupational}
                    icon={<Activity className="h-6 w-6 text-blue-600" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                  />
                  <StatCard
                    title="Non-Occupational"
                    value={pepStats.nonOccupational}
                    icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
                    iconBg="bg-orange-100 dark:bg-orange-900/30"
                  />
                </div>
              </div>
            )}

            {/* Clinical Reports - ART */}
            {showClinical && (
              <div className="report-section print-break-before">
                <SectionHeader
                  title="Antiretroviral Therapy (ART)"
                  icon={<Heart className="h-5 w-5 text-[#5b21b6]" />}
                  description="ART enrollment and treatment status"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Enrolled"
                    value={artStats.total}
                    icon={<Users className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Active on Treatment"
                    value={artStats.active}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="On EAC"
                    value={artStats.onEAC}
                    icon={<Clock className="h-6 w-6 text-yellow-600" />}
                    iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                  />
                  <StatCard
                    title="Lost to Follow-Up"
                    value={artStats.ltfu}
                    icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                    iconBg="bg-red-100 dark:bg-red-900/30"
                  />
                </div>
              </div>
            )}

            {/* Laboratory Reports */}
            {showLab && (
              <div className="report-section print-break-before">
                <SectionHeader
                  title="Laboratory"
                  icon={<FlaskConical className="h-5 w-5 text-[#5b21b6]" />}
                  description="Lab orders and turnaround times"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Orders"
                    value={labStats?.total_orders || 0}
                    icon={<FileText className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Pending Results"
                    value={labStats?.pending_results || 0}
                    icon={<Clock className="h-6 w-6 text-yellow-600" />}
                    iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                  />
                  <StatCard
                    title="Completed Today"
                    value={labStats?.completed_today || 0}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Critical Results"
                    value={labStats?.critical_results_pending || 0}
                    icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                    iconBg="bg-red-100 dark:bg-red-900/30"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <StatCard
                    title="STAT Orders Pending"
                    value={labStats?.stat_orders_pending || 0}
                    icon={<Activity className="h-6 w-6 text-orange-600" />}
                    iconBg="bg-orange-100 dark:bg-orange-900/30"
                  />
                  <StatCard
                    title="This Month"
                    value={labStats?.this_month_orders || 0}
                    icon={<Calendar className="h-6 w-6 text-blue-600" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                  />
                  <StatCard
                    title="Avg. Turnaround"
                    value={labStats?.average_turnaround_time_hours ? `${labStats.average_turnaround_time_hours.toFixed(1)}h` : 'N/A'}
                    icon={<Clock className="h-6 w-6 text-cyan-600" />}
                    iconBg="bg-cyan-100 dark:bg-cyan-900/30"
                  />
                  <StatCard
                    title="Completion Rate"
                    value={labStats?.completion_rate ? `${labStats.completion_rate.toFixed(1)}%` : '0%'}
                    icon={<TrendingUp className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                </div>
              </div>
            )}

            {/* Pharmacy Reports */}
            {showPharmacy && (
              <div className="report-section print-break-before">
                <SectionHeader
                  title="Pharmacy & Drug Stock"
                  icon={<Pill className="h-5 w-5 text-[#5b21b6]" />}
                  description="Drug inventory and stock alerts"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Drug Items"
                    value={pharmacyStats.totalDrugs}
                    icon={<Pill className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Low Stock"
                    value={pharmacyStats.lowStock}
                    icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
                    iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                    changeType={pharmacyStats.lowStock > 0 ? 'negative' : 'neutral'}
                  />
                  <StatCard
                    title="Out of Stock"
                    value={pharmacyStats.outOfStock}
                    icon={<AlertCircle className="h-6 w-6 text-red-600" />}
                    iconBg="bg-red-100 dark:bg-red-900/30"
                    changeType={pharmacyStats.outOfStock > 0 ? 'negative' : 'neutral'}
                  />
                  <StatCard
                    title="Near Expiry"
                    value={pharmacyStats.nearExpiry}
                    icon={<Clock className="h-6 w-6 text-orange-600" />}
                    iconBg="bg-orange-100 dark:bg-orange-900/30"
                    changeType={pharmacyStats.nearExpiry > 0 ? 'negative' : 'neutral'}
                  />
                </div>
              </div>
            )}

            {/* Inventory Reports */}
            {showPharmacy && (
              <div className="report-section">
                <SectionHeader
                  title="Inventory & Supplies"
                  icon={<Package className="h-5 w-5 text-[#5b21b6]" />}
                  description="General inventory status"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Items"
                    value={inventoryStats.totalItems}
                    icon={<Package className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Items Below Reorder Level"
                    value={inventoryStats.lowStock}
                    icon={<AlertCircle className="h-6 w-6 text-yellow-600" />}
                    iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                    changeType={inventoryStats.lowStock > 0 ? 'negative' : 'neutral'}
                  />
                </div>
              </div>
            )}

            {/* Mental Health Reports */}
            {showMentalHealth && (
              <div className="report-section print-break-before">
                <SectionHeader
                  title="Mental Health"
                  icon={<Brain className="h-5 w-5 text-[#5b21b6]" />}
                  description="Mental health assessments and counseling"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Assessments"
                    value="--"
                    icon={<FileText className="h-6 w-6 text-purple-600" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                  />
                  <StatCard
                    title="Counseling Sessions"
                    value="--"
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                  />
                  <StatCard
                    title="Active Patients"
                    value="--"
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Follow-ups Due"
                    value="--"
                    icon={<Calendar className="h-6 w-6 text-orange-600" />}
                    iconBg="bg-orange-100 dark:bg-orange-900/30"
                  />
                </div>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Mental health statistics API integration pending. Data will be available once the statistics endpoint is implemented.
                  </p>
                </div>
              </div>
            )}

            {/* Print Footer - Show only on print */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-gray-500">
              <p>TIERS EMR - Confidential Medical Report</p>
              <p>Page generated automatically. For official use only.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
