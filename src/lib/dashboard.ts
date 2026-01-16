import { api } from './api';

export interface DashboardStats {
  totalPatients: number;
  activeART: number;
  activePrEP: number;
  todayAppointments: number;
  pendingLabResults: number;
  newPatientsThisMonth: number;
  missedAppointmentsThisWeek: number;
}

export interface PatientTrendData {
  month: string;
  total: number;
  new: number;
  art: number;
  prep: number;
}

export interface AppointmentStats {
  date: string;
  scheduled: number;
  completed: number;
  missed: number;
  cancelled: number;
}

export interface ServiceDistribution {
  service: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'appointment' | 'lab' | 'patient' | 'prescription' | 'transfer';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface UpcomingAppointment {
  id: string;
  patient_name: string;
  patient_id: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  assigned_to?: string;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/v1/dashboard/stats');
    return response.data;
  },

  async getPatientTrends(months: number = 6): Promise<PatientTrendData[]> {
    const response = await api.get(`/api/v1/dashboard/patient-trends?months=${months}`);
    return response.data;
  },

  async getAppointmentStats(days: number = 30): Promise<AppointmentStats[]> {
    const response = await api.get(`/api/v1/dashboard/appointment-stats?days=${days}`);
    return response.data;
  },

  async getServiceDistribution(): Promise<ServiceDistribution[]> {
    const response = await api.get('/api/v1/dashboard/service-distribution');
    return response.data;
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await api.get(`/api/v1/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  },

  async getTodayAppointments(): Promise<UpcomingAppointment[]> {
    const response = await api.get('/api/v1/dashboard/today-appointments');
    return response.data;
  },
};
