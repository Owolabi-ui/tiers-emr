// Psychology Assessment API Client
import { api } from './api';

export interface GenerateAssessmentTokenRequest {
  patient_id: string;
  assessment_type: 'phq9' | 'gad7' | 'auditc';
}

export interface GenerateAssessmentTokenResponse {
  token: string;
  expires_at: string;
  shareable_link: string;
}

export interface PHQ9Submission {
  q1_interest: number;
  q2_depressed: number;
  q3_sleep: number;
  q4_fatigue: number;
  q5_appetite: number;
  q6_failure: number;
  q7_concentration: number;
  q8_movement: number;
  q9_suicide: number;
}

export interface GAD7Submission {
  q1_nervous: number;
  q2_control_worry: number;
  q3_worry_too_much: number;
  q4_trouble_relaxing: number;
  q5_restless: number;
  q6_irritable: number;
  q7_afraid: number;
}

export interface AUDITCSubmission {
  q1_frequency: number;
  q2_quantity: number;
  q3_binge: number;
}

export const assessmentTokenApi = {
  // Generate a token for an assessment
  generateToken: async (request: GenerateAssessmentTokenRequest): Promise<GenerateAssessmentTokenResponse> => {
    const response = await api.post<GenerateAssessmentTokenResponse>(
      '/api/v1/psychology/assessments/generate-token',
      request
    );
    return response.data;
  },

  // Get PHQ-9 form (validates token)
  getPHQ9Form: async (token: string) => {
    const response = await api.get(`/api/v1/public/psychology/phq9/${token}`);
    return response.data;
  },

  // Submit PHQ-9 assessment
  submitPHQ9: async (token: string, data: PHQ9Submission) => {
    const response = await api.post(`/api/v1/public/psychology/phq9/${token}`, data);
    return response.data;
  },

  // Get GAD-7 form (validates token)
  getGAD7Form: async (token: string) => {
    const response = await api.get(`/api/v1/public/psychology/gad7/${token}`);
    return response.data;
  },

  // Submit GAD-7 assessment
  submitGAD7: async (token: string, data: GAD7Submission) => {
    const response = await api.post(`/api/v1/public/psychology/gad7/${token}`, data);
    return response.data;
  },

  // Get AUDIT-C form (validates token)
  getAUDITCForm: async (token: string) => {
    const response = await api.get(`/api/v1/public/psychology/auditc/${token}`);
    return response.data;
  },

  // Submit AUDIT-C assessment
  submitAUDITC: async (token: string, data: AUDITCSubmission) => {
    const response = await api.post(`/api/v1/public/psychology/auditc/${token}`, data);
    return response.data;
  },
};
