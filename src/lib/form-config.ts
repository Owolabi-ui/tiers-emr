import { api } from './api';

export interface FieldConfig {
  required?: boolean;
  visible?: boolean;
  label?: string;
}

export interface FormConfigData {
  fields?: Record<string, FieldConfig>;
  options?: Record<string, string[]>;
}

export interface FormConfig {
  id: string;
  form_key: string;
  config: FormConfigData;
  updated_by?: string | null;
  updated_at: string;
  created_at: string;
}

export const formConfigApi = {
  getConfig: async (formKey: string): Promise<FormConfig> => {
    const response = await api.get<FormConfig>(`/api/v1/form-configs/${formKey}`);
    return response.data;
  },

  listAll: async (): Promise<FormConfig[]> => {
    const response = await api.get<FormConfig[]>('/api/v1/admin/form-configs');
    return response.data;
  },

  updateConfig: async (formKey: string, config: FormConfigData): Promise<FormConfig> => {
    const response = await api.put<FormConfig>(`/api/v1/admin/form-configs/${formKey}`, { config });
    return response.data;
  },
};
