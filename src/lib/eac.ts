// EAC (Enhanced Adherence Counseling) API Client
import { api } from './api';

// ============================================================================
// ENUMS
// ============================================================================

export type EacTrigger =
  | 'High Viral Load'
  | 'Missed Appointments'
  | 'Poor Adherence'
  | 'Treatment Interruption'
  | 'Clinical Deterioration';

export type EacSessionStatus =
  | 'Scheduled'
  | 'Completed'
  | 'Missed'
  | 'Cancelled';

export type EacOutcome =
  | 'Improved'
  | 'No Change'
  | 'Regimen Switch Required'
  | 'Referred'
  | 'Lost to Follow-Up';

// ============================================================================
// INTERFACES
// ============================================================================

export interface EacEpisode {
  id: string;
  patient_id: string;
  art_id: string;
  patient_name?: string;
  art_no?: string;

  // Trigger
  trigger_reason: EacTrigger;
  trigger_details: string | null;
  baseline_viral_load: number | null;
  baseline_vl_date: string | null;

  // Episode tracking
  start_date: string;
  expected_completion_date: string | null;
  actual_completion_date: string | null;

  // Outcome
  outcome: EacOutcome | null;
  outcome_notes: string | null;
  repeat_viral_load: number | null;
  repeat_vl_date: string | null;

  // Status
  is_active: boolean;
  sessions_completed: number;

  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;

  // Related data
  sessions?: EacSession[];
}

export interface EacSession {
  id: string;
  episode_id: string;
  patient_id: string;

  // Session details
  session_number: number; // 1, 2, or 3
  scheduled_date: string;
  actual_date: string | null;
  status: EacSessionStatus;

  // Assessment
  barriers_identified: string[] | null;
  interventions_provided: string[] | null;
  adherence_percentage: number | null;
  missed_doses_last_week: number | null;

  // Notes
  session_notes: string | null;
  follow_up_actions: string | null;

  // Counselor
  counselor_id: string | null;
  counselor_name: string | null;

  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CreateEacEpisodeRequest {
  patient_id: string;
  art_id: string;
  trigger_reason: EacTrigger;
  trigger_details?: string;
  baseline_viral_load?: number;
  baseline_vl_date?: string;
  start_date?: string;
}

export interface UpdateEacEpisodeRequest {
  expected_completion_date?: string;
  actual_completion_date?: string;
  outcome?: EacOutcome;
  outcome_notes?: string;
  repeat_viral_load?: number;
  repeat_vl_date?: string;
  is_active?: boolean;
}

export interface CreateEacSessionRequest {
  episode_id: string;
  session_number: number;
  scheduled_date: string;
  counselor_id?: string;
}

export interface UpdateEacSessionRequest {
  actual_date?: string;
  status?: EacSessionStatus;
  barriers_identified?: string[];
  interventions_provided?: string[];
  adherence_percentage?: number;
  missed_doses_last_week?: number;
  session_notes?: string;
  follow_up_actions?: string;
  counselor_id?: string;
}

export interface EacEpisodeListResponse {
  data: EacEpisode[];
  total: number;
  page: number;
  per_page: number;
}

export interface EacSessionListResponse {
  data: EacSession[];
  total: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const eacApi = {
  // Episodes
  createEpisode: async (data: CreateEacEpisodeRequest): Promise<EacEpisode> => {
    const response = await api.post<EacEpisode>('/api/v1/eac/episodes', data);
    return response.data;
  },

  getEpisode: async (episodeId: string): Promise<EacEpisode> => {
    const response = await api.get<EacEpisode>(`/api/v1/eac/episodes/${episodeId}`);
    return response.data;
  },

  listEpisodes: async (params?: {
    patient_id?: string;
    art_id?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<EacEpisodeListResponse> => {
    const response = await api.get<EacEpisodeListResponse>('/api/v1/eac/episodes', { params });
    return response.data;
  },

  updateEpisode: async (episodeId: string, data: UpdateEacEpisodeRequest): Promise<EacEpisode> => {
    const response = await api.put<EacEpisode>(`/api/v1/eac/episodes/${episodeId}`, data);
    return response.data;
  },

  completeEpisode: async (
    episodeId: string,
    data: {
      outcome: EacOutcome;
      outcome_notes?: string;
      repeat_viral_load?: number;
      repeat_vl_date?: string;
    }
  ): Promise<EacEpisode> => {
    const response = await api.post<EacEpisode>(`/api/v1/eac/episodes/${episodeId}/complete`, data);
    return response.data;
  },

  // Sessions
  createSession: async (data: CreateEacSessionRequest): Promise<EacSession> => {
    const response = await api.post<EacSession>('/api/v1/eac/sessions', data);
    return response.data;
  },

  getSession: async (sessionId: string): Promise<EacSession> => {
    const response = await api.get<EacSession>(`/api/v1/eac/sessions/${sessionId}`);
    return response.data;
  },

  listSessions: async (params?: {
    episode_id?: string;
    patient_id?: string;
    status?: EacSessionStatus;
  }): Promise<EacSessionListResponse> => {
    const response = await api.get<EacSessionListResponse>('/api/v1/eac/sessions', { params });
    return response.data;
  },

  updateSession: async (sessionId: string, data: UpdateEacSessionRequest): Promise<EacSession> => {
    const response = await api.put<EacSession>(`/api/v1/eac/sessions/${sessionId}`, data);
    return response.data;
  },

  completeSession: async (
    sessionId: string,
    data: {
      barriers_identified: string[];
      interventions_provided: string[];
      adherence_percentage?: number;
      missed_doses_last_week?: number;
      session_notes?: string;
      follow_up_actions?: string;
    }
  ): Promise<EacSession> => {
    const response = await api.post<EacSession>(`/api/v1/eac/sessions/${sessionId}/complete`, data);
    return response.data;
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getEacTriggerColor = (trigger: EacTrigger): string => {
  const colors: Record<EacTrigger, string> = {
    'High Viral Load': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Missed Appointments': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Poor Adherence': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Treatment Interruption': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'Clinical Deterioration': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[trigger];
};

export const getEacOutcomeColor = (outcome: EacOutcome): string => {
  const colors: Record<EacOutcome, string> = {
    'Improved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'No Change': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    'Regimen Switch Required': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Referred': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Lost to Follow-Up': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[outcome];
};

export const getSessionStatusColor = (status: EacSessionStatus): string => {
  const colors: Record<EacSessionStatus, string> = {
    'Scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Missed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status];
};

export const commonBarriers = [
  'Stigma',
  'Forgetfulness',
  'Side effects',
  'Work schedule',
  'Travel/Distance',
  'Cost of transport',
  'Alcohol/substance use',
  'Depression',
  'Family/partner issues',
  'Lack of disclosure',
  'Religious beliefs',
  'Pill burden',
];

export const commonInterventions = [
  'Pill organizer provided',
  'Alarm/reminder system',
  'Family disclosure counseling',
  'Side effect management',
  'Transport support',
  'Flexible clinic hours',
  'Home visits arranged',
  'Support group referral',
  'Mental health referral',
  'Simplified regimen discussion',
  'Treatment literacy education',
  'Partner/family counseling',
];
