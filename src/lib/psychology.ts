import { api } from './api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface PHQ9Assessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  little_interest: number;
  feeling_down: number;
  sleep_problems: number;
  feeling_tired: number;
  appetite_problems: number;
  feeling_bad: number;
  concentration_problems: number;
  moving_speaking: number;
  self_harm_thoughts: number;
  total_score: number;
  severity: 'Minimal' | 'Mild' | 'Moderate' | 'Moderately Severe' | 'Severe';
  difficulty_level?: string | null;
  assessed_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GAD7Assessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  feeling_nervous: number;
  cant_stop_worrying: number;
  worrying_too_much: number;
  trouble_relaxing: number;
  restless: number;
  easily_annoyed: number;
  feeling_afraid: number;
  total_score: number;
  severity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
  difficulty_level?: string | null;
  assessed_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AUDITCAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  drinking_frequency: number;
  typical_drinks: number;
  binge_frequency: number;
  total_score: number;
  risk_level: 'Low Risk' | 'Hazardous' | 'Harmful';
  assessed_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CounselingSession {
  id: string;
  patient_id: string;
  session_date: string;
  session_type: SessionType;
  duration_minutes: number;
  presenting_concerns: string[];
  interventions_used: string[];
  session_notes: string;
  progress_notes?: string | null;
  risk_assessment?: string | null;
  safety_plan?: string | null;
  homework_assigned?: string | null;
  next_session_date?: string | null;
  counselor_id: string;
  created_at: string;
  updated_at: string;
}

export type SessionType = 
  | 'Individual Therapy'
  | 'Group Therapy'
  | 'Family Therapy'
  | 'Crisis Intervention'
  | 'Psychiatric Evaluation'
  | 'Follow-up';

export interface TherapyGoal {
  id: string;
  patient_id: string;
  goal_description: string;
  target_date?: string | null;
  status: GoalStatus;
  progress_notes?: string | null;
  achieved_date?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'Active' | 'In Progress' | 'Achieved' | 'Discontinued';

export interface MentalHealthDiagnosis {
  id: string;
  patient_id: string;
  diagnosis_code: string;
  diagnosis_name: string;
  diagnosis_date: string;
  severity?: string | null;
  status: DiagnosisStatus;
  notes?: string | null;
  diagnosed_by: string;
  created_at: string;
  updated_at: string;
}

export type DiagnosisStatus = 'Active' | 'In Remission' | 'Resolved';

// Request types
export interface CreatePHQ9Request {
  patient_id: string;
  assessment_date: string;
  little_interest: number;
  feeling_down: number;
  sleep_problems: number;
  feeling_tired: number;
  appetite_problems: number;
  feeling_bad: number;
  concentration_problems: number;
  moving_speaking: number;
  self_harm_thoughts: number;
  difficulty_level?: string;
  notes?: string;
}

export interface CreateGAD7Request {
  patient_id: string;
  assessment_date: string;
  feeling_nervous: number;
  cant_stop_worrying: number;
  worrying_too_much: number;
  trouble_relaxing: number;
  restless: number;
  easily_annoyed: number;
  feeling_afraid: number;
  difficulty_level?: string;
  notes?: string;
}

export interface CreateAUDITCRequest {
  patient_id: string;
  assessment_date: string;
  drinking_frequency: number;
  typical_drinks: number;
  binge_frequency: number;
  notes?: string;
}

export interface CreateSessionRequest {
  patient_id: string;
  session_date: string;
  session_type: SessionType;
  duration_minutes: number;
  presenting_concerns: string[];
  interventions_used: string[];
  session_notes: string;
  progress_notes?: string;
  risk_assessment?: string;
  safety_plan?: string;
  homework_assigned?: string;
  next_session_date?: string;
}

export interface CreateGoalRequest {
  patient_id: string;
  goal_description: string;
  target_date?: string;
}

export interface UpdateGoalRequest {
  goal_description?: string;
  target_date?: string;
  status?: GoalStatus;
  progress_notes?: string;
  achieved_date?: string;
}

export interface CreateDiagnosisRequest {
  patient_id: string;
  diagnosis_code: string;
  diagnosis_name: string;
  diagnosis_date: string;
  severity?: string;
  notes?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

export const psychologyApi = {
  // PHQ-9 Depression Assessments
  async createPHQ9(data: CreatePHQ9Request): Promise<PHQ9Assessment> {
    const response = await api.post('/api/v1/psychology/phq9', data);
    return response.data;
  },

  async getLatestPHQ9(patientId: string): Promise<PHQ9Assessment | null> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/phq9/latest`);
    return response.data;
  },

  async getPHQ9History(patientId: string): Promise<PHQ9Assessment[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/phq9/history`);
    return response.data;
  },

  // GAD-7 Anxiety Assessments
  async createGAD7(data: CreateGAD7Request): Promise<GAD7Assessment> {
    const response = await api.post('/api/v1/psychology/gad7', data);
    return response.data;
  },

  async getLatestGAD7(patientId: string): Promise<GAD7Assessment | null> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/gad7/latest`);
    return response.data;
  },

  async getGAD7History(patientId: string): Promise<GAD7Assessment[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/gad7/history`);
    return response.data;
  },

  // AUDIT-C Alcohol Assessments
  async createAUDITC(data: CreateAUDITCRequest): Promise<AUDITCAssessment> {
    const response = await api.post('/api/v1/psychology/audit-c', data);
    return response.data;
  },

  async getLatestAUDITC(patientId: string): Promise<AUDITCAssessment | null> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/audit-c/latest`);
    return response.data;
  },

  // Counseling Sessions
  async createSession(data: CreateSessionRequest): Promise<CounselingSession> {
    const response = await api.post('/api/v1/psychology/sessions', data);
    return response.data;
  },

  async getSession(sessionId: string): Promise<CounselingSession> {
    const response = await api.get(`/api/v1/psychology/sessions/${sessionId}`);
    return response.data;
  },

  async getPatientSessions(patientId: string): Promise<CounselingSession[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/sessions`);
    return response.data;
  },

  // Therapy Goals
  async createGoal(data: CreateGoalRequest): Promise<TherapyGoal> {
    const response = await api.post('/api/v1/psychology/goals', data);
    return response.data;
  },

  async getGoal(goalId: string): Promise<TherapyGoal> {
    const response = await api.get(`/api/v1/psychology/goals/${goalId}`);
    return response.data;
  },

  async updateGoal(goalId: string, data: UpdateGoalRequest): Promise<TherapyGoal> {
    const response = await api.put(`/api/v1/psychology/goals/${goalId}`, data);
    return response.data;
  },

  async getPatientGoals(patientId: string): Promise<TherapyGoal[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/goals`);
    return response.data;
  },

  async getPatientActiveGoals(patientId: string): Promise<TherapyGoal[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/goals/active`);
    return response.data;
  },

  // Mental Health Diagnoses
  async createDiagnosis(data: CreateDiagnosisRequest): Promise<MentalHealthDiagnosis> {
    const response = await api.post('/api/v1/psychology/diagnoses', data);
    return response.data;
  },

  async getPatientActiveDiagnoses(patientId: string): Promise<MentalHealthDiagnosis[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/diagnoses/active`);
    return response.data;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculatePHQ9Score(answers: Omit<CreatePHQ9Request, 'patient_id' | 'assessment_date'>): {
  total: number;
  severity: PHQ9Assessment['severity'];
} {
  const total = 
    answers.little_interest +
    answers.feeling_down +
    answers.sleep_problems +
    answers.feeling_tired +
    answers.appetite_problems +
    answers.feeling_bad +
    answers.concentration_problems +
    answers.moving_speaking +
    answers.self_harm_thoughts;

  let severity: PHQ9Assessment['severity'];
  if (total <= 4) severity = 'Minimal';
  else if (total <= 9) severity = 'Mild';
  else if (total <= 14) severity = 'Moderate';
  else if (total <= 19) severity = 'Moderately Severe';
  else severity = 'Severe';

  return { total, severity };
}

export function calculateGAD7Score(answers: Omit<CreateGAD7Request, 'patient_id' | 'assessment_date'>): {
  total: number;
  severity: GAD7Assessment['severity'];
} {
  const total =
    answers.feeling_nervous +
    answers.cant_stop_worrying +
    answers.worrying_too_much +
    answers.trouble_relaxing +
    answers.restless +
    answers.easily_annoyed +
    answers.feeling_afraid;

  let severity: GAD7Assessment['severity'];
  if (total <= 4) severity = 'Minimal';
  else if (total <= 9) severity = 'Mild';
  else if (total <= 14) severity = 'Moderate';
  else severity = 'Severe';

  return { total, severity };
}

export function calculateAUDITCScore(answers: Omit<CreateAUDITCRequest, 'patient_id' | 'assessment_date'>): {
  total: number;
  risk_level: AUDITCAssessment['risk_level'];
} {
  const total = answers.drinking_frequency + answers.typical_drinks + answers.binge_frequency;

  let risk_level: AUDITCAssessment['risk_level'];
  if (total <= 3) risk_level = 'Low Risk';
  else if (total <= 7) risk_level = 'Hazardous';
  else risk_level = 'Harmful';

  return { total, risk_level };
}

export const sessionTypeOptions: SessionType[] = [
  'Individual Therapy',
  'Group Therapy',
  'Family Therapy',
  'Crisis Intervention',
  'Psychiatric Evaluation',
  'Follow-up',
];

export const goalStatusOptions: GoalStatus[] = [
  'Active',
  'In Progress',
  'Achieved',
  'Discontinued',
];

export const diagnosisStatusOptions: DiagnosisStatus[] = [
  'Active',
  'In Remission',
  'Resolved',
];

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Minimal':
    case 'Low Risk':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Mild':
    case 'Hazardous':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Moderate':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Moderately Severe':
    case 'Severe':
    case 'Harmful':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}
