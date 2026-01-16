import api from './api';

// ============================================
// TYPES
// ============================================

export type TransferStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Completed' 
  | 'Cancelled';

export type TransferReason = 
  | 'Relocation' 
  | 'BetterServices' 
  | 'Closer' 
  | 'Referral' 
  | 'Other';

export interface Transfer {
  id: string;
  transfer_number: string;
  patient_id: string;
  from_clinic_id: string;
  to_clinic_id: string;
  transfer_date: string;
  reason: TransferReason;
  status: TransferStatus;
  medical_summary?: string;
  medications_list?: string;
  lab_results_summary?: string;
  continuity_of_care_notes?: string;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  completed_by?: string;
  completed_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface CreateTransferRequest {
  patient_id: string;
  from_clinic_id: string;
  to_clinic_id: string;
  transfer_date: string;
  reason: TransferReason;
  medical_summary?: string;
  medications_list?: string;
  lab_results_summary?: string;
  continuity_of_care_notes?: string;
}

export interface ApproveTransferRequest {
  notes?: string;
}

export interface RejectTransferRequest {
  rejection_reason: string;
}

export interface CompleteTransferRequest {
  notes?: string;
}

export interface CancelTransferRequest {
  cancellation_reason: string;
}

export interface TransferListResponse {
  transfers: Transfer[];
  total: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const transfersApi = {
  // Create a new transfer request
  create: async (data: CreateTransferRequest): Promise<Transfer> => {
    const response = await api.post<Transfer>('/api/v1/transfers', data);
    return response.data;
  },

  // Get a specific transfer by ID
  getById: async (id: string): Promise<Transfer> => {
    const response = await api.get<Transfer>(`/api/v1/transfers/${id}`);
    return response.data;
  },

  // Get all transfers for a patient
  getByPatient: async (patientId: string): Promise<TransferListResponse> => {
    const response = await api.get<TransferListResponse>(`/api/v1/patients/${patientId}/transfers`);
    return response.data;
  },

  // Get incoming transfers for a clinic (where clinic is destination)
  getIncoming: async (clinicId: string, status?: TransferStatus): Promise<TransferListResponse> => {
    const params = status ? { status } : {};
    const response = await api.get<TransferListResponse>(
      `/api/v1/clinics/${clinicId}/transfers/incoming`,
      { params }
    );
    return response.data;
  },

  // Get outgoing transfers for a clinic (where clinic is source)
  getOutgoing: async (clinicId: string, status?: TransferStatus): Promise<TransferListResponse> => {
    const params = status ? { status } : {};
    const response = await api.get<TransferListResponse>(
      `/api/v1/clinics/${clinicId}/transfers/outgoing`,
      { params }
    );
    return response.data;
  },

  // Approve a transfer
  approve: async (id: string, data: ApproveTransferRequest): Promise<Transfer> => {
    const response = await api.put<Transfer>(`/api/v1/transfers/${id}/approve`, data);
    return response.data;
  },

  // Reject a transfer
  reject: async (id: string, data: RejectTransferRequest): Promise<Transfer> => {
    const response = await api.put<Transfer>(`/api/v1/transfers/${id}/reject`, data);
    return response.data;
  },

  // Complete a transfer
  complete: async (id: string, data: CompleteTransferRequest): Promise<Transfer> => {
    const response = await api.put<Transfer>(`/api/v1/transfers/${id}/complete`, data);
    return response.data;
  },

  // Cancel a transfer
  cancel: async (id: string, data: CancelTransferRequest): Promise<Transfer> => {
    const response = await api.put<Transfer>(`/api/v1/transfers/${id}/cancel`, data);
    return response.data;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getTransferStatusColor = (status: TransferStatus): string => {
  const colors: Record<TransferStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getTransferReasonLabel = (reason: TransferReason): string => {
  const labels: Record<TransferReason, string> = {
    'Relocation': 'Patient Relocated',
    'BetterServices': 'Seeking Better Services',
    'Closer': 'Closer to Home',
    'Referral': 'Healthcare Referral',
    'Other': 'Other Reason',
  };
  return labels[reason] || reason;
};

export const transferReasonOptions: { value: TransferReason; label: string }[] = [
  { value: 'Relocation', label: 'Patient Relocated' },
  { value: 'BetterServices', label: 'Seeking Better Services' },
  { value: 'Closer', label: 'Closer to Home' },
  { value: 'Referral', label: 'Healthcare Referral' },
  { value: 'Other', label: 'Other Reason' },
];

export const transferStatusOptions: { value: TransferStatus; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];
