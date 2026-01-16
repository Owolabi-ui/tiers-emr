import api from './api';

// ============================================
// TYPES
// ============================================

export type FacilityType = 
  | 'Hospital'
  | 'HealthCenter'
  | 'Dispensary'
  | 'Clinic'
  | 'MaternalChildHealthCenter'
  | 'VctCenter'
  | 'LaboratoryOnly'
  | 'PharmacyOnly'
  | 'Other';

export type FacilityOwnership = 
  | 'Government'
  | 'PrivateForProfit'
  | 'PrivateNotForProfit'
  | 'FaithBased'
  | 'Ngo'
  | 'CommunityBased'
  | 'Other';

export type LevelOfCare = 
  | 'Level_1'
  | 'Level_2'
  | 'Level_3'
  | 'Level_4'
  | 'Level_5'
  | 'Level_6';

export interface Clinic {
  id: string;
  facility_code: string;
  name: string;
  facility_type: FacilityType;
  ownership: FacilityOwnership;
  level_of_care: LevelOfCare;
  country: string;
  region?: string;
  district?: string;
  county?: string;
  subcounty?: string;
  ward?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  opening_date?: string;
  closing_date?: string;
  bed_capacity?: number;
  staff_count?: number;
  provides_hiv_services: boolean;
  provides_tb_services: boolean;
  provides_malaria_services: boolean;
  provides_maternal_health: boolean;
  provides_laboratory: boolean;
  provides_pharmacy: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicListResponse {
  clinics: Clinic[];
  total: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const clinicsApi = {
  // Get all clinics
  getAll: async (): Promise<ClinicListResponse> => {
    const response = await api.get<Clinic[]>('/api/v1/clinics');
    return {
      clinics: response.data,
      total: response.data.length,
    };
  },

  // Get a specific clinic by ID
  getById: async (id: string): Promise<Clinic> => {
    const response = await api.get<Clinic>(`/api/v1/clinics/${id}`);
    return response.data;
  },

  // Get active clinics only
  getActive: async (): Promise<ClinicListResponse> => {
    const response = await api.get<Clinic[]>('/api/v1/clinics', {
      params: { is_active: true },
    });
    return {
      clinics: response.data,
      total: response.data.length,
    };
  },

  // Create a new clinic
  create: async (clinic: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>): Promise<Clinic> => {
    const response = await api.post<Clinic>('/api/v1/clinics', clinic);
    return response.data;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getFacilityTypeLabel = (type: FacilityType): string => {
  const labels: Record<FacilityType, string> = {
    'Hospital': 'Hospital',
    'HealthCenter': 'Health Center',
    'Dispensary': 'Dispensary',
    'Clinic': 'Clinic',
    'MaternalChildHealthCenter': 'Maternal & Child Health Center',
    'VctCenter': 'VCT Center',
    'LaboratoryOnly': 'Laboratory Only',
    'PharmacyOnly': 'Pharmacy Only',
    'Other': 'Other',
  };
  return labels[type] || type;
};

export const getLevelOfCareLabel = (level: LevelOfCare): string => {
  const labels: Record<LevelOfCare, string> = {
    'Level1': 'Level 1 - Community Health',
    'Level2': 'Level 2 - Dispensary',
    'Level3': 'Level 3 - Health Center',
    'Level4': 'Level 4 - Sub-County Hospital',
    'Level5': 'Level 5 - County Referral Hospital',
    'Level6': 'Level 6 - National Referral Hospital',
  };
  return labels[level] || level;
};
