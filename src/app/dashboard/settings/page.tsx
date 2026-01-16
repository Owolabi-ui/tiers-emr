'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  SystemSettings,
  UpdateSettingsRequest,
  UpdateIntegrationSettingsRequest
} from '@/lib/settings';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/toast-provider';
import {
  Building2,
  Globe,
  Calendar,
  Stethoscope,
  Package,
  FileText,
  Settings as SettingsIcon,
  Database,
  Shield,
  Plug,
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react';

type TabType = 'facility' | 'regional' | 'appointments' | 'clinical' | 'inventory' | 'reports' | 'system' | 'backup' | 'compliance' | 'integrations';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('facility');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user is admin
  if (user?.role !== 'Admin') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need administrator privileges to access system settings
          </p>
        </div>
      </div>
    );
  }

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    enabled: !!user,
  });

  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  // Update formData when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSettingsRequest) => settingsApi.update(data),
    onSuccess: (data) => {
      setFormData(data);
      setHasChanges(false);
      queryClient.setQueryData(['settings'], data);
      showSuccess('Settings updated', 'System settings have been updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update settings:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      showError('Failed to update settings', errorMessage);
    },
  });

  // Update integration settings mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: (data: UpdateIntegrationSettingsRequest) => settingsApi.updateIntegration(data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showSuccess('Integration settings updated', 'Integration settings have been updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update integration settings:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      showError('Failed to update integration settings', errorMessage);
    },
  });

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (activeTab === 'integrations') {
      // Handle integration settings separately
      const integrationData: UpdateIntegrationSettingsRequest = {
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_username: formData.smtp_username,
        smtp_use_tls: formData.smtp_use_tls,
        sms_provider: formData.sms_provider,
        sms_sender_id: formData.sms_sender_id,
        enable_sms_notifications: formData.enable_sms_notifications,
        dhis2_api_url: formData.dhis2_api_url,
        dhis2_username: formData.dhis2_username,
        enable_dhis2_sync: formData.enable_dhis2_sync,
        dhis2_org_unit_id: formData.dhis2_org_unit_id,
      };
      updateIntegrationMutation.mutate(integrationData);
    } else {
      // Handle general settings
      const updateData: UpdateSettingsRequest = formData as UpdateSettingsRequest;
      updateMutation.mutate(updateData);
    }
  };

  const tabs = [
    { id: 'facility' as TabType, label: 'Facility Info', icon: Building2 },
    { id: 'regional' as TabType, label: 'Regional', icon: Globe },
    { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
    { id: 'clinical' as TabType, label: 'Clinical', icon: Stethoscope },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Package },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
    { id: 'system' as TabType, label: 'System', icon: SettingsIcon },
    { id: 'backup' as TabType, label: 'Backup', icon: Database },
    { id: 'compliance' as TabType, label: 'Compliance', icon: Shield },
    { id: 'integrations' as TabType, label: 'Integrations', icon: Plug },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure facility information and system preferences
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || updateIntegrationMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(updateMutation.isPending || updateIntegrationMutation.isPending) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#5b21b6] text-white'
                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {activeTab === 'facility' && (
          <FacilityTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'regional' && (
          <RegionalTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'clinical' && (
          <ClinicalTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'system' && (
          <SystemTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'backup' && (
          <BackupTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'compliance' && (
          <ComplianceTab formData={formData} onChange={handleInputChange} />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsTab formData={formData} onChange={handleInputChange} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

interface TabProps {
  formData: Partial<SystemSettings>;
  onChange: (field: keyof SystemSettings, value: any) => void;
}

function FacilityTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Facility Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facility Name *
            </label>
            <input
              type="text"
              value={formData.facility_name || ''}
              onChange={(e) => onChange('facility_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facility Code
            </label>
            <input
              type="text"
              value={formData.facility_code || ''}
              onChange={(e) => onChange('facility_code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={formData.facility_address || ''}
              onChange={(e) => onChange('facility_address', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.facility_city || ''}
              onChange={(e) => onChange('facility_city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State
            </label>
            <input
              type="text"
              value={formData.facility_state || ''}
              onChange={(e) => onChange('facility_state', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.facility_country || ''}
              onChange={(e) => onChange('facility_country', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.facility_postal_code || ''}
              onChange={(e) => onChange('facility_postal_code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email || ''}
              onChange={(e) => onChange('contact_email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone || ''}
              onChange={(e) => onChange('contact_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fax
            </label>
            <input
              type="tel"
              value={formData.contact_fax || ''}
              onChange={(e) => onChange('contact_fax', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.contact_website || ''}
              onChange={(e) => onChange('contact_website', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionalTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Regional Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone || 'Africa/Lagos'}
            onChange={(e) => onChange('timezone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          >
            <option value="Africa/Lagos">Africa/Lagos</option>
            <option value="Africa/Abuja">Africa/Abuja</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Format
          </label>
          <select
            value={formData.date_format || 'DD/MM/YYYY'}
            onChange={(e) => onChange('date_format', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Format
          </label>
          <select
            value={formData.time_format || '12_HOUR'}
            onChange={(e) => onChange('time_format', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          >
            <option value="12_HOUR">12 Hour</option>
            <option value="24_HOUR">24 Hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Code
          </label>
          <input
            type="text"
            value={formData.currency_code || ''}
            onChange={(e) => onChange('currency_code', e.target.value)}
            placeholder="NGN"
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <input
            type="text"
            value={formData.language || ''}
            onChange={(e) => onChange('language', e.target.value)}
            placeholder="en"
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function AppointmentsTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Appointment Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.default_appointment_duration_minutes || 30}
            onChange={(e) => onChange('default_appointment_duration_minutes', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reminder Hours Before
          </label>
          <input
            type="number"
            value={formData.appointment_reminder_hours || 24}
            onChange={(e) => onChange('appointment_reminder_hours', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Appointments Per Slot
          </label>
          <input
            type="number"
            value={formData.max_appointments_per_slot || 5}
            onChange={(e) => onChange('max_appointments_per_slot', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_reminders"
            checked={formData.enable_appointment_reminders || false}
            onChange={(e) => onChange('enable_appointment_reminders', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_reminders" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Appointment Reminders
          </label>
        </div>
      </div>
    </div>
  );
}

function ClinicalTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Clinical Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Vitals Interval (hours)
          </label>
          <input
            type="number"
            value={formData.default_vitals_interval_hours || 8}
            onChange={(e) => onChange('default_vitals_interval_hours', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require_vitals"
            checked={formData.require_vitals_before_consultation || false}
            onChange={(e) => onChange('require_vitals_before_consultation', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="require_vitals" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Require Vitals Before Consultation
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_biometric"
            checked={formData.enable_biometric_verification || false}
            onChange={(e) => onChange('enable_biometric_verification', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_biometric" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Biometric Verification
          </label>
        </div>
      </div>
    </div>
  );
}

function InventoryTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Inventory & Pharmacy Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={formData.low_stock_threshold || 10}
            onChange={(e) => onChange('low_stock_threshold', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Alert (days)
          </label>
          <input
            type="number"
            value={formData.expiry_alert_days || 30}
            onChange={(e) => onChange('expiry_alert_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_auto_reorder"
            checked={formData.enable_auto_reorder || false}
            onChange={(e) => onChange('enable_auto_reorder', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_auto_reorder" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Auto-Reorder
          </label>
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Report Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Report Format
          </label>
          <select
            value={formData.default_report_format || 'PDF'}
            onChange={(e) => onChange('default_report_format', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          >
            <option value="PDF">PDF</option>
            <option value="EXCEL">Excel</option>
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="include_logo"
            checked={formData.include_facility_logo_in_reports || false}
            onChange={(e) => onChange('include_facility_logo_in_reports', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="include_logo" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Include Logo in Reports
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report Footer Text
          </label>
          <textarea
            value={formData.report_footer_text || ''}
            onChange={(e) => onChange('report_footer_text', e.target.value)}
            rows={3}
            placeholder="Optional footer text for reports..."
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function SystemTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        System Preferences
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={formData.session_timeout_minutes || 30}
            onChange={(e) => onChange('session_timeout_minutes', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Expiry (days)
          </label>
          <input
            type="number"
            value={formData.password_expiry_days || 90}
            onChange={(e) => onChange('password_expiry_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            value={formData.min_password_length || 8}
            onChange={(e) => onChange('min_password_length', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require_password_change"
            checked={formData.require_password_change_on_first_login || false}
            onChange={(e) => onChange('require_password_change_on_first_login', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="require_password_change" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Require Password Change on First Login
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_2fa"
            checked={formData.enable_two_factor_auth || false}
            onChange={(e) => onChange('enable_two_factor_auth', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_2fa" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Two-Factor Authentication
          </label>
        </div>
      </div>
    </div>
  );
}

function BackupTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Backup Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Backup Frequency (hours)
          </label>
          <input
            type="number"
            value={formData.backup_frequency_hours || 24}
            onChange={(e) => onChange('backup_frequency_hours', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Backup Retention (days)
          </label>
          <input
            type="number"
            value={formData.backup_retention_days || 30}
            onChange={(e) => onChange('backup_retention_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_auto_backup"
            checked={formData.enable_auto_backup || false}
            onChange={(e) => onChange('enable_auto_backup', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_auto_backup" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Automatic Backups
          </label>
        </div>
      </div>
    </div>
  );
}

function ComplianceTab({ formData, onChange }: TabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Audit & Compliance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Audit Log Retention (days)
          </label>
          <input
            type="number"
            value={formData.audit_log_retention_days || 365}
            onChange={(e) => onChange('audit_log_retention_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Patient Data Retention (years)
          </label>
          <input
            type="number"
            value={formData.patient_data_retention_years || 7}
            onChange={(e) => onChange('patient_data_retention_years', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_audit"
            checked={formData.enable_audit_logs || false}
            onChange={(e) => onChange('enable_audit_logs', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_audit" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Audit Logs
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require_reason"
            checked={formData.require_reason_for_record_modification || false}
            onChange={(e) => onChange('require_reason_for_record_modification', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="require_reason" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Require Reason for Modifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enable_anonymization"
            checked={formData.enable_data_anonymization || false}
            onChange={(e) => onChange('enable_data_anonymization', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable_anonymization" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Data Anonymization
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="hipaa_mode"
            checked={formData.hipaa_compliance_mode || false}
            onChange={(e) => onChange('hipaa_compliance_mode', e.target.checked)}
            className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="hipaa_mode" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            HIPAA Compliance Mode
          </label>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab({ formData, onChange }: TabProps) {
  const [showPasswords, setShowPasswords] = useState({
    smtp: false,
    sms: false,
    dhis2: false,
  });

  return (
    <div className="space-y-8">
      {/* SMTP Settings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SMTP Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={formData.smtp_host || ''}
              onChange={(e) => onChange('smtp_host', e.target.value)}
              placeholder="smtp.example.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={formData.smtp_port || ''}
              onChange={(e) => onChange('smtp_port', parseInt(e.target.value))}
              placeholder="587"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={formData.smtp_username || ''}
              onChange={(e) => onChange('smtp_username', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="smtp_tls"
              checked={formData.smtp_use_tls || false}
              onChange={(e) => onChange('smtp_use_tls', e.target.checked)}
              className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="smtp_tls" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Use TLS
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Password (encrypted)
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Note: Passwords are encrypted before storage. Leave empty to keep existing password.
            </div>
            <input
              type="password"
              placeholder="Leave empty to keep existing"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* SMS Settings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SMS Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMS Provider
            </label>
            <input
              type="text"
              value={formData.sms_provider || ''}
              onChange={(e) => onChange('sms_provider', e.target.value)}
              placeholder="Twilio, AWS SNS, etc."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sender ID
            </label>
            <input
              type="text"
              value={formData.sms_sender_id || ''}
              onChange={(e) => onChange('sms_sender_id', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enable_sms"
              checked={formData.enable_sms_notifications || false}
              onChange={(e) => onChange('enable_sms_notifications', e.target.checked)}
              className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enable_sms" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable SMS Notifications
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMS API Key (encrypted)
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              API key is encrypted before storage. Leave empty to keep existing.
            </div>
            <input
              type="password"
              placeholder="Leave empty to keep existing"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* DHIS2 Settings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          DHIS2 Integration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DHIS2 API URL
            </label>
            <input
              type="url"
              value={formData.dhis2_api_url || ''}
              onChange={(e) => onChange('dhis2_api_url', e.target.value)}
              placeholder="https://dhis2.example.com/api"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DHIS2 Username
            </label>
            <input
              type="text"
              value={formData.dhis2_username || ''}
              onChange={(e) => onChange('dhis2_username', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Unit ID
            </label>
            <input
              type="text"
              value={formData.dhis2_org_unit_id || ''}
              onChange={(e) => onChange('dhis2_org_unit_id', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enable_dhis2"
              checked={formData.enable_dhis2_sync || false}
              onChange={(e) => onChange('enable_dhis2_sync', e.target.checked)}
              className="w-4 h-4 text-[#5b21b6] bg-gray-100 border-gray-300 rounded focus:ring-[#5b21b6] dark:focus:ring-[#5b21b6] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enable_dhis2" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable DHIS2 Sync
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DHIS2 Password (encrypted)
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Password is encrypted before storage. Leave empty to keep existing.
            </div>
            <input
              type="password"
              placeholder="Leave empty to keep existing"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
