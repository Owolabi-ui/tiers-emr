import { api } from './api';

export interface RowIssue {
  patient_ref: string;
  row: number;
  field: string;
  message: string;
}

export interface ValidationReport {
  total_rows: number;
  valid_count: number;
  error_count: number;
  warning_count: number;
  errors: RowIssue[];
  warnings: RowIssue[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: RowIssue[];
}

const toForm = (file: File): FormData => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const bulkUploadApi = {
  validate: async (file: File): Promise<ValidationReport> => {
    const res = await api.post<ValidationReport>(
      '/api/v1/bulk-upload/art/patients/validate',
      toForm(file),
      multipartConfig
    );
    return res.data;
  },

  confirm: async (file: File): Promise<ImportResult> => {
    const res = await api.post<ImportResult>(
      '/api/v1/bulk-upload/art/patients/confirm',
      toForm(file),
      multipartConfig
    );
    return res.data;
  },

  validateVisits: async (file: File): Promise<ValidationReport> => {
    const res = await api.post<ValidationReport>(
      '/api/v1/bulk-upload/art/visits/validate',
      toForm(file),
      multipartConfig
    );
    return res.data;
  },

  confirmVisits: async (file: File): Promise<ImportResult> => {
    const res = await api.post<ImportResult>(
      '/api/v1/bulk-upload/art/visits/confirm',
      toForm(file),
      multipartConfig
    );
    return res.data;
  },
};
