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
  patient_name: string;
  patient_hospital_no: string;

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
  patient_name: string;
  patient_hospital_no: string;
  art_no: string;
  date_enrolled_into_hiv_care: string;
  entry_point: CareEntryPoint;
  status: string;
  created_at: string;
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
};
