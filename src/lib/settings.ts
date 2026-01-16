// Settings API Client
import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type TimezoneType = 'Africa/Lagos' | 'Africa/Abuja' | 'UTC';
export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormatType = '12_HOUR' | '24_HOUR';

export interface PublicSettings {
  facility_name: string;
  facility_logo_url: string | null;
  timezone: TimezoneType;
  date_format: DateFormatType;
  time_format: TimeFormatType;
  currency_code: string;
  language: string;
  is_configured: boolean;
}

export interface SystemSettings {
  id: string;

  // Facility Information
  facility_name: string;
  facility_code: string | null;
  facility_address: string | null;
  facility_city: string | null;
  facility_state: string | null;
  facility_country: string;
  facility_postal_code: string | null;
  facility_logo_url: string | null;

  // Contact Information
  contact_email: string | null;
  contact_phone: string | null;
  contact_fax: string | null;
  contact_website: string | null;

  // Regional Settings
  timezone: TimezoneType;
  date_format: DateFormatType;
  time_format: TimeFormatType;
  currency_code: string;
  language: string;

  // Appointment Settings
  default_appointment_duration_minutes: number;
  appointment_reminder_hours: number;
  enable_appointment_reminders: boolean;
  max_appointments_per_slot: number;

  // Clinical Settings
  default_vitals_interval_hours: number;
  require_vitals_before_consultation: boolean;
  enable_biometric_verification: boolean;

  // Inventory/Pharmacy Settings
  low_stock_threshold: number;
  expiry_alert_days: number;
  enable_auto_reorder: boolean;

  // Report Settings
  default_report_format: string;
  include_facility_logo_in_reports: boolean;
  report_footer_text: string | null;

  // Integration Settings (encrypted fields are NOT returned)
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_use_tls: boolean;

  sms_provider: string | null;
  sms_sender_id: string | null;
  enable_sms_notifications: boolean;

  dhis2_api_url: string | null;
  dhis2_username: string | null;
  enable_dhis2_sync: boolean;
  dhis2_org_unit_id: string | null;

  // System Preferences
  session_timeout_minutes: number;
  password_expiry_days: number;
  require_password_change_on_first_login: boolean;
  min_password_length: number;
  enable_two_factor_auth: boolean;

  // Backup Settings
  enable_auto_backup: boolean;
  backup_frequency_hours: number;
  backup_retention_days: number;

  // Audit & Compliance
  enable_audit_logs: boolean;
  audit_log_retention_days: number;
  require_reason_for_record_modification: boolean;

  // Data Privacy
  patient_data_retention_years: number;
  enable_data_anonymization: boolean;
  hipaa_compliance_mode: boolean;

  // Metadata
  is_configured: boolean;
  configuration_completed_at: string | null;
  configuration_completed_by: string | null;

  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UpdateSettingsRequest {
  // Facility Information
  facility_name?: string;
  facility_code?: string | null;
  facility_address?: string | null;
  facility_city?: string | null;
  facility_state?: string | null;
  facility_country?: string;
  facility_postal_code?: string | null;
  facility_logo_url?: string | null;

  // Contact Information
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_fax?: string | null;
  contact_website?: string | null;

  // Regional Settings
  timezone?: TimezoneType;
  date_format?: DateFormatType;
  time_format?: TimeFormatType;
  currency_code?: string;
  language?: string;

  // Appointment Settings
  default_appointment_duration_minutes?: number;
  appointment_reminder_hours?: number;
  enable_appointment_reminders?: boolean;
  max_appointments_per_slot?: number;

  // Clinical Settings
  default_vitals_interval_hours?: number;
  require_vitals_before_consultation?: boolean;
  enable_biometric_verification?: boolean;

  // Inventory/Pharmacy Settings
  low_stock_threshold?: number;
  expiry_alert_days?: number;
  enable_auto_reorder?: boolean;

  // Report Settings
  default_report_format?: string;
  include_facility_logo_in_reports?: boolean;
  report_footer_text?: string | null;

  // System Preferences
  session_timeout_minutes?: number;
  password_expiry_days?: number;
  require_password_change_on_first_login?: boolean;
  min_password_length?: number;
  enable_two_factor_auth?: boolean;

  // Backup Settings
  enable_auto_backup?: boolean;
  backup_frequency_hours?: number;
  backup_retention_days?: number;

  // Audit & Compliance
  enable_audit_logs?: boolean;
  audit_log_retention_days?: number;
  require_reason_for_record_modification?: boolean;

  // Data Privacy
  patient_data_retention_years?: number;
  enable_data_anonymization?: boolean;
  hipaa_compliance_mode?: boolean;
}

export interface UpdateIntegrationSettingsRequest {
  // SMTP
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  smtp_password?: string | null; // Will be encrypted by backend
  smtp_use_tls?: boolean;

  // SMS
  sms_provider?: string | null;
  sms_api_key?: string | null; // Will be encrypted by backend
  sms_sender_id?: string | null;
  enable_sms_notifications?: boolean;

  // DHIS2
  dhis2_api_url?: string | null;
  dhis2_username?: string | null;
  dhis2_password?: string | null; // Will be encrypted by backend
  enable_dhis2_sync?: boolean;
  dhis2_org_unit_id?: string | null;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const settingsApi = {
  /**
   * Get public settings (accessible to all authenticated users)
   */
  getPublic: async (): Promise<PublicSettings> => {
    const response = await api.get<PublicSettings>('/api/v1/settings/public');
    return response.data;
  },

  /**
   * Get complete system settings (admin only)
   */
  get: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/api/v1/settings');
    return response.data;
  },

  /**
   * Update general settings (admin only)
   */
  update: async (data: UpdateSettingsRequest): Promise<SystemSettings> => {
    const response = await api.put<SystemSettings>('/api/v1/settings', data);
    return response.data;
  },

  /**
   * Update integration settings (admin only)
   */
  updateIntegration: async (data: UpdateIntegrationSettingsRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<{ success: boolean; message: string }>('/api/v1/settings/integration', data);
    return response.data;
  },

  /**
   * Mark system as configured (admin only)
   */
  markConfigured: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/api/v1/settings/configure', {});
    return response.data;
  },
};
