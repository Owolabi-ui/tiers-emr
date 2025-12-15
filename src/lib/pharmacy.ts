// Pharmacy API Client
// TypeScript interfaces and API functions for pharmacy module

import { api } from './api';

// ============================================================================
// ENUMS
// ============================================================================

export type PrescriptionStatus =
  | 'Pending'
  | 'Dispensed'
  | 'Partially Dispensed'
  | 'Cancelled'
  | 'Expired';

export type Frequency =
  | 'Once Daily'
  | 'Twice Daily'
  | 'Three Times Daily'
  | 'Four Times Daily'
  | 'Every 4 Hours'
  | 'Every 6 Hours'
  | 'Every 8 Hours'
  | 'Every 12 Hours'
  | 'As Needed'
  | 'Weekly'
  | 'Monthly';

// ============================================================================
// INTERFACES - DRUGS
// ============================================================================

export interface DrugCatalog {
  id: number;
  commodity_name: string;
  commodity_id: string;
  pack_type: string;
  pack_type_id: string;
  commodity_type: string;
  quantity: number | null;
  batch_no: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DrugInfo {
  id: number;
  commodity_name: string;
  commodity_id: string;
  pack_type: string;
  commodity_type: string;
  current_stock: number | null;
}

export interface CreateDrugRequest {
  commodity_name: string;
  commodity_id: string;
  pack_type: string;
  pack_type_id: string;
  commodity_type: string;
  quantity?: number;
  batch_no?: string;
  expiry_month?: number;
  expiry_year?: number;
}

export interface UpdateDrugRequest {
  commodity_name?: string;
  pack_type?: string;
  pack_type_id?: string;
  commodity_type?: string;
  quantity?: number;
  batch_no?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_active?: boolean;
}

export interface ReceiveDrugStockRequest {
  commodity_id: string;
  commodity_name: string;
  pack_type: string;
  pack_type_id: string;
  commodity_type: string;
  quantity: number;
  batch_no?: string;
  expiry_month?: number;
  expiry_year?: number;
  reference_no?: string;
  notes?: string;
}

export interface DrugListResponse {
  drugs: DrugCatalog[];
  total: number;
}

export interface StockAlert {
  drug_id: number;
  commodity_id: string;
  commodity_name: string;
  current_stock: number;
  alert_type: string;
}

// ============================================================================
// INTERFACES - PRESCRIPTIONS
// ============================================================================

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  drug_info: DrugInfo;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage: string;
  frequency: Frequency;
  duration_days: number;
  instructions: string | null;
  is_dispensed: boolean;
  dispensed_at: string | null;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string | null;
  prescribed_by: string;
  prescribed_by_name: string | null;
  prescribed_at: string;
  status: PrescriptionStatus;
  diagnosis: string | null;
  clinical_notes: string | null;
  items: PrescriptionItem[];
  dispensed_by: string | null;
  dispensed_at: string | null;
  created_at: string;
}

export interface CreatePrescriptionItemRequest {
  drug_id: number;
  quantity_prescribed: number;
  dosage: string;
  frequency: Frequency;
  duration_days: number;
  instructions?: string;
}

export interface CreatePrescriptionRequest {
  patient_id: string;
  diagnosis?: string;
  clinical_notes?: string;
  items: CreatePrescriptionItemRequest[];
}

export interface PrescriptionListResponse {
  data: Prescription[];
  total: number;
  page: number;
  per_page: number;
}

export interface DispenseMedicationRequest {
  prescription_item_id: string;
  quantity_dispensed: number;
  batch_no?: string;
  notes?: string;
}

export interface DispensePrescriptionRequest {
  items: DispenseMedicationRequest[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getPrescriptionStatusColor = (status: PrescriptionStatus): string => {
  const colors: Record<PrescriptionStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Partially Dispensed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Dispensed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    Expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatPrescriptionNumber = (number: string): string => {
  return number.toUpperCase();
};

export const isStockLow = (current: number | null, threshold: number = 10): boolean => {
  return current !== null && current <= threshold && current > 0;
};

export const isOutOfStock = (current: number | null): boolean => {
  return current === null || current <= 0;
};

export const isExpired = (expiryMonth: number | null, expiryYear: number | null): boolean => {
  if (!expiryMonth || !expiryYear) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (expiryYear < currentYear) return true;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return true;
  return false;
};

export const isExpiringSoon = (expiryMonth: number | null, expiryYear: number | null, monthsAhead: number = 3): boolean => {
  if (!expiryMonth || !expiryYear) return false;
  const now = new Date();
  const expiryDate = new Date(expiryYear, expiryMonth - 1);
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() + monthsAhead);
  
  return expiryDate <= thresholdDate && expiryDate > now;
};

export const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: 'Once Daily', label: 'Once Daily (OD)' },
  { value: 'Twice Daily', label: 'Twice Daily (BD)' },
  { value: 'Three Times Daily', label: 'Three Times Daily (TDS)' },
  { value: 'Four Times Daily', label: 'Four Times Daily (QDS)' },
  { value: 'Every 4 Hours', label: 'Every 4 Hours (Q4H)' },
  { value: 'Every 6 Hours', label: 'Every 6 Hours (Q6H)' },
  { value: 'Every 8 Hours', label: 'Every 8 Hours (Q8H)' },
  { value: 'Every 12 Hours', label: 'Every 12 Hours (Q12H)' },
  { value: 'As Needed', label: 'As Needed (PRN)' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
];

export const prescriptionStatusOptions: { value: PrescriptionStatus; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Partially Dispensed', label: 'Partially Dispensed' },
  { value: 'Dispensed', label: 'Dispensed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Expired', label: 'Expired' },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const pharmacyApi = {
  // Drug Catalog
  getDrugs: async (params?: { commodity_type?: string; active_only?: boolean }): Promise<DrugListResponse> => {
    const response = await api.get<DrugListResponse>('/api/v1/pharmacy/drugs', { params });
    return response.data;
  },

  getDrug: async (drugId: number): Promise<DrugCatalog> => {
    const response = await api.get<DrugCatalog>(`/api/v1/pharmacy/drugs/${drugId}`);
    return response.data;
  },

  createDrug: async (data: CreateDrugRequest): Promise<DrugCatalog> => {
    const response = await api.post<DrugCatalog>('/api/v1/pharmacy/drugs', data);
    return response.data;
  },

  updateDrug: async (drugId: number, data: UpdateDrugRequest): Promise<DrugCatalog> => {
    const response = await api.put<DrugCatalog>(`/api/v1/pharmacy/drugs/${drugId}`, data);
    return response.data;
  },

  receiveStock: async (data: ReceiveDrugStockRequest): Promise<DrugCatalog> => {
    const response = await api.post<DrugCatalog>('/api/v1/pharmacy/drugs/receive-stock', data);
    return response.data;
  },

  getStockAlerts: async (): Promise<{ alerts: StockAlert[]; total: number }> => {
    const response = await api.get<{ alerts: StockAlert[]; total: number }>('/api/v1/pharmacy/stock-alerts');
    return response.data;
  },

  // Prescriptions
  createPrescription: async (data: CreatePrescriptionRequest): Promise<Prescription> => {
    const response = await api.post<Prescription>('/api/v1/pharmacy/prescriptions', data);
    return response.data;
  },

  getPrescription: async (prescriptionId: string): Promise<Prescription> => {
    const response = await api.get<Prescription>(`/api/v1/pharmacy/prescriptions/${prescriptionId}`);
    return response.data;
  },

  listPrescriptions: async (params?: {
    status?: PrescriptionStatus;
    patient_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<PrescriptionListResponse> => {
    const response = await api.get<PrescriptionListResponse>('/api/v1/pharmacy/prescriptions', { params });
    return response.data;
  },

  // Dispensing
  dispensePrescription: async (
    prescriptionId: string,
    data: DispensePrescriptionRequest
  ): Promise<Prescription> => {
    const response = await api.put<Prescription>(
      `/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`,
      data
    );
    return response.data;
  },
};
