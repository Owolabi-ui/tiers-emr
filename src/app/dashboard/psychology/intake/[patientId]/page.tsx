'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { psychologyIntakeApi, PsychologyIntake, getSuicideRiskColor, getScoreSeverity } from '@/lib/psychology-intake';
import { getErrorMessage } from '@/lib/api';
import { GenerateAssessmentLinkModal } from '@/components/generate-assessment-link-modal';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Brain, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  MessageSquare,
  Activity,
  QrCode
} from 'lucide-react';

export default function ViewIntakePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.patientId as string;

  const [intake, setIntake] = useState<PsychologyIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGad7Modal, setShowGad7Modal] = useState(false);
  const [showPhq9Modal, setShowPhq9Modal] = useState(false);
  const [patientName, setPatientName] = useState<string>('Patient');

  useEffect(() => {
    fetchIntake();
  }, [patientId]);

  const fetchIntake = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await psychologyIntakeApi.getByPatient(patientId);
      setIntake(data);
      
      // Fetch patient name from intake data if available
      // The intake API should return patient info, but we can extract from existing data
      setPatientName('Patient'); // Will be updated when we have patient API integrated
    } catch (err) {
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

  if (error || !intake) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/dashboard/psychology/patients/${patientId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patient
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Intake Form Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This patient has not completed an intake form yet.'}
          </p>
          <button
            onClick={() => router.push(`/dashboard/psychology/patients/${patientId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Send Intake Form
          </button>
        </div>
      </div>
    );
  }

  const gad2Severity = intake.gad2_score !== null ? getScoreSeverity(intake.gad2_score, 'gad2') : null;
  const phq2Severity = intake.phq2_score !== null ? getScoreSeverity(intake.phq2_score, 'phq2') : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/psychology/patients/${patientId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mental Health Intake Form
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submitted {intake.submitted_via === 'patient' ? 'by patient' : 'by staff'} on {new Date(intake.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {(intake.suicide_risk_level === 'High' || intake.suicide_risk_level === 'Moderate') && (
        <div className={`border rounded-lg p-4 ${
          intake.suicide_risk_level === 'High' 
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
            : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${
              intake.suicide_risk_level === 'High' ? 'text-red-600' : 'text-orange-600'
            }`} />
            <div>
              <p className={`font-semibold ${
                intake.suicide_risk_level === 'High' ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'
              }`}>
                {intake.suicide_risk_level} Suicide Risk Detected
              </p>
              <p className={`text-sm ${
                intake.suicide_risk_level === 'High' ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'
              }`}>
                Immediate assessment and safety planning recommended
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screening Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GAD-2 Anxiety */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">GAD-2 (Anxiety)</h3>
          </div>
          {intake.gad2_score !== null && gad2Severity ? (
            <>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {intake.gad2_score}/6
              </div>
              <div className={`text-sm font-medium ${gad2Severity.color}`}>
                {gad2Severity.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {gad2Severity.description}
              </div>
              {intake.gad2_score > 2 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    📋 Recommended Action
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Administer full <strong>GAD-7</strong> assessment for detailed anxiety evaluation
                  </p>
                  <button
                    onClick={() => setShowGad7Modal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    Send GAD-7 Assessment
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Not assessed</p>
          )}
        </div>

        {/* PHQ-2 Depression */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">PHQ-2 (Depression)</h3>
          </div>
          {intake.phq2_score !== null && phq2Severity ? (
            <>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {intake.phq2_score}/6
              </div>
              <div className={`text-sm font-medium ${phq2Severity.color}`}>
                {phq2Severity.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {phq2Severity.description}
              </div>
              {intake.phq2_score > 2 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📋 Recommended Action
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Administer full <strong>PHQ-9</strong> assessment for detailed depression evaluation
                  </p>
                  <button
                    onClick={() => setShowPhq9Modal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    Send PHQ-9 Assessment
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Not assessed</p>
          )}
        </div>
      </div>

      {/* Presenting Concern */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Presenting Concern</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {intake.presenting_concern}
        </p>
      </div>

      {/* Detailed Assessment */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Screening Responses</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Feeling nervous/anxious:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.feeling_nervous || 'Not answered'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Uncontrolled worrying:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.uncontrolled_worrying || 'Not answered'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Feeling depressed:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.feeling_depressed || 'Not answered'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Little interest/pleasure:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.little_interest || 'Not answered'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Suicidal thoughts:</p>
              <p className={`font-medium ${getSuicideRiskColor(intake.suicide_risk_level || 'None')}`}>
                {intake.suicidal_thoughts || 'Not answered'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Substance Use & Health History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Substance Use</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Frequency:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.substance_use_frequency || 'Not answered'}</p>
            </div>
            {intake.substances_used && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Details:</p>
                <p className="font-medium text-gray-900 dark:text-white">{intake.substances_used}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Therapy History</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Prior therapy:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.has_prior_therapy ? 'Yes' : 'No'}</p>
            </div>
            {intake.prior_therapy_details && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Details:</p>
                <p className="font-medium text-gray-900 dark:text-white">{intake.prior_therapy_details}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Physical Health & Referral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {intake.physical_health_conditions && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Physical Health</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{intake.physical_health_conditions}</p>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Referral & Preferences</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Referral source:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {intake.referral_source || 'Not specified'}
                {intake.referral_source_other && ` (${intake.referral_source_other})`}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Session preference:</p>
              <p className="font-medium text-gray-900 dark:text-white">{intake.session_preference || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Modals */}
      {showGad7Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          patientName={patientName}
          assessmentType="gad7"
          onClose={() => setShowGad7Modal(false)}
        />
      )}

      {showPhq9Modal && (
        <GenerateAssessmentLinkModal
          patientId={patientId}
          patientName={patientName}
          assessmentType="phq9"
          onClose={() => setShowPhq9Modal(false)}
        />
      )}
    </div>
  );
}
