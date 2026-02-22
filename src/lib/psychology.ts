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
  session_number?: number | null;
  duration_minutes: number;
  modality?: string | null;
  setting?: string | null;
  presenting_concerns: string[];
  interventions_used: string[];
  goals_addressed?: string[] | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  session_notes?: string | null;
  progress_notes?: string | null;
  risk_assessment?: string | null;
  safety_plan?: string | null;
  homework_assigned?: string | null;
  next_session_scheduled?: string | null;
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
  modality?: 'In-person' | 'Virtual/Telehealth' | 'Phone';
  setting?: string;
  presenting_concerns: string[];
  interventions_used: string[];
  goals_addressed?: string[];
  homework_assigned?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  patient_mood?: string;
  engagement_level?: 'Low' | 'Moderate' | 'High';
  progress_rating?: number;
  risk_assessment?: 'Low' | 'Moderate' | 'High' | 'Critical';
  next_session_scheduled?: string;
  referrals_made?: string[];
  session_notes?: string;
  progress_notes?: string;
  safety_plan?: string;
  next_session_date?: string; // deprecated, use next_session_scheduled
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
  toInt(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
    return fallback;
  },

  difficultyToRating(value?: string | null): number | null {
    if (!value) return null;
    const difficultyMap: Record<string, number> = {
      'Not difficult at all': 0,
      'Somewhat difficult': 1,
      'Very difficult': 2,
      'Extremely difficult': 3,
    };
    if (value in difficultyMap) {
      return difficultyMap[value];
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  },

  // Normalize date/datetime strings to backend-friendly UTC ISO format.
  normalizeToUtcIso(input?: string | null): string | null {
    if (!input) return null;
    const value = input.trim();
    if (!value) return null;
    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00Z`;
    return value;
  },

  // PHQ-9 Depression Assessments
  async createPHQ9(data: CreatePHQ9Request): Promise<PHQ9Assessment> {
    const payload = {
      patient_id: data.patient_id,
      assessment_date: psychologyApi.normalizeToUtcIso(data.assessment_date),
      session_id: null,
      little_interest: psychologyApi.toInt(data.little_interest),
      feeling_down: psychologyApi.toInt(data.feeling_down),
      sleep_problems: psychologyApi.toInt(data.sleep_problems),
      feeling_tired: psychologyApi.toInt(data.feeling_tired),
      appetite_changes: psychologyApi.toInt(data.appetite_problems),
      feeling_bad: psychologyApi.toInt(data.feeling_bad),
      trouble_concentrating: psychologyApi.toInt(data.concentration_problems),
      moving_slowly: psychologyApi.toInt(data.moving_speaking),
      self_harm_thoughts: psychologyApi.toInt(data.self_harm_thoughts),
      difficulty_rating: psychologyApi.difficultyToRating(data.difficulty_level),
      notes: data.notes || null,
    };

    const response = await api.post('/api/v1/psychology/phq9', payload);
    return response.data;
  },

  async getLatestPHQ9(patientId: string): Promise<PHQ9Assessment | null> {
    try {
      const response = await api.get(`/api/v1/psychology/patients/${patientId}/phq9/latest`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  async getPHQ9History(patientId: string): Promise<PHQ9Assessment[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/phq9/history`);
    return response.data;
  },

  // GAD-7 Anxiety Assessments
  async createGAD7(data: CreateGAD7Request): Promise<GAD7Assessment> {
    const payload = {
      patient_id: data.patient_id,
      assessment_date: psychologyApi.normalizeToUtcIso(data.assessment_date),
      session_id: null,
      feeling_nervous: psychologyApi.toInt(data.feeling_nervous),
      not_stop_worrying: psychologyApi.toInt(data.cant_stop_worrying),
      worrying_too_much: psychologyApi.toInt(data.worrying_too_much),
      trouble_relaxing: psychologyApi.toInt(data.trouble_relaxing),
      restless: psychologyApi.toInt(data.restless),
      easily_annoyed: psychologyApi.toInt(data.easily_annoyed),
      feeling_afraid: psychologyApi.toInt(data.feeling_afraid),
      difficulty_rating: psychologyApi.difficultyToRating(data.difficulty_level),
      notes: data.notes || null,
    };

    const response = await api.post('/api/v1/psychology/gad7', payload);
    return response.data;
  },

  async getLatestGAD7(patientId: string): Promise<GAD7Assessment | null> {
    try {
      const response = await api.get(`/api/v1/psychology/patients/${patientId}/gad7/latest`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  async getGAD7History(patientId: string): Promise<GAD7Assessment[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/gad7/history`);
    return response.data;
  },

  // AUDIT-C Alcohol Assessments
  async createAUDITC(data: CreateAUDITCRequest): Promise<AUDITCAssessment> {
    const payload = {
      patient_id: data.patient_id,
      assessment_date: psychologyApi.normalizeToUtcIso(data.assessment_date),
      session_id: null,
      frequency: psychologyApi.toInt(data.drinking_frequency),
      quantity: psychologyApi.toInt(data.typical_drinks),
      binge_frequency: psychologyApi.toInt(data.binge_frequency),
      notes: data.notes || null,
    };

    const response = await api.post('/api/v1/psychology/audit-c', payload);
    return response.data;
  },

  async getLatestAUDITC(patientId: string): Promise<AUDITCAssessment | null> {
    try {
      const response = await api.get(`/api/v1/psychology/patients/${patientId}/audit-c/latest`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  // Counseling Sessions
  async createSession(data: CreateSessionRequest): Promise<CounselingSession> {
    // Transform frontend data to match backend expectations
    // Convert date strings to ISO 8601 datetime format for backend
    const sessionDate = psychologyApi.normalizeToUtcIso(data.session_date) || `${data.session_date}T00:00:00Z`;
    const nextSessionScheduled = psychologyApi.normalizeToUtcIso(data.next_session_scheduled || null);
    
    // Map frontend session types to backend Rust enum variants (PascalCase)
    const sessionTypeMap: Record<string, string> = {
      'Individual Therapy': 'IndividualTherapy',
      'Couples Counseling': 'CouplesCounseling',
      'Family Therapy': 'FamilyTherapy',
      'Group Therapy': 'GroupTherapy',
      'Substance Abuse Counseling': 'SubstanceAbuseCounseling',
      'Trauma Counseling': 'TraumaCounseling',
      'Grief Counseling': 'GriefCounseling',
      'Crisis Counseling': 'CrisisCounseling',
      'Psychosocial Support': 'PsychosocialSupport',
      'Peer Support': 'PeerSupport',
      'Nutritional Counseling': 'NutritionalCounseling',
      'Adherence Counseling': 'AdherenceCounseling',
      'Pre-Test Counseling': 'PreTestCounseling',
      'Post-Test Counseling': 'PostTestCounseling',
      'Disclosure Counseling': 'DisclosureCounseling',
      'Partner Notification': 'PartnerNotification',
    };
    
    const backendSessionType = sessionTypeMap[data.session_type] || data.session_type;
    
    // Map frontend modality to backend Rust enum variants (PascalCase)
    const modalityMap: Record<string, string> = {
      'In-person': 'InPerson',
      'Virtual/Telehealth': 'Video',
      'Phone': 'Phone',
      'Group': 'Group',
      'Home': 'Home',
    };
    
    const backendModality = data.modality ? (modalityMap[data.modality] || data.modality) : 'InPerson';
    
    const payload = {
      patient_id: data.patient_id,
      session_date: sessionDate,
      session_type: backendSessionType,
      duration_minutes: data.duration_minutes || null,
      modality: backendModality,
      setting: data.setting || null,
      presenting_concerns: data.presenting_concerns || [],
      interventions_used: data.interventions_used || [],
      goals_addressed: data.goals_addressed || [],
      homework_assigned: data.homework_assigned || null,
      subjective: data.subjective || data.session_notes || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || data.progress_notes || null,
      patient_mood: data.patient_mood || null,
      engagement_level: data.engagement_level || null,
      progress_rating: data.progress_rating || null,
      risk_assessment: null, // Risk assessment is a complex struct - would need separate form
      next_session_scheduled: nextSessionScheduled,
      referrals_made: data.referrals_made || null,
    };
    
    const response = await api.post('/api/v1/psychology/sessions', payload);
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

  // Timeline & Trends
  async getAssessmentTimeline(patientId: string): Promise<AssessmentTimelineItem[]> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/timeline`);
    return response.data;
  },

  async getPatientSummary(patientId: string): Promise<PatientPsychologySummary> {
    const response = await api.get(`/api/v1/psychology/patients/${patientId}/summary`);
    return response.data;
  },

  async getPHQ9Trends(patientId: string, startDate?: string, endDate?: string): Promise<AssessmentTrendData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const history = await this.getPHQ9History(patientId);
    return history.map(a => ({
      date: a.assessment_date,
      score: a.total_score,
      severity: a.severity
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async getGAD7Trends(patientId: string, startDate?: string, endDate?: string): Promise<AssessmentTrendData[]> {
    const history = await this.getGAD7History(patientId);
    return history.map(a => ({
      date: a.assessment_date,
      score: a.total_score,
      severity: a.severity
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Statistics
  async getStatistics(): Promise<PsychologyStatistics> {
    const response = await api.get('/api/v1/psychology/statistics');
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

// ============================================
// TIMELINE & TRENDS
// ============================================

export interface AssessmentTimelineItem {
  patient_id: string;
  assessment_type: 'intake' | 'phq9' | 'gad7' | 'auditc';
  assessment_subtype: string | null;
  assessment_id: string;
  assessment_date: string;
  session_id: string | null;
  score: number | null;
  severity: string | null;
  submitted_via: string | null;
  intake_type: string | null;
  is_active: boolean | null;
}

export interface PatientPsychologySummary {
  current_intake_id: string | null;
  current_intake_date: string | null;
  total_sessions: number;
  latest_phq9_score: number | null;
  latest_phq9_date: string | null;
  latest_gad7_score: number | null;
  latest_gad7_date: string | null;
  has_active_concerns: boolean;
}

export interface AssessmentTrendData {
  date: string;
  score: number;
  severity: string;
}

export interface PsychologyStatistics {
  total_sessions: number;
  sessions_this_month: number;
  total_patients: number;
  active_patients: number;
  total_phq9_assessments: number;
  total_gad7_assessments: number;
  total_audit_c_assessments: number;
  average_phq9_score: number;
  average_gad7_score: number;
  high_risk_patients: number;
  active_therapy_goals: number;
  completed_goals: number;
}

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
