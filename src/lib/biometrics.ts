// Biometrics API Client for Patient Registration & Identification
import { api } from './api';

export type BiometricType =
  | 'Left Thumb'
  | 'Right Thumb'
  | 'Left Index'
  | 'Right Index'
  | 'Left Middle'
  | 'Right Middle'
  | 'Left Ring'
  | 'Right Ring'
  | 'Left Pinky'
  | 'Right Pinky';

export interface BiometricData {
  id: string;
  patient_id: string;
  biometric_type: BiometricType;
  has_template: boolean;
  quality_score: number | null;
  is_primary: boolean;
  verified_at: string | null;
  verified_by: string | null;
  captured_by: string;
  captured_at: string;
  created_at: string;
}

export interface CaptureBiometricRequest {
  patient_id: string;
  biometric_type: BiometricType;
  fingerprint_data: string; // base64
  fingerprint_template?: string; // base64
  quality_score?: number;
  is_primary?: boolean;
}

export interface VerifyBiometricRequest {
  fingerprint_data: string; // base64
  biometric_id?: string;
}

export interface BiometricVerificationResponse {
  verified: boolean;
  match_score: number | null;
  matched_biometric_id: string | null;
  matched_biometric_type: BiometricType | null;
  patient_id: string | null;
  message: string;
}

export const biometricsApi = {
  /**
   * Capture and save a fingerprint for a patient
   */
  capture: async (data: CaptureBiometricRequest): Promise<BiometricData> => {
    const response = await api.post<BiometricData>('/api/v1/biometrics', data);
    return response.data;
  },

  /**
   * Get all biometrics for a patient
   */
  getPatientBiometrics: async (patientId: string): Promise<BiometricData[]> => {
    const response = await api.get<{ biometrics: BiometricData[]; total: number }>(
      `/api/v1/biometrics/patient/${patientId}`
    );
    return response.data.biometrics;
  },

  /**
   * Verify a fingerprint against a patient's stored biometrics
   */
  verify: async (
    patientId: string,
    data: VerifyBiometricRequest
  ): Promise<BiometricVerificationResponse> => {
    const response = await api.post<BiometricVerificationResponse>(
      `/api/v1/biometrics/${patientId}/verify`,
      data
    );
    return response.data;
  },

  /**
   * Identify a patient by fingerprint (1:N matching)
   */
  identify: async (fingerprintData: string): Promise<BiometricVerificationResponse> => {
    const response = await api.post<BiometricVerificationResponse>(
      '/api/v1/biometrics/identify',
      { fingerprint_data: fingerprintData }
    );
    return response.data;
  },

  /**
   * Set a biometric as primary for a patient
   */
  setPrimary: async (biometricId: string): Promise<BiometricData> => {
    const response = await api.put<BiometricData>(
      `/api/v1/biometrics/${biometricId}/set-primary`,
      {}
    );
    return response.data;
  },

  /**
   * Delete a biometric record
   */
  delete: async (biometricId: string): Promise<void> => {
    await api.delete(`/api/v1/biometrics/${biometricId}`);
  },
};
