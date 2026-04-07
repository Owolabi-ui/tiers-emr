import api from './api';

// ============================================
// ENUMS
// ============================================

export type HivTestMode = 'HIV-AB' | 'PCR';

export type CareEntryPoint =
  | 'ANC/PMTCT'
  | 'Index testing'
  | 'Inpatient'
  | 'OPD'
  | 'Others'
  | 'Outreach'
  | 'STI clinic'
  | 'TB-DOT'
  | 'Transferred in'
  | 'VCT';

export type PriorArtType =
  | 'PEP'
  | 'PMTCT only'
  | 'Transfer in with records'
  | 'Transfer in without records';

export type ArtStatus =
  | 'in_progress'  // Enrolled, waiting for first dispensing
  | 'Active'       // Actively on treatment with meds dispensed
  | 'On EAC'       // Missed follow-up/refill - Enhanced Adherence Counseling
  | 'Transferred Out'
  | 'Deceased'
  | 'LTFU';         // Lost to Follow-Up

// ============================================
// INTERFACES
// ============================================

export interface ArtInformation {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_hospital_no: string | null;

  // ART Client Information
  art_no: string;
  date_confirmed_hiv_positive: string;
  date_enrolled_into_hiv_care: string;
  mode_of_hiv_test: HivTestMode | null;
  entry_point: CareEntryPoint;
  where_test_was_done: string | null;
  prior_art: PriorArtType | null;

  // Next of Kin Information
  relationship_with_next_of_kin: string | null;
  name_of_next_of_kin: string | null;
  phone_no_of_next_of_kin: string | null;

  // Status tracking
  status: ArtStatus;
  next_appointment_date: string | null; // Expected date for next clinic visit/refill

  // Audit fields
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateArtInformationRequest {
  patient_id: string;

  // ART Client Information
  art_no: string;
  date_confirmed_hiv_positive: string;
  date_enrolled_into_hiv_care: string;
  mode_of_hiv_test?: HivTestMode;
  entry_point: CareEntryPoint;
  where_test_was_done?: string;
  prior_art?: PriorArtType;

  // Next of Kin Information
  relationship_with_next_of_kin?: string;
  name_of_next_of_kin?: string;
  phone_no_of_next_of_kin?: string;
}

export interface UpdateArtInformationRequest {
  art_no?: string;
  date_confirmed_hiv_positive?: string;
  date_enrolled_into_hiv_care?: string;
  mode_of_hiv_test?: HivTestMode;
  entry_point?: CareEntryPoint;
  where_test_was_done?: string;
  prior_art?: PriorArtType;
  relationship_with_next_of_kin?: string;
  name_of_next_of_kin?: string;
  phone_no_of_next_of_kin?: string;
  status?: ArtStatus;
}

export interface CompleteArtWorkflowResponse {
  art_information: ArtInformation;
}

export interface ArtListItem {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_hospital_no: string | null;
  art_no: string;
  date_enrolled_into_hiv_care: string;
  entry_point: CareEntryPoint;
  status: string;
  created_at: string;
}

export interface ArtFollowup {
  id: string;
  patient_id: string;
  art_information_id: string;
  visit_date: string;
  duration_months_on_art: number | null;
  functional_status: string | null;
  who_clinical_stage: string | null;
  tb_status: string | null;
  other_problems: string | null;
  cotrimoxazole_dose: string | null;
  inh_dose: string | null;
  other_drugs: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateArtFollowupRequest {
  patient_id: string;
  visit_date: string;
  duration_months?: number;
  weight_kg?: number;
  height_cm?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  functional_status?: string;
  who_clinical_stage?: string;
  tb_status?: string;
  other_problems?: string;
  arv_drug_id: number;
  cotrimoxazole_dose?: string;
  inh_dose?: string;
  other_drugs?: string;
  order_cd4: boolean;
  order_vl: boolean;
}

export interface CreateArtFollowupResponse {
  followup: ArtFollowup;
  prescription_id: string;
  prescription_number: string;
  lab_order_ids: string[];
}

// ============================================
// API FUNCTIONS
// ============================================

export const artApi = {
  /**
   * Get all ART records
   */
  async getAll(): Promise<ArtListItem[]> {
    const response = await api.get<ArtListItem[]>('/api/v1/art');
    return response.data;
  },

  /**
   * Get single ART record by ID
   */
  async getById(id: string): Promise<ArtInformation> {
    const response = await api.get<ArtInformation>(`/api/v1/art/${id}`);
    return response.data;
  },

  /**
   * Create new ART record
   */
  async create(data: CreateArtInformationRequest): Promise<ArtInformation> {
    const response = await api.post<ArtInformation>('/api/v1/art/information', data);
    return response.data;
  },

  /**
   * Update existing ART record
   */
  async update(id: string, data: UpdateArtInformationRequest): Promise<ArtInformation> {
    const response = await api.put<ArtInformation>(`/api/v1/art/${id}`, data);
    return response.data;
  },

  /**
   * Delete ART record
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/art/${id}`);
  },

  /**
   * Get active ART patients
   */
  async getActive(): Promise<ArtListItem[]> {
    const response = await api.get<ArtListItem[]>('/api/v1/art/active');
    return response.data;
  },

  /**
   * Get recently enrolled ART patients (last 30 days)
   */
  async getRecentEnrollments(): Promise<ArtListItem[]> {
    const response = await api.get<ArtListItem[]>('/api/v1/art/recent');
    return response.data;
  },

  async createFollowup(data: CreateArtFollowupRequest): Promise<CreateArtFollowupResponse> {
    const response = await api.post<CreateArtFollowupResponse>('/api/v1/art/followup', data);
    return response.data;
  },

  async getFollowups(patientId: string): Promise<ArtFollowup[]> {
    const response = await api.get<ArtFollowup[]>(`/api/v1/art/followup/patient/${patientId}`);
    return response.data;
  },
};
