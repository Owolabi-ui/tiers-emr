// PrEP (Pre-Exposure Prophylaxis) API Client
import api from './api';
import type { HtsInitialResponse } from './hts';

// ============================================================================
// ENUMS
// ============================================================================

export type PrepType = 'ED PrEP' | 'Injectable / CAB-LA' | 'ORAL' | 'RING';

export type PrescriptionStatus = 'Pending' | 'Dispensed' | 'Cancelled';

export type FollowupStatus = 'Active' | 'Due Soon' | 'Overdue' | 'Completed';

// ============================================================================
// INTERFACES - PrEP Commencement
// ============================================================================

export interface PrepCommencement {
  id: string;
  hts_initial_id: string;
  date_initial_adherence_counseling: string; // YYYY-MM-DD
  date_prep_initiated: string | null;
  prep_type_at_start: PrepType | null;
  history_of_drug_allergies: boolean;
  allergy_details: string | null;
  transferred_in: boolean;
  previous_enrollment_id: string | null;
  transferred_from_facility: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreatePrepCommencementRequest {
  date_initial_adherence_counseling: string; // YYYY-MM-DD
  date_prep_initiated?: string | null;
  prep_type_at_start?: PrepType | null;
  history_of_drug_allergies: boolean;
  allergy_details?: string | null;
  transferred_in: boolean;
  previous_enrollment_id?: string | null;
  transferred_from_facility?: string | null;
}

// ============================================================================
// INTERFACES - PrEP Prescription
// ============================================================================

export interface PrepPrescription {
  id: string;
  prep_commencement_id: string;
  patient_id: string;
  date_prescribed: string; // YYYY-MM-DD
  prescribed_by: string;
  status: PrescriptionStatus;
  dispensed_at: string | null;
  dispensed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface PrepPrescriptionItem {
  id: string;
  prescription_id: string;
  drug_name: string;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  quantity: number | null;
  instructions: string | null;
  next_refill_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrepPrescriptionWithItems {
  prescription: PrepPrescription;
  items: PrepPrescriptionItem[];
}

export interface CreatePrepPrescriptionItemRequest {
  drug_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  quantity?: number | null;
  instructions?: string | null;
}

export interface CreatePrepPrescriptionRequest {
  patient_id: string;
  notes?: string | null;
  items: CreatePrepPrescriptionItemRequest[];
}

// ============================================================================
// INTERFACES - PrEP Follow-up
// ============================================================================

export interface PrepFollowup {
  id: string;
  prep_commencement_id: string;
  patient_id: string;
  prescription_id: string | null;
  date_prescribed: string | null;
  next_refill_date: string | null;
  days_until_refill: number | null;
  status: FollowupStatus;
  refill_completed: boolean;
  refill_completed_date: string | null;
  refill_completed_by: string | null;
  alert_sent_7_days: boolean;
  alert_sent_due_date: boolean;
  alert_sent_overdue: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreatePrepFollowupRequest {
  prep_commencement_id: string;
  patient_id: string;
  prescription_id?: string | null;
  date_prescribed?: string | null;
  next_refill_date?: string | null;
  notes?: string | null;
}

export interface UpdatePrepFollowupRequest {
  refill_completed: boolean;
  refill_completed_date?: string | null;
  notes?: string | null;
}

// ============================================================================
// INTERFACES - Complete Workflow
// ============================================================================

export interface CompletePrepWorkflowResponse {
  // Patient information
  patient_name?: string;
  patient_hospital_no?: string;
  
  // Shared HTS sections
  initial?: Record<string, unknown>;
  pre_test?: Record<string, unknown>;
  testing?: Record<string, unknown>;
  prep_eligibility?: Record<string, unknown>;
  post_test?: Record<string, unknown>;
  referral?: Record<string, unknown>;
  
  // PREP-specific sections
  prep_commencement: PrepCommencement | null;
  prep_prescription: PrepPrescriptionWithItems | null;
  prep_followup: PrepFollowup[] | null;
}

export interface PrepListItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_hospital_no: string;
  hts_initial_id: string;
  date_prep_initiated: string | null;
  prep_type_at_start: PrepType | null;
  status: string;
  next_refill_date: string | null;
  created_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const prepApi = {
  // ============================================================================
  // PrEP Commencement
  // ============================================================================
  
  /**
   * Get all PrEP enrollments
   */
  getAll: async (): Promise<PrepListItem[]> => {
    const response = await api.get('/api/v1/prep');
    return response.data;
  },

  /**
   * Get a specific PrEP enrollment by ID
   */
  getById: async (id: string): Promise<CompletePrepWorkflowResponse> => {
    const response = await api.get(`/api/v1/prep/${id}`);
    return response.data;
  },

  /**
   * Create PrEP commencement (requires HTS record)
   */
  createCommencement: async (
    htsInitialId: string,
    data: CreatePrepCommencementRequest
  ): Promise<PrepCommencement> => {
    const response = await api.post(`/api/v1/prep/${htsInitialId}/commencement`, data);
    return response.data;
  },

  /**
   * Update PrEP commencement
   */
  updateCommencement: async (
    id: string,
    data: Partial<CreatePrepCommencementRequest>
  ): Promise<PrepCommencement> => {
    const response = await api.put(`/api/v1/prep/${id}/commencement`, data);
    return response.data;
  },

  /**
   * Update PrEP commencement status (for IIT/LTFU tracking)
   */
  updateCommencementStatus: async (
    id: string,
    data: {
      status: string;
      reason: string;
      tracking_attempts?: number | null;
      tracking_notes?: string | null;
      transfer_to_facility?: string | null;
      effective_date: string;
    }
  ): Promise<PrepCommencement> => {
    const response = await api.put(`/api/v1/prep/commencement/${id}/status`, data);
    return response.data;
  },

  // ============================================================================
  // PrEP Prescription
  // ============================================================================

  /**
   * Create a new prescription for a PrEP patient
   */
  createPrescription: async (
    prepCommencementId: string,
    data: CreatePrepPrescriptionRequest
  ): Promise<PrepPrescriptionWithItems> => {
    const response = await api.post(`/api/v1/prep/${prepCommencementId}/prescription`, data);
    return response.data;
  },

  /**
   * Get all prescriptions for a PrEP patient
   */
  getPrescriptions: async (prepCommencementId: string): Promise<PrepPrescriptionWithItems[]> => {
    const response = await api.get(`/api/v1/prep/${prepCommencementId}/prescriptions`);
    return response.data;
  },

  /**
   * Mark prescription as dispensed
   */
  dispensePrescription: async (prescriptionId: string): Promise<PrepPrescription> => {
    const response = await api.post(`/api/v1/prep/prescription/${prescriptionId}/dispense`);
    return response.data;
  },

  // ============================================================================
  // PrEP Follow-up
  // ============================================================================

  /**
   * Get all follow-ups for a PrEP patient
   */
  getFollowups: async (prepCommencementId: string): Promise<PrepFollowup[]> => {
    const response = await api.get(`/api/v1/prep/${prepCommencementId}/followups`);
    return response.data;
  },

  /**
   * Create a new follow-up record
   */
  createFollowup: async (htsInitialId: string, data: CreatePrepFollowupRequest): Promise<PrepFollowup> => {
    const response = await api.post(`/api/v1/prep/${htsInitialId}/followup`, data);
    return response.data;
  },

  /**
   * Mark follow-up as completed
   */
  completeFollowup: async (
    followupId: string,
    data: UpdatePrepFollowupRequest
  ): Promise<PrepFollowup> => {
    const response = await api.put(`/api/v1/prep/followup/${followupId}`, data);
    return response.data;
  },

  /**
   * Get overdue follow-ups (for alerts/dashboard)
   */
  getOverdueFollowups: async (): Promise<PrepFollowup[]> => {
    const response = await api.get('/api/v1/prep/followups/overdue');
    return response.data;
  },

  // ============================================================================
  // HTS Integration
  // ============================================================================

  /**
   * Get all HTS records eligible for PrEP enrollment
   * (i.e., HTS records that don't have PrEP commencement yet)
   */
  getEligibleHtsRecords: async (): Promise<HtsInitialResponse[]> => {
    const response = await api.get<HtsInitialResponse[]>('/api/v1/prep/eligible-hts-records');
    return response.data;
  },
};
