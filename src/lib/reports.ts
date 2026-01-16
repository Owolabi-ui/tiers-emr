// Reports API Client
import { api } from './api';

export type ReportType = 
  | 'PEPFAR_MER'
  | 'CUSTOM'
  | 'FINANCIAL'
  | 'CLINICAL'
  | 'PHARMACY'
  | 'LABORATORY';

export type ReportStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ReportFormat = 
  | 'JSON'
  | 'CSV'
  | 'EXCEL'
  | 'PDF';

export interface GenerateReportRequest {
  title: string;
  description?: string;
  report_type: ReportType;
  report_format: ReportFormat;
  period_start: string;
  period_end: string;
  parameters?: Record<string, any>;
}

export interface SavedReport {
  id: string;
  title: string;
  description: string | null;
  report_type: ReportType;
  report_format: ReportFormat;
  parameters: Record<string, any>;
  status: ReportStatus;
  file_path: string | null;
  file_size: number | null;
  error_message: string | null;
  generated_by: string;
  period_start: string;
  period_end: string;
  created_at: string;
  completed_at: string | null;
}

export interface ReportListResponse {
  reports: SavedReport[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReportQueryParams {
  report_type?: ReportType;
  status?: ReportStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const reportsApi = {
  // Generate a new report
  async generate(data: GenerateReportRequest): Promise<SavedReport> {
    const response = await api.post('/api/v1/reports', data);
    return response.data;
  },

  // Get report by ID
  async getReport(id: string): Promise<SavedReport> {
    const response = await api.get(`/api/v1/reports/${id}`);
    return response.data;
  },

  // List reports with filters
  async list(params: ReportQueryParams = {}): Promise<ReportListResponse> {
    const response = await api.get('/api/v1/reports', { params });
    return response.data;
  },

  // Delete report
  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/reports/${id}`);
  },

  // Download report file
  async download(id: string): Promise<Blob> {
    const response = await api.get(`/api/v1/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
