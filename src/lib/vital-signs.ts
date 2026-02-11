import api from './api';

export interface CreateVitalSignsRequest {
  patient_id: string;
  service_type?: string | null;
  service_record_id?: string | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  temperature?: number | null;
  pulse_rate?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  service_type?: string | null;
  service_record_id?: string | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  temperature?: number | null;
  pulse_rate?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}

export const vitalSignsApi = {
  create: async (data: CreateVitalSignsRequest): Promise<VitalSigns> => {
    const response = await api.post<VitalSigns>('/api/v1/vital-signs', data);
    return response.data;
  },
  getByPatient: async (patientId: string): Promise<VitalSigns[]> => {
    const response = await api.get<VitalSigns[]>(`/api/v1/vital-signs/patient/${patientId}`);
    return response.data;
  },
};

