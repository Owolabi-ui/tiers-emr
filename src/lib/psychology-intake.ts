// Psychology Intake API
import { api } from './api';

// Enums
export type ScreeningFrequency = 'Not at all' | 'Several days' | 'More than half the days' | 'Nearly every day';
export type SubstanceUseFrequency = 'Frequently' | 'Sometimes' | 'Rarely' | 'Never';
export type ReferralSource =
  | 'Google search'
  | 'Social media (Instagram, TikTok, etc.)'
  | 'Referral from a friend'
  | 'Referral from family member'
  | 'Referral from a healthcare provider'
  | 'Workplace or school referral'
  | 'Returning client'
  | 'Community organization'
  | 'Other';
export type SessionPreference = 'Physical' | 'Virtual/Online';
export type SuicideRiskLevel = 'None' | 'Low' | 'Moderate' | 'High';

export interface GenerateIntakeTokenRequest {
  patient_id: string;
}

export interface GenerateIntakeTokenResponse {
  token: string;
  shareable_link: string;
  expires_at: string;
}

export interface PublicIntakeFormData {
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string | null;
}

export interface SubmitPublicIntakeRequest {
  feeling_nervous: ScreeningFrequency;
  uncontrolled_worrying: ScreeningFrequency;
  feeling_depressed: ScreeningFrequency;
  little_interest: ScreeningFrequency;
  suicidal_thoughts: ScreeningFrequency;
  substance_use_frequency: SubstanceUseFrequency;
  substances_used: string | null;
  physical_health_conditions: string | null;
  has_prior_therapy: boolean;
  prior_therapy_details: string | null;
  presenting_concern: string;
  referral_source: ReferralSource;
  referral_source_other: string | null;
  session_preference: SessionPreference;
}

export interface PsychologyIntake {
  id: string;
  patient_id: string;
  access_token: string | null;
  token_expires_at: string | null;
  token_used_at: string | null;
  submitted_via: 'staff' | 'patient';
  
  // Screening questions
  feeling_nervous: ScreeningFrequency;
  uncontrolled_worrying: ScreeningFrequency;
  feeling_depressed: ScreeningFrequency;
  little_interest: ScreeningFrequency;
  suicidal_thoughts: ScreeningFrequency;
  
  // Calculated scores
  gad2_score: number;
  phq2_score: number;
  suicide_risk_level: SuicideRiskLevel;
  
  // Other fields
  substance_use_frequency: SubstanceUseFrequency;
  substances_used: string | null;
  physical_health_conditions: string | null;
  has_prior_therapy: boolean;
  prior_therapy_details: string | null;
  presenting_concern: string;
  referral_source: ReferralSource;
  referral_source_other: string | null;
  session_preference: SessionPreference;
  
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const psychologyIntakeApi = {
  // Staff: Generate intake token for patient
  generateToken: async (data: GenerateIntakeTokenRequest): Promise<GenerateIntakeTokenResponse> => {
    const response = await api.post('/api/v1/psychology/intake/generate-token', data);
    return response.data;
  },

  // Staff: Get intake by patient ID
  getByPatient: async (patientId: string): Promise<PsychologyIntake> => {
    const response = await api.get(`/api/v1/psychology/intake/patient/${patientId}`);
    return response.data;
  },

  // Staff: Create intake manually
  createManual: async (data: Partial<PsychologyIntake>): Promise<PsychologyIntake> => {
    const response = await api.post('/api/v1/psychology/intake', data);
    return response.data;
  },

  // Staff: Update intake
  update: async (id: string, data: Partial<PsychologyIntake>): Promise<PsychologyIntake> => {
    const response = await api.put(`/api/v1/psychology/intake/${id}`, data);
    return response.data;
  },

  // Public: Get intake form (validate token)
  getPublicForm: async (token: string): Promise<PublicIntakeFormData> => {
    const response = await api.get(`/api/v1/public/psychology/intake/${token}`);
    return response.data;
  },

  // Public: Submit intake form
  submitPublicForm: async (token: string, data: SubmitPublicIntakeRequest): Promise<PsychologyIntake> => {
    const response = await api.post(`/api/v1/public/psychology/intake/${token}`, data);
    return response.data;
  },

  // Staff: Check if intake form has been submitted (for polling)
  checkIntakeStatus: async (patientId: string): Promise<{ completed: boolean; intake: PsychologyIntake | null }> => {
    try {
      const intake = await psychologyIntakeApi.getByPatient(patientId);
      // Check if token_used_at is set (form was submitted)
      const completed = intake?.token_used_at !== null;
      return { completed, intake: completed ? intake : null };
    } catch (err) {
      return { completed: false, intake: null };
    }
  },

  // Staff: Get all intake forms for a patient (history)
  getIntakeHistory: async (patientId: string): Promise<PsychologyIntake[]> => {
    const response = await api.get(`/api/v1/psychology/intake/patient/${patientId}/history`);
    return response.data;
  },
};

// Helper to get severity label for scores
export function getScoreSeverity(score: number, type: 'gad2' | 'phq2'): {
  label: string;
  color: string;
  description: string;
} {
  if (type === 'gad2') {
    if (score >= 0 && score <= 2) {
      return { label: 'Minimal', color: 'text-green-600', description: 'No significant anxiety' };
    }
    return { label: 'Positive Screen', color: 'text-red-600', description: 'Further assessment needed' };
  }
  
  // PHQ-2
  if (score >= 0 && score <= 2) {
    return { label: 'Minimal', color: 'text-green-600', description: 'No significant depression' };
  }
  return { label: 'Positive Screen', color: 'text-red-600', description: 'Full PHQ-9 recommended' };
}

export function getSuicideRiskColor(level: SuicideRiskLevel): string {
  switch (level) {
    case 'None': return 'text-green-600';
    case 'Low': return 'text-yellow-600';
    case 'Moderate': return 'text-orange-600';
    case 'High': return 'text-red-600';
    default: return 'text-gray-600';
  }
}
