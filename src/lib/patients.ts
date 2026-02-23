import { api } from './api';

// ============================================================================
// ENUMS (matching backend)
// ============================================================================

export type SexType = 'Male' | 'Female' | 'Intersex';

export type GenderIdentity =
  | 'Man'
  | 'Woman'
  | 'Non-binary'
  | 'Transgender Man'
  | 'Transgender Woman'
  | 'Genderqueer'
  | 'Genderfluid'
  | 'Agender'
  | 'Prefer not to say'
  | 'Other';

export type MaritalStatus =
  | 'Single'
  | 'Married'
  | 'Divorced'
  | 'Widowed'
  | 'Separated'
  | 'Cohabitating'
  | 'Prefer not to say';

export type EducationalLevel =
  | 'None'
  | 'Primary'
  | 'Secondary'
  | 'SSCE'
  | 'Tertiary Institution'
  | 'Vocational'
  | 'Postgraduate';

export type OccupationType =
  | 'Student'
  | 'Self-employed'
  | 'Employed'
  | 'Unemployed'
  | 'Retired'
  | 'Other';

export type ServiceType = 'PREP' | 'PEP' | 'ART' | 'Mental Health';

// ============================================================================
// REFERENCE DATA
// ============================================================================

export interface NigerianState {
  id: number;
  name: string;
  code: string;
  created_at: string;
}

export interface NigerianLga {
  id: number;
  state_id: number;
  name: string;
  created_at: string;
}

// ============================================================================
// PATIENT INTERFACES
// ============================================================================

export interface Patient {
  id: string;
  hospital_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  sex: SexType;
  gender: GenderIdentity | null;
  date_of_birth: string;
  age: number | null;
  phone_number: string | null;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  state_id: number | null;
  lga_id: number | null;
  city: string | null;
  postal_code: string | null;
  marital_status: MaritalStatus | null;
  educational_level: EducationalLevel | null;
  occupation: OccupationType | null;
  occupation_details: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  current_clinic_id: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface PatientListResponse {
  data: Patient[];
  patients?: Patient[]; // Alias for backwards compatibility
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PatientDetails {
  patient: Patient;
  services: ServiceType[];
  biometrics: PatientBiometric[];
}

export interface PatientBiometric {
  id: string;
  patient_id: string;
  biometric_type: string;
  is_active: boolean;
  last_verified_at: string | null;
  verification_count: number;
  enrolled_at: string;
}

export interface PatientStatistics {
  total_patients: number;
  active_patients: number;
  new_this_month: number;
  by_sex: { Male: number; Female: number; Intersex: number };
  by_service: Record<string, number>;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface CreatePatientRequest {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  preferred_name?: string | null;
  sex: SexType;
  gender?: GenderIdentity | null;
  date_of_birth: string; // YYYY-MM-DD format
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  state_id?: number | null;
  lga_id?: number | null;
  city?: string | null;
  marital_status?: MaritalStatus | null;
  educational_level?: EducationalLevel | null;
  occupation?: OccupationType | null;
  occupation_specify?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  service_types?: ServiceType[] | null;
}

export interface UpdatePatientRequest {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  gender?: GenderIdentity | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  state_id?: number | null;
  lga_id?: number | null;
  city?: string | null;
  marital_status?: MaritalStatus | null;
  educational_level?: EducationalLevel | null;
  occupation?: OccupationType | null;
  occupation_specify?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
}

export interface PatientSearchParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  first_name?: string;
  last_name?: string;
  hospital_no?: string;
  sex?: SexType;
  service_type?: ServiceType;
  is_active?: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const patientsApi = {
  // List patients with pagination
  list: async (page = 1, perPage = 20): Promise<PatientListResponse> => {
    const response = await api.get<PatientListResponse>('/api/v1/patients', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  // Search patients with filters
  search: async (params: PatientSearchParams): Promise<PatientListResponse> => {
    const response = await api.get<PatientListResponse>('/api/v1/patients/search', {
      params,
    });
    return response.data;
  },

  // Get patient by ID
  getById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/api/v1/patients/${id}`);
    return response.data;
  },

  // Get patient by hospital number
  getByHospitalNo: async (hospitalNo: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/api/v1/patients/hospital/${hospitalNo}`);
    return response.data;
  },

  // Get patient details (with services and biometrics)
  getDetails: async (id: string): Promise<PatientDetails> => {
    const response = await api.get<PatientDetails>(`/api/v1/patients/${id}/details`);
    return response.data;
  },

  // Create new patient
  create: async (data: CreatePatientRequest): Promise<Patient> => {
    const response = await api.post<Patient>('/api/v1/patients', data);
    return response.data;
  },

  // Update patient
  update: async (id: string, data: UpdatePatientRequest): Promise<Patient> => {
    const response = await api.put<Patient>(`/api/v1/patients/${id}`, data);
    return response.data;
  },

  // Delete patient (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/patients/${id}`);
  },

  // Get patient statistics
  getStatistics: async (): Promise<PatientStatistics> => {
    const response = await api.get<PatientStatistics>('/api/v1/patients/statistics');
    return response.data;
  },

  // Get patient services
  getServices: async (id: string): Promise<ServiceType[]> => {
    const response = await api.get<Array<{ service_type: ServiceType; is_active: boolean }>>(
      `/api/v1/patients/${id}/services`
    );
    return response.data.filter((e) => e.is_active).map((e) => e.service_type);
  },

  // Enroll patient in service
  enrollInService: async (id: string, serviceType: ServiceType): Promise<void> => {
    await api.post(`/api/v1/patients/${id}/services/${serviceType}`);
  },

  // Deactivate service
  deactivateService: async (id: string, serviceType: ServiceType): Promise<void> => {
    await api.delete(`/api/v1/patients/${id}/services/${serviceType}`);
  },

  // Reference data
  getStates: async (): Promise<NigerianState[]> => {
    const response = await api.get<NigerianState[]>('/api/v1/patients/states');
    return response.data;
  },

  getLgas: async (stateId: number): Promise<NigerianLga[]> => {
    const response = await api.get<NigerianLga[]>('/api/v1/patients/lgas', {
      params: { state_id: stateId },
    });
    return response.data;
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPatientFullName(patient: Patient): string {
  const parts = [patient.first_name];
  if (patient.middle_name) parts.push(patient.middle_name);
  parts.push(patient.last_name);
  return parts.join(' ');
}

export function formatPatientAge(patient: Patient): string {
  if (patient.age !== null) {
    return `${patient.age} years`;
  }
  // Calculate from date of birth
  const dob = new Date(patient.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return `${age} years`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// UPPERCASE constants (preferred)
export const SEX_OPTIONS: SexType[] = ['Male', 'Female', 'Intersex'];

export const GENDER_OPTIONS: GenderIdentity[] = [
  'Man',
  'Woman',
  'Non-binary',
  'Transgender Man',
  'Transgender Woman',
  'Genderqueer',
  'Genderfluid',
  'Agender',
  'Prefer not to say',
  'Other',
];

export const MARITAL_STATUSES: MaritalStatus[] = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
  'Cohabitating',
  'Prefer not to say',
];

export const EDUCATIONAL_LEVELS: EducationalLevel[] = [
  'None',
  'Primary',
  'Secondary',
  'SSCE',
  'Tertiary Institution',
  'Vocational',
  'Postgraduate',
];

export const OCCUPATION_TYPES: OccupationType[] = [
  'Student',
  'Self-employed',
  'Employed',
  'Unemployed',
  'Retired',
  'Other',
];

export const SERVICE_TYPES: ServiceType[] = ['PREP', 'PEP', 'ART', 'Mental Health'];

// Deprecated camelCase aliases for backwards compatibility
export const sexOptions = SEX_OPTIONS;
export const genderOptions = GENDER_OPTIONS;
export const maritalStatusOptions = MARITAL_STATUSES;
export const educationalLevelOptions = EDUCATIONAL_LEVELS;
export const occupationOptions = OCCUPATION_TYPES;
export const serviceTypeOptions = SERVICE_TYPES;

// ============================================================================
// API FUNCTIONS
// ============================================================================

export interface PatientListResponse {
  data: Patient[];
  total: number;
  page: number;
  per_page: number;
}

export const patientApi = {
  // Get all patients with optional filters
  getPatients: async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PatientListResponse> => {
    const response = await api.get<PatientListResponse>('/api/v1/patients', { params });
    return response.data;
  },

  // Get a single patient by ID
  getPatient: async (patientId: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  // Create a new patient
  createPatient: async (data: CreatePatientRequest): Promise<Patient> => {
    const response = await api.post<Patient>('/api/v1/patients', data);
    return response.data;
  },

  // Update a patient
  updatePatient: async (patientId: string, data: UpdatePatientRequest): Promise<Patient> => {
    const response = await api.put<Patient>(`/api/v1/patients/${patientId}`, data);
    return response.data;
  },
};
