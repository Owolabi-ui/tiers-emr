'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  psychologyApi, 
  PHQ9Assessment, 
  GAD7Assessment, 
  AUDITCAssessment,
  CounselingSession,
  TherapyGoal,
  AssessmentTrendData,
  getSeverityColor 
} from '@/lib/psychology';
import { psychologyIntakeApi, PsychologyIntake } from '@/lib/psychology-intake';
import { patientApi } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { GenerateIntakeLinkModal } from '@/components/generate-intake-link-modal';
import { GenerateAssessmentLinkModal } from '@/components/generate-assessment-link-modal';
import { AssessmentTrendsChart } from '@/components/assessment-trends-chart';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Brain,
  Activity,
  FileText,
  Target,
  Plus,
  Calendar,
  TrendingUp,
  QrCode,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

type TabType = 'overview' | 'sessions' | 'trends';

export default function EnhancedPatientPsychologyPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [phq9, setPhq9] = useState<PHQ9Assessment[]>([]);
  const [gad7, setGad7] = useState<GAD7Assessment[]>([]);
  const [phq9Trends, setPhq9Trends] = useState<AssessmentTrendData[]>([]);
  const [gad7Trends, setGad7Trends] = useState<AssessmentTrendData[]>([]);
  const [auditc, setAuditc] = useState<AUDITCAssessment | null>(null);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [goals, setGoals] = useState<TherapyGoal[]>([]);
  const [intakeHistory, setIntakeHistory] = useState<PsychologyIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showPhq9Modal, setShowPhq9Modal] = useState(false);
  const [showGad7Modal, setShowGad7Modal] = useState(false);
  const [patientName, setPatientName] = useState<string>('Patient');
  const [intakeCompleted, setIntakeCompleted] = useState(false);

  useEffect(() => {
    fetchPsychologyData();
  }, [patientId]);

  const fetchPsychologyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [phq9Data, gad7Data, auditcData, sessionsData, goalsData, patientData, intakeStatus, phq9TrendsData, gad7TrendsData, intakeHistoryData] = await Promise.all([
        psychologyApi.getPHQ9History(patientId).catch(() => []),
        psychologyApi.getGAD7History(patientId).catch(() => []),
        psychologyApi.getLatestAUDITC(patientId).catch(() => null),
        psychologyApi.getPatientSessions(patientId).catch(() => []),
        psychologyApi.getPatientGoals(patientId).catch(() => []),
        patientApi.getPatient(patientId).catch(() => null),
        psychologyIntakeApi.checkIntakeStatus(patientId).catch(() => ({ completed: false, intake: null })),
        psychologyApi.getPHQ9Trends(patientId).catch(() => []),
        psychologyApi.getGAD7Trends(patientId).catch(() => []),
        psychologyIntakeApi.getIntakeHistory(patientId).catch(() => []),
      ]);

      if (patientData) {
        setPatientName(`${patientData.first_name} ${patientData.last_name}`);
      }
      
      setIntakeCompleted(intakeStatus.completed);
      setPhq9(phq9Data);
      setGad7(gad7Data);
      setPhq9Trends(phq9TrendsData);
      setGad7Trends(gad7TrendsData);
      setAuditc(auditcData);
      setSessions(sessionsData);
      setGoals(goalsData);
      setIntakeHistory(intakeHistoryData);
    } catch (err) {
      console.error('Error fetching psychology data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const latestPHQ9 = phq9[0];
  const latestGAD7 = gad7[0];
  const activeGoals = goals.filter(g => g.status === 'Active' || g.status === 'In Progress');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/psychology"
          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Mental Health Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {patientName} - Mental Health
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comprehensive mental health tracking and session management
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowIntakeModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Intake Form
            </button>
            <Link
              href={`/dashboard/psychology/sessions/new/${patientId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <ClipboardList className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`${
              activeTab === 'sessions'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Calendar className="h-4 w-4" />
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`${
              activeTab === 'trends'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <BarChart3 className="h-4 w-4" />
            Trends & Progress
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
                </div>
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest PHQ-9</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {latestPHQ9?.total_score ?? '-'}
                  </p>
                  {latestPHQ9 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(latestPHQ9.severity)}`}>
                      {latestPHQ9.severity}
                    </span>
                  )}
                </div>
                <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest GAD-7</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {latestGAD7?.total_score ?? '-'}
                  </p>
                  {latestGAD7 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(latestGAD7.severity)}`}>
                      {latestGAD7.severity}
                    </span>
                  )}
                </div>
                <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Assessment Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowPhq9Modal(true)}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">PHQ-9 Assessment</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Depression screening</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowGad7Modal(true)}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">GAD-7 Assessment</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Anxiety screening</p>
                  </div>
                </div>
              </button>

              <Link
                href={`/dashboard/psychology/goals/${patientId}`}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Manage Goals</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track therapy goals</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Assessments with Details */}
          {(latestPHQ9 || latestGAD7 || auditc) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Assessment Results</h3>
              
              {/* PHQ-9 Details */}
              {latestPHQ9 && (
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        PHQ-9 Depression Screening
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(latestPHQ9.assessment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{latestPHQ9.total_score}/27</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(latestPHQ9.severity)}`}>
                        {latestPHQ9.severity}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Little interest:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.little_interest}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Feeling down:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.feeling_down}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sleep problems:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.sleep_problems}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Feeling tired:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.feeling_tired}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Appetite problems:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.appetite_problems}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Feeling bad:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.feeling_bad}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Concentration problems:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.concentration_problems}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Moving/speaking:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestPHQ9.moving_speaking}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Self-harm thoughts:</span>
                      <span className={`font-medium ${
                        latestPHQ9.self_harm_thoughts > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {latestPHQ9.self_harm_thoughts}/3
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* GAD-7 Details */}
              {latestGAD7 && (
                <div className={`${auditc ? 'mb-6 pb-6 border-b border-gray-200 dark:border-gray-700' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        GAD-7 Anxiety Screening
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(latestGAD7.assessment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{latestGAD7.total_score}/21</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(latestGAD7.severity)}`}>
                        {latestGAD7.severity}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Feeling nervous:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.feeling_nervous}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Can't stop worrying:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.cant_stop_worrying}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Worrying too much:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.worrying_too_much}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Trouble relaxing:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.trouble_relaxing}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Restless:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.restless}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Easily annoyed:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.easily_annoyed}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Feeling afraid:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{latestGAD7.feeling_afraid}/3</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIT-C Details */}
              {auditc && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">AUDIT-C Alcohol Screening</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(auditc.assessment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{auditc.total_score}/12</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        auditc.risk_level === 'HIGH_RISK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        auditc.risk_level === 'MODERATE_RISK' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {auditc.risk_level.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Drinking frequency:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{auditc.drinking_frequency}/4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Typical drinks:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{auditc.typical_drinks}/4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Binge frequency:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{auditc.binge_frequency}/4</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Intake History */}
          {intakeHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Intake Forms</h3>
                <button
                  onClick={() => setShowIntakeModal(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Generate New
                </button>
              </div>
              <div className="space-y-3">
                {intakeHistory.slice(0, 3).map((intake) => (
                  <div key={intake.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(intake.created_at).toLocaleDateString()}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            intake.submitted_via === 'patient' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {intake.submitted_via === 'patient' ? 'Patient Submitted' : 'Staff Entry'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">GAD-2: </span>
                            <span className={`font-medium ${
                              intake.gad2_score >= 3 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {intake.gad2_score}/6 {intake.gad2_score >= 3 ? '(Positive)' : '(Negative)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">PHQ-2: </span>
                            <span className={`font-medium ${
                              intake.phq2_score >= 3 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {intake.phq2_score}/6 {intake.phq2_score >= 3 ? '(Positive)' : '(Negative)'}
                            </span>
                          </div>
                        </div>
                        {intake.suicide_risk_level !== 'None' && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              intake.suicide_risk_level === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              intake.suicide_risk_level === 'Moderate' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              ⚠️ Suicide Risk: {intake.suicide_risk_level}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/psychology/intake/${patientId}`)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-4"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {intakeHistory.length > 3 && (
                <button
                  onClick={() => router.push(`/dashboard/psychology/intake/${patientId}`)}
                  className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all {intakeHistory.length} intake forms →
                </button>
              )}
            </div>
          )}

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{session.session_type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.session_date).toLocaleDateString()} • {session.duration_minutes} min
                        </p>
                        {session.presenting_concerns.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {session.presenting_concerns.slice(0, 3).map((concern, i) => (
                              <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded">
                                {concern}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/psychology/sessions/${session.id}`)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {sessions.length > 3 && (
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all {sessions.length} sessions →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Counseling Sessions</h2>
            <Link
              href={`/dashboard/psychology/sessions/new/${patientId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No counseling sessions recorded yet</p>
              <Link
                href={`/dashboard/psychology/sessions/new/${patientId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Schedule First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.session_type}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.session_date).toLocaleDateString()} • {session.duration_minutes} min
                        </span>
                      </div>
                      {session.presenting_concerns.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {session.presenting_concerns.map((concern, i) => (
                            <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded">
                              {concern}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {session.session_notes}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/psychology/sessions/${session.id}`)}
                      className="ml-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                  {session.next_session_date && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Next session: {new Date(session.next_session_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assessment Trends & Progress</h2>
          </div>

          {phq9Trends.length === 0 && gad7Trends.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No assessment data available for trend analysis</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                Complete at least 2 assessments to see progress trends
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowPhq9Modal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  PHQ-9 Assessment
                </button>
                <button
                  onClick={() => setShowGad7Modal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  GAD-7 Assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {phq9Trends.length > 0 && (
                <AssessmentTrendsChart
                  data={phq9Trends}
                  title="PHQ-9 Depression Trends"
                  maxScore={27}
                  type="phq9"
                />
              )}
              
              {gad7Trends.length > 0 && (
                <AssessmentTrendsChart
                  data={gad7Trends}
                  title="GAD-7 Anxiety Trends"
                  maxScore={21}
                  type="gad7"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showIntakeModal && (
        <GenerateIntakeLinkModal
          patientId={patientId}
          onClose={() => setShowIntakeModal(false)}
        />
      )}
      {showPhq9Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          assessmentType="phq9"
          onClose={() => setShowPhq9Modal(false)}
        />
      )}
      {showGad7Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          assessmentType="gad7"
          onClose={() => setShowGad7Modal(false)}
        />
      )}
    </div>
  );
}
