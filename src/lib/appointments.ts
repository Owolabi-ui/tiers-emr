import { api } from './api';

// ============================================================================
// ENUMS (matching backend)
// ============================================================================

export type AppointmentType =
  | 'Refill'
  | 'Follow-up'
  | 'Lab Review'
  | 'Clinical Review'
  | 'Counseling'
  | 'New Patient'
  | 'Emergency'
  | 'Other';

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked-in'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'No Show'
  | 'Rescheduled';

export type NotificationType = 'Email' | 'SMS' | 'Web' | 'System';

export type NotificationStatus = 'Pending' | 'Sent' | 'Delivered' | 'Failed' | 'Read';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_number: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string | null; // HH:MM:SS

  // Source tracking
  auto_generated: boolean;
  source_type: string | null;
  source_id: string | null;

  // Service context
  service_type: string | null;
  service_record_id: string | null;

  // Clinical notes
  reason: string | null;
  notes: string | null;
  clinical_summary: string | null;

  // Staff assignment
  assigned_to: string | null;
  assigned_at: string | null;

  // Check-in tracking
  checked_in_at: string | null;
  checked_in_by: string | null;

  // Visit completion
  completed_at: string | null;
  completed_by: string | null;

  // Cancellation/Rescheduling
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  rescheduled_from: string | null;
  rescheduled_to: string | null;

  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AppointmentResponse {
  id: string;
  patient_id: string;
  appointment_number: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  appointment_date: string;
  appointment_time: string | null;
  auto_generated: boolean;
  source_type: string | null;
  service_type: string | null;
  reason: string | null;
  notes: string | null;
  clinical_summary: string | null;
  assigned_to: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface AppointmentListResponse {
  appointments: AppointmentResponse[];
  total: number;
}

export interface AppointmentNotification {
  id: string;
  appointment_id: string;
  patient_id: string;
  notification_type: NotificationType;
  recipient_type: string;
  recipient_id: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  message_body: string;
  status: NotificationStatus;
  scheduled_send_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_reason: string | null;
  retry_count: number;
  last_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentVisitDetails {
  id: string;
  appointment_id: string;
  patient_id: string;
  chief_complaint: string | null;
  vital_signs_id: string | null;
  assessment: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  lab_tests_ordered: boolean;
  drugs_prescribed: boolean;
  counseling_provided: boolean;
  referral_made: boolean;
  next_appointment_date: string | null;
  next_appointment_reason: string | null;
  clinician_id: string | null;
  nurse_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentDetailsResponse {
  appointment: AppointmentResponse;
  visit_details: AppointmentVisitDetails | null;
  notifications: AppointmentNotification[];
}

export interface PendingNotificationsResponse {
  notifications: AppointmentNotification[];
  total: number;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

const formatServiceTypeValue = (value: string): string => {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'PREP') return 'PrEP';
  if (normalized === 'PEP') return 'PEP';
  if (normalized === 'ART') return 'ART';
  if (normalized === 'HTS') return 'HTS';
  if (normalized === 'PHARMACY' || normalized === 'PRESCRIPTION') return 'Pharmacy';
  if (normalized === 'LAB' || normalized === 'LABORATORY') return 'Laboratory';
  if (normalized === 'MENTAL HEALTH' || normalized === 'PSYCHOLOGY') return 'Psychology';
  return value;
};

export function getAppointmentServiceLabel(appointment: Pick<AppointmentResponse, 'service_type' | 'source_type' | 'reason'>): string {
  if (appointment.service_type) {
    return formatServiceTypeValue(appointment.service_type);
  }

  if (appointment.source_type) {
    return formatServiceTypeValue(appointment.source_type);
  }

  if (appointment.reason?.toLowerCase().includes('refill')) {
    return 'Pharmacy';
  }

  return '-';
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface CreateAppointmentRequest {
  patient_id: string;
  appointment_type: AppointmentType;
  appointment_date: string; // YYYY-MM-DD
  appointment_time?: string | null; // HH:MM:SS

  // Optional source tracking
  auto_generated?: boolean;
  source_type?: string | null;
  source_id?: string | null;

  // Optional service context
  service_type?: string | null;
  service_record_id?: string | null;

  reason?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
}

export interface UpdateAppointmentRequest {
  appointment_type?: AppointmentType;
  appointment_date?: string;
  appointment_time?: string | null;
  reason?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
}

export interface CheckInRequest {
  notes?: string | null;
}

export interface CompleteAppointmentRequest {
  clinical_summary: string;
  visit_details?: CreateVisitDetailsRequest;
}

export interface CreateVisitDetailsRequest {
  chief_complaint?: string | null;
  vital_signs_id?: string | null;
  assessment?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  lab_tests_ordered?: boolean;
  drugs_prescribed?: boolean;
  counseling_provided?: boolean;
  referral_made?: boolean;
  next_appointment_date?: string | null;
  next_appointment_reason?: string | null;
  clinician_id?: string | null;
}

export interface CancelAppointmentRequest {
  cancellation_reason: string;
}

export interface RescheduleAppointmentRequest {
  new_appointment_date: string;
  new_appointment_time?: string | null;
  reason: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const appointmentsApi = {
  // Create appointment
  create: async (data: CreateAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.post<AppointmentResponse>('/api/v1/appointments', data);
    return response.data;
  },

  // Get appointment by ID
  getById: async (id: string): Promise<AppointmentDetailsResponse> => {
    const response = await api.get<AppointmentDetailsResponse>(`/api/v1/appointments/${id}`);
    return response.data;
  },

  // Update appointment
  update: async (id: string, data: UpdateAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}`, data);
    return response.data;
  },

  // Check-in appointment
  checkIn: async (id: string, data: CheckInRequest = {}): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/check-in`, data);
    return response.data;
  },

  // Start appointment
  start: async (id: string): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/start`);
    return response.data;
  },

  // Complete appointment
  complete: async (id: string, data: CompleteAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/complete`, data);
    return response.data;
  },

  // Cancel appointment
  cancel: async (id: string, data: CancelAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/cancel`, data);
    return response.data;
  },

  // Reschedule appointment
  reschedule: async (id: string, data: RescheduleAppointmentRequest): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Mark as no show
  markNoShow: async (id: string): Promise<AppointmentResponse> => {
    const response = await api.put<AppointmentResponse>(`/api/v1/appointments/${id}/no-show`);
    return response.data;
  },

  // Get patient appointments
  getByPatient: async (
    patientId: string,
    status?: AppointmentStatus
  ): Promise<AppointmentListResponse> => {
    const response = await api.get<AppointmentListResponse>(
      `/api/v1/appointments/patient/${patientId}`,
      { params: status ? { status } : undefined }
    );
    return response.data;
  },

  // Get all appointments
  getAll: async (): Promise<AppointmentListResponse> => {
    const response = await api.get<AppointmentListResponse>('/api/v1/appointments');
    return response.data;
  },

  // Get appointments by date
  getByDate: async (date: string): Promise<AppointmentListResponse> => {
    const response = await api.get<AppointmentListResponse>(`/api/v1/appointments/date/${date}`);
    return response.data;
  },

  // Get pending notifications
  getPendingNotifications: async (): Promise<PendingNotificationsResponse> => {
    const response = await api.get<PendingNotificationsResponse>(
      '/api/v1/appointments/notifications/pending'
    );
    return response.data;
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const appointmentTypeOptions: AppointmentType[] = [
  'Refill',
  'Follow-up',
  'Lab Review',
  'Clinical Review',
  'Counseling',
  'New Patient',
  'Emergency',
  'Other',
];

export const appointmentStatusOptions: AppointmentStatus[] = [
  'Scheduled',
  'Confirmed',
  'Checked-in',
  'In Progress',
  'Completed',
  'Cancelled',
  'No Show',
  'Rescheduled',
];

export const statusColors: Record<AppointmentStatus, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Checked-in': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'No Show': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  Rescheduled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const appointmentTypeColors: Record<AppointmentType, string> = {
  Refill: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Follow-up': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Lab Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Clinical Review': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Counseling: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'New Patient': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function formatTime(timeString: string | null): string {
  if (!timeString) return '-';
  try {
    // timeString is in HH:MM:SS format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

export function formatAppointmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isAppointmentToday(dateString: string): boolean {
  const today = new Date();
  const appointmentDate = new Date(dateString);
  return (
    today.getFullYear() === appointmentDate.getFullYear() &&
    today.getMonth() === appointmentDate.getMonth() &&
    today.getDate() === appointmentDate.getDate()
  );
}

export function isAppointmentPast(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(dateString);
  return appointmentDate < today;
}

export function getAppointmentDateLabel(dateString: string): string {
  const today = new Date();
  const appointmentDate = new Date(dateString);
  const diffDays = Math.ceil(
    (appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatAppointmentDate(dateString);
}
