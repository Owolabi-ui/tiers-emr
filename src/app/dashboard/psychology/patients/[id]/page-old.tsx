'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  psychologyApi, 
  PHQ9Assessment, 
  GAD7Assessment, 
  AUDITCAssessment,
  CounselingSession,
  TherapyGoal,
  getSeverityColor 
} from '@/lib/psychology';
import { psychologyIntakeApi } from '@/lib/psychology-intake';
import { patientApi } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { GenerateIntakeLinkModal } from '@/components/generate-intake-link-modal';
import { GenerateAssessmentLinkModal } from '@/components/generate-assessment-link-modal';
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
} from 'lucide-react';

export default function PatientPsychologyPage() {
  const params = useParams();
  const patientId = params?.id as string;
  
  const [phq9, setPhq9] = useState<PHQ9Assessment[]>([]);
  const [gad7, setGad7] = useState<GAD7Assessment[]>([]);
  const [auditc, setAuditc] = useState<AUDITCAssessment | null>(null);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [goals, setGoals] = useState<TherapyGoal[]>([]);
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
      console.log('[PatientPsychologyPage] Rendering with patientId:', patientId);
      setLoading(true);
      setError(null);

      const [phq9Data, gad7Data, auditcData, sessionsData, goalsData, patientData, intakeStatus] = await Promise.all([
        psychologyApi.getPHQ9History(patientId).catch(() => []),
        psychologyApi.getGAD7History(patientId).catch(() => []),
        psychologyApi.getLatestAUDITC(patientId).catch(() => null),
        psychologyApi.getPatientSessions(patientId).catch(() => []),
        psychologyApi.getPatientGoals(patientId).catch(() => []),
        patientApi.getPatient(patientId).catch(() => null),
        psychologyIntakeApi.checkIntakeStatus(patientId).catch(() => ({ completed: false })),
      ]);

      if (patientData) {
        setPatientName(`${patientData.first_name} ${patientData.last_name}`);
      }
      
      setIntakeCompleted(intakeStatus.completed);

      setPhq9(phq9Data);
      setGad7(gad7Data);
      setAuditc(auditcData);
      setSessions(sessionsData);
      setGoals(goalsData);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/psychology"
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Brain className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              {patientName} - Psychology Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Mental health assessments and counseling history
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {intakeCompleted && (
          <>
            <button
              onClick={() => setShowPhq9Modal(true)}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-gray-900 dark:text-white">PHQ-9</span>
              </div>
            </button>

            <button
              onClick={() => setShowGad7Modal(true)}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">GAD-7</span>
              </div>
            </button>
          </>
        )}

        <Link
          href={`/dashboard/psychology/sessions/new/${patientId}`}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-white">New Session</span>
          </div>
        </Link>

        <Link
          href={`/dashboard/psychology/goals/${patientId}`}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-gray-900 dark:text-white">Manage Goals</span>
          </div>
        </Link>

        <Link
          href={`/dashboard/psychology/intake/${patientId}`}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">View Intake</span>
          </div>
        </Link>

        <button
          onClick={() => setShowIntakeModal(true)}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-orange-300 dark:hover:border-orange-700 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="font-medium text-gray-900 dark:text-white">Send Intake</span>
          </div>
        </button>
      </div>

      {/* Latest Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PHQ-9 */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">PHQ-9 Depression</h3>
            {latestPHQ9 && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(latestPHQ9.severity)}`}>
                {latestPHQ9.severity}
              </span>
            )}
          </div>
          {latestPHQ9 ? (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {latestPHQ9.total_score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(latestPHQ9.assessment_date).toLocaleDateString()}
              </div>
              {phq9.length > 1 && (
                <div className="mt-4">
                  <Link
                    href={`/dashboard/psychology/assessments/phq9/${patientId}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View history ({phq9.length} assessments)
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No assessments yet
            </div>
          )}
        </div>

        {/* GAD-7 */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">GAD-7 Anxiety</h3>
            {latestGAD7 && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(latestGAD7.severity)}`}>
                {latestGAD7.severity}
              </span>
            )}
          </div>
          {latestGAD7 ? (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {latestGAD7.total_score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(latestGAD7.assessment_date).toLocaleDateString()}
              </div>
              {gad7.length > 1 && (
                <div className="mt-4">
                  <Link
                    href={`/dashboard/psychology/assessments/gad7/${patientId}`}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    View history ({gad7.length} assessments)
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No assessments yet
            </div>
          )}
        </div>

        {/* AUDIT-C */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">AUDIT-C Alcohol</h3>
            {auditc && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(auditc.risk_level)}`}>
                {auditc.risk_level}
              </span>
            )}
          </div>
          {auditc ? (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {auditc.total_score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(auditc.assessment_date).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No assessment yet
            </div>
          )}
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Active Therapy Goals
            </h3>
            <Link
              href={`/dashboard/psychology/goals/${patientId}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage all goals
            </Link>
          </div>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{goal.goal_description}</p>
                    {goal.target_date && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Counseling Sessions
          </h3>
          <Link
            href={`/dashboard/psychology/sessions/new/${patientId}`}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            New session
          </Link>
        </div>
        {sessions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{session.session_type}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {session.duration_minutes} min
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.session_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {session.presenting_concerns.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.presenting_concerns.slice(0, 3).map((concern, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No counseling sessions recorded</p>
            <Link
              href={`/dashboard/psychology/sessions/new/${patientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Record First Session
            </Link>
          </div>
        )}
      </div>

      {/* Intake Modal */}
      {showIntakeModal && (
        <GenerateIntakeLinkModal
          patientId={patientId}
          patientName={patientName}
          onClose={() => {
            setShowIntakeModal(false);
          }}
        />
      )}

      {/* PHQ-9 Assessment Modal */}
      {showPhq9Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          patientName={patientName}
          assessmentType="phq9"
          onClose={() => setShowPhq9Modal(false)}
        />
      )}

      {/* GAD-7 Assessment Modal */}
      {showGad7Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          patientName={patientName}
          assessmentType="gad7"
          onClose={() => setShowGad7Modal(false)}
        />
      )}
    </div>
  );
}
