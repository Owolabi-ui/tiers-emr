import { api } from './api';

// ============================================================================
// ENUMS
// ============================================================================

export type TargetGroupCode = 'MSM' | 'FSW' | 'PWID' | 'TG' | 'General Population' | 'Other';
export type HtsType = 'PITC' | 'Voluntary';
export type HtsSettings = 'CT' | 'FP' | 'OPD' | 'OTHERS' | 'OUTREACH' | 'STI' | 'STANDALONE HTS' | 'TB' | 'WARD';
export type TestingModality = 'ANC 1' | 'ACUTE CARE' | 'COMMUNITY TESTING/OUTREACH' | 'OPD' | 'OTHER PITC' | 'STI' | 'VCT' | 'TESTING THROUGH SOCIAL MEDIA';
export type SessionType = 'Couple' | 'Individual' | 'Previously tested';
export type ReferralSource = 'Friend' | 'KOL' | 'Other' | 'Social Media' | 'Self';
export type SexPartners = 'Male' | 'Female' | 'Both';
export type TestResult = 'Non-reactive' | 'Not done' | 'Reactive';
export type AdditionalTestResult = 'Positive' | 'Negative' | 'Not done';
export type PreviousHivTestStatus = 'Not previously tested' | 'Previously tested negative' | 'Previously tested positive in HIV care' | 'Previously tested positive not in HIV care';

// ============================================================================
// INTERFACES - HTS Initial
// ============================================================================

export interface CreateHtsInitialRequest {
  patient_id: string;
  date_of_visit: string; // YYYY-MM-DD
  client_code: string;
  target_group_code: TargetGroupCode;
  marital_status: string;
  type_of_hts: HtsType;
  settings: HtsSettings;
  testing_modality: TestingModality;
  type_of_session: SessionType;
  num_children_under_15: number;
  source_of_referral: ReferralSource;
  sex_partners: SexPartners;
  first_time_visit: boolean;
  educational_level: string;
  occupation: string;
}

// Type aliases for form components
export type HtsInitialRequest = CreateHtsInitialRequest;
export type HtsPreTestRequest = CreateHtsPreTestRequest;
export type HtsTestingRequest = CreateHtsTestingRequest;
export type HtsPrepEligibilityRequest = CreatePrepEligibilityRequest;
export type HtsPostTestRequest = CreateHtsPostTestRequest;
export type HtsReferralRequest = CreateHtsReferralRequest;

export interface HtsInitialResponse {
  id: string;
  patient_id: string;
  patient_name: string;
  date_of_visit: string;
  client_code: string;
  target_group_code: TargetGroupCode;
  marital_status: string;
  type_of_hts: HtsType;
  settings: HtsSettings;
  testing_modality: TestingModality;
  type_of_session: SessionType;
  num_children_under_15: number;
  source_of_referral: ReferralSource;
  sex_partners: SexPartners;
  first_time_visit: boolean;
  educational_level: string;
  occupation: string;
  status: string;
  has_lab_results: boolean;
  created_at: string;
}

// ============================================================================
// INTERFACES - HTS Pre-Test
// ============================================================================

export interface CreateHtsPreTestRequest {
  // Knowledge Assessment 1
  previously_tested_negative: boolean;
  informed_hiv_transmission: boolean;
  informed_risk_factors: boolean;
  informed_prevention_methods: boolean;
  informed_test_results: boolean;
  consent_given: boolean;
  used_drugs_sexual_performance: boolean;

  // Knowledge Assessment 2 (Transmission)
  transmission_sexual_intercourse: boolean;
  transmission_blood_transfusion: boolean;
  transmission_mother_to_child: boolean;
  transmission_sharing_toilet: boolean;
  transmission_sharp_objects: boolean;
  transmission_eating_utensils: boolean;
  transmission_mosquito_bites: boolean;
  transmission_kissing: boolean;
  transmission_hugging: boolean;

  // Knowledge Assessment 3 (Prevention)
  prevention_faithful_partner: boolean;
  prevention_condom_use: boolean;
  prevention_abstinence: boolean;
  prevention_delay_sexual_debut: boolean;
  prevention_reduce_partners: boolean;
  prevention_avoid_risky_partners: boolean;
  prevention_avoid_sharp_objects: boolean;
  prevention_healthy_looking_can_have_hiv: boolean;

  // HIV Risk Assessment
  risk_blood_transfusion: boolean;
  risk_unprotected_vaginal_sex: boolean;
  risk_unprotected_anal_sex: boolean;
  risk_sharing_needles: boolean;
  risk_sti: boolean;
  risk_multiple_partners: boolean;
  risk_sex_under_influence: boolean;
  risk_anal_sex: boolean;
  risk_vaginal_sex: boolean;
  risk_paid_for_sex: boolean;
  risk_been_paid_for_sex: boolean;
  risk_condom_breakage: boolean;
  risk_sexual_orgy: boolean;

  // Drug Use
  drug_use: string[];
  drug_route: string[];

  // Partner Risk Assessment
  partner_newly_diagnosed_on_treatment: boolean;
  partner_on_arv_suppressed_vl: boolean;
  partner_pregnant_on_arv: boolean;
  partner_returned_after_ltfu: boolean;
  partner_adolescent_hiv_positive: boolean;
  partner_hiv_positive: boolean;
  partner_injects_drugs: boolean;
  partner_has_sex_with_men: boolean;
  partner_transgender: boolean;

  // STI Screening
  sti_urethral_discharge: boolean;
  sti_scrotal_swelling: boolean;
  sti_genital_sore: boolean;
  sti_anal_pain: boolean;
  sti_anal_discharge: boolean;
  sti_anal_itching: boolean;

  // GBV
  experiencing_violence: boolean;

  // Calculated Risk Scores
  hiv_risk_score?: number;
  partner_risk_score?: number;
}

// ============================================================================
// INTERFACES - HTS Testing
// ============================================================================

export interface CreateHtsTestingRequest {
  screening_test_result: TestResult;
  screening_test_date: string; // YYYY-MM-DD
  confirmatory_test_result?: TestResult | null;
  confirmatory_test_date?: string | null;
  final_result: TestResult;
}

// ============================================================================
// INTERFACES - PrEP Eligibility
// ============================================================================

export interface CreatePrepEligibilityRequest {
  hiv_negative: boolean;
  no_acute_hiv_symptoms: boolean;
  no_indication_for_pep: boolean;
  no_proteinuria: boolean;
  no_drug_interaction: boolean;
  prep_offered: boolean;
}

// ============================================================================
// INTERFACES - HTS Post-Test
// ============================================================================

export interface CreateHtsPostTestRequest {
  previous_hiv_test_status: PreviousHivTestStatus;
  result_form_signed: boolean;
  result_form_filled: boolean;
  client_received_result: boolean;
  partner_uses_fp_method: boolean;
  partner_uses_condom: boolean;
  post_test_counseling_done: boolean;
  client_referred_to_services: boolean;
  risk_reduction_plan_developed: boolean;
  disclosure_plan_developed: boolean;
  will_bring_partners: boolean;
  will_bring_children: boolean;
  provided_fp_info: boolean;
  condom_use_demonstrated: boolean;
  condoms_provided: boolean;
  syphilis_test_result?: AdditionalTestResult;
  hepatitis_b_test_result?: AdditionalTestResult;
  hepatitis_c_test_result?: AdditionalTestResult;
  comments?: string | null;
}

// ============================================================================
// INTERFACES - HTS Referral
// ============================================================================

export interface CreateHtsReferralRequest {
  referring_org_unit: string;
  referring_org_name: string;
  referring_org_address: string;
  referring_org_phone: string;
  referring_org_contact_person: string;
  referred_org_unit: string;
  referred_org_name: string;
  referred_org_address: string;
  referred_org_phone: string;
  referred_org_contact_person: string;
  referral_services: string[];
  comments?: string | null;
}

// ============================================================================
// COMPLETE WORKFLOW RESPONSE
// ============================================================================

export interface CompleteHtsWorkflow {
  hts_initial: HtsInitialResponse;
  hts_pre_test: any | null;
  hts_testing: any | null;
  prep_eligibility: any | null;
  hts_post_test: any | null;
  hts_referral: any | null;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const htsApi = {
  // Get All HTS Records
  getAll: async (): Promise<HtsInitialResponse[]> => {
    const response = await api.get<HtsInitialResponse[]>('/api/v1/hts');
    return response.data;
  },

  // Create HTS Initial (Step 1)
  createInitial: async (data: CreateHtsInitialRequest): Promise<HtsInitialResponse> => {
    const response = await api.post<HtsInitialResponse>('/api/v1/hts/section', data);
    return response.data;
  },

  // Get Complete HTS Workflow
  getComplete: async (htsId: string): Promise<CompleteHtsWorkflow> => {
    const response = await api.get<CompleteHtsWorkflow>(`/api/v1/hts/${htsId}`);
    return response.data;
  },

  // Create HTS Pre-Test (Step 2)
  createPreTest: async (htsId: string, data: CreateHtsPreTestRequest): Promise<any> => {
    const response = await api.post(`/api/v1/hts/${htsId}/pre-test`, data);
    return response.data;
  },

  // Create HTS Testing (Step 3)
  createTesting: async (htsId: string, data: CreateHtsTestingRequest): Promise<any> => {
    const response = await api.post(`/api/v1/hts/${htsId}/testing`, data);
    return response.data;
  },

  // Create PrEP Eligibility (Step 4)
  createPrepEligibility: async (htsId: string, data: CreatePrepEligibilityRequest): Promise<any> => {
    const response = await api.post(`/api/v1/hts/${htsId}/prep-eligibility`, data);
    return response.data;
  },

  // Create HTS Post-Test (Step 5)
  createPostTest: async (htsId: string, data: CreateHtsPostTestRequest): Promise<any> => {
    const response = await api.post(`/api/v1/hts/${htsId}/post-test`, data);
    return response.data;
  },

  // Create HTS Referral (Step 6)
  createReferral: async (htsId: string, data: CreateHtsReferralRequest): Promise<any> => {
    const response = await api.post(`/api/v1/hts/${htsId}/referral`, data);
    return response.data;
  },

  // Get Patient HTS Records
  getByPatient: async (patientId: string): Promise<HtsInitialResponse[]> => {
    const response = await api.get<HtsInitialResponse[]>(`/api/v1/hts/patient/${patientId}`);
    return response.data;
  },

  // Get HTS Statistics
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/api/v1/hts/statistics');
    return response.data;
  },
};

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

export const TARGET_GROUP_CODES: TargetGroupCode[] = ['MSM', 'FSW', 'PWID', 'TG', 'General Population', 'Other'];
export const HTS_TYPES: HtsType[] = ['PITC', 'Voluntary'];
export const HTS_SETTINGS: HtsSettings[] = ['CT', 'FP', 'OPD', 'OTHERS', 'OUTREACH', 'STI', 'STANDALONE HTS', 'TB', 'WARD'];
export const TESTING_MODALITIES: TestingModality[] = ['ANC 1', 'ACUTE CARE', 'COMMUNITY TESTING/OUTREACH', 'OPD', 'OTHER PITC', 'STI', 'VCT', 'TESTING THROUGH SOCIAL MEDIA'];
export const SESSION_TYPES: SessionType[] = ['Couple', 'Individual', 'Previously tested'];
export const REFERRAL_SOURCES: ReferralSource[] = ['Friend', 'KOL', 'Other', 'Social Media', 'Self'];
export const SEX_PARTNERS: SexPartners[] = ['Male', 'Female', 'Both'];
export const TEST_RESULTS: TestResult[] = ['Non-reactive', 'Not done', 'Reactive'];
export const ADDITIONAL_TEST_RESULTS: AdditionalTestResult[] = ['Positive', 'Negative', 'Not done'];
export const PREVIOUS_HIV_TEST_STATUSES: PreviousHivTestStatus[] = [
  'Not previously tested',
  'Previously tested negative',
  'Previously tested positive in HIV care',
  'Previously tested positive not in HIV care',
];

// Deprecated aliases for backwards compatibility
export const targetGroupOptions = TARGET_GROUP_CODES;
export const htsTypeOptions = HTS_TYPES;
export const htsSettingsOptions = HTS_SETTINGS;
export const testingModalityOptions = TESTING_MODALITIES;
export const sessionTypeOptions = SESSION_TYPES;
export const referralSourceOptions = REFERRAL_SOURCES;
export const sexPartnersOptions = SEX_PARTNERS;
export const testResultOptions = TEST_RESULTS;
export const additionalTestResultOptions = ADDITIONAL_TEST_RESULTS;
export const previousHivTestStatusOptions = PREVIOUS_HIV_TEST_STATUSES;
