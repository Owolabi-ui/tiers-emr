// PEP (Post-Exposure Prophylaxis) API Client
import api from './api';
import type { HtsInitialResponse } from './hts';

// ============================================================================
// ENUMS
// ============================================================================

export type ExposureMode = 'Non-occupational' | 'Occupational';

export type PepDuration = '<24hrs' | '<48hrs' | '<72hrs' | '>72hrs';

export type HivStatusAtExposure = 'Negative' | 'Positive';

export type SupporterRelationship = 'Caregiver' | 'Child' | 'Father' | 'Mother' | 'Sibling' | 'Other' | 'Guardian';

// ============================================================================
// INTERFACES - PEP Information
// ============================================================================

export interface PepInformation {
  id: string;
  hts_initial_id: string;
  pep_no: string;
  mode_of_exposure: ExposureMode;
  duration_before_pep: PepDuration;
  hiv_status_at_exposure: HivStatusAtExposure;
  pep_supporter: string | null;
  supporter_relationship: SupporterRelationship | null;
  supporter_telephone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface PepInformationWithPatient extends PepInformation {
  patient_id: string;
  patient_name: string;
  patient_hospital_no: string | null;
  next_refill_date: string | null;
}

export interface CreatePepInformationRequest {
  pep_no: string;
  mode_of_exposure: ExposureMode;
  duration_before_pep: PepDuration;
  hiv_status_at_exposure: HivStatusAtExposure;
  pep_supporter?: string | null;
  supporter_relationship?: SupporterRelationship | null;
  supporter_telephone?: string | null;
}

export interface UpdatePepInformationRequest {
  pep_no?: string;
  mode_of_exposure?: ExposureMode;
  duration_before_pep?: PepDuration;
  hiv_status_at_exposure?: HivStatusAtExposure;
  pep_supporter?: string | null;
  supporter_relationship?: SupporterRelationship | null;
  supporter_telephone?: string | null;
  status?: string;
}

// ============================================================================
// INTERFACES - PEP Commencement
// ============================================================================

export interface PepCommencement {
  id: string;
  hts_initial_id: string;
  pep_information_id: string;
  commencement_date: string;
  regimen: string;
  baseline_weight: number | null;
  baseline_cd4_count: number | null;
  baseline_viral_load: number | null;
  clinical_notes: string | null;
  side_effects_counseling: boolean;
  adherence_counseling: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreatePepCommencementRequest {
  commencement_date?: string;
  regimen: string;
  baseline_weight?: number | null;
  baseline_cd4_count?: number | null;
  baseline_viral_load?: number | null;
  clinical_notes?: string | null;
  side_effects_counseling: boolean;
  adherence_counseling: boolean;
}

// ============================================================================
// INTERFACES - PEP Follow-up
// ============================================================================

export type FollowupType = 'Week 2' | 'Week 4' | 'Month 3' | 'Unscheduled';
export type AdherenceLevel = 'Good' | 'Fair' | 'Poor';

export interface PepFollowup {
  id: string;
  hts_initial_id: string;
  pep_commencement_id: string;
  followup_date: string;
  followup_type: string;
  next_appointment_date: string | null;
  next_refill_date: string | null;
  weight: number | null;
  cd4_count: number | null;
  viral_load: number | null;
  adherence_level: string | null;
  missed_doses: number;
  side_effects: string | null;
  clinical_notes: string | null;
  iit_status: boolean;
  ltfu_status: boolean;
  prescription_id: string | null;
  prescription_notes: string | null;
  status: string;
  days_until_refill?: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreatePepFollowupRequest {
  pep_commencement_id: string;
  followup_date?: string;
  followup_type: FollowupType;
  next_appointment_date?: string | null;
  next_refill_date?: string | null;
  weight?: number | null;
  cd4_count?: number | null;
  viral_load?: number | null;
  adherence_level?: AdherenceLevel | null;
  missed_doses?: number;
  side_effects?: string | null;
  clinical_notes?: string | null;
  iit_status?: boolean;
  ltfu_status?: boolean;
  prescription_id?: string | null;
  prescription_notes?: string | null;
}

export interface UpdatePepFollowupRequest {
  followup_date?: string;
  followup_type?: FollowupType;
  next_appointment_date?: string | null;
  next_refill_date?: string | null;
  weight?: number | null;
  cd4_count?: number | null;
  viral_load?: number | null;
  adherence_level?: AdherenceLevel | null;
  missed_doses?: number;
  side_effects?: string | null;
  clinical_notes?: string | null;
  iit_status?: boolean;
  ltfu_status?: boolean;
  prescription_id?: string | null;
  prescription_notes?: string | null;
  status?: string;
}

// ============================================================================
// INTERFACES - Complete Workflow
// ============================================================================

export interface CompletePepWorkflowResponse {
  initial: HtsInitialResponse | null;
  pre_test: any | null;
  testing: any | null;
  post_test: any | null;
  referral: any | null;
  pep_information: PepInformation | null;
  commencement: PepCommencement | null;
  followups: PepFollowup[];
}

export interface PepListItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_hospital_no: string;
  hts_initial_id: string;
  pep_no: string;
  mode_of_exposure: ExposureMode;
  duration_before_pep: PepDuration;
  status: string;
  next_refill_date: string | null;
  created_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const pepApi = {
  /**
   * Get all PEP cases
   */
  getAll: async (): Promise<PepListItem[]> => {
    const response = await api.get('/api/v1/pep');
    return response.data;
  },

  /**
   * Get a specific PEP case by ID
   */
  getById: async (id: string): Promise<CompletePepWorkflowResponse> => {
    const response = await api.get(`/api/v1/pep/${id}`);
    return response.data;
  },

  /**
   * Create PEP information (requires HTS record)
   */
  create: async (
    htsInitialId: string,
    data: CreatePepInformationRequest
  ): Promise<PepInformation> => {
    const response = await api.post(`/api/v1/pep/${htsInitialId}/information`, data);
    return response.data;
  },

  /**
   * Update PEP information
   */
  update: async (
    id: string,
    data: UpdatePepInformationRequest
  ): Promise<PepInformation> => {
    const response = await api.put(`/api/v1/pep/${id}`, data);
    return response.data;
  },

  /**
   * Delete PEP information
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/pep/${id}`);
  },

  /**
   * Get all HTS records eligible for PEP enrollment
   * (i.e., HTS records that don't have PEP information yet)
   */
  getEligibleHtsRecords: async (): Promise<HtsInitialResponse[]> => {
    const response = await api.get<HtsInitialResponse[]>('/api/v1/pep/eligible-hts-records');
    return response.data;
  },

  /**
   * Get PEP cases requiring follow-up (time-sensitive)
   */
  getUrgentCases: async (): Promise<PepListItem[]> => {
    const response = await api.get('/api/v1/pep/urgent');
    return response.data;
  },

  // ============================================================================
  // COMMENCEMENT API
  // ============================================================================

  /**
   * Create PEP commencement
   */
  createCommencement: async (
    htsInitialId: string,
    data: CreatePepCommencementRequest
  ): Promise<PepCommencement> => {
    const response = await api.post(`/api/v1/pep/${htsInitialId}/commencement`, data);
    return response.data;
  },

  /**
   * Get PEP commencement
   */
  getCommencement: async (htsInitialId: string): Promise<PepCommencement> => {
    const response = await api.get(`/api/v1/pep/${htsInitialId}/commencement`);
    return response.data;
  },

  // ============================================================================
  // FOLLOW-UP API
  // ============================================================================

  /**
   * Create PEP follow-up
   */
  createFollowup: async (
    htsInitialId: string,
    data: CreatePepFollowupRequest
  ): Promise<PepFollowup> => {
    const response = await api.post(`/api/v1/pep/${htsInitialId}/followup`, data);
    return response.data;
  },

  /**
   * Get all follow-ups for a patient
   */
  getFollowups: async (htsInitialId: string): Promise<PepFollowup[]> => {
    const response = await api.get(`/api/v1/pep/${htsInitialId}/followups`);
    return response.data;
  },

  /**
   * Update a follow-up record
   */
  updateFollowup: async (
    followupId: string,
    data: UpdatePepFollowupRequest
  ): Promise<PepFollowup> => {
    const response = await api.put(`/api/v1/pep/followup/${followupId}`, data);
    return response.data;
  },
};
