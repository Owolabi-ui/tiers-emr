'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  eacApi, 
  EacEpisode, 
  EacSession,
  getEacTriggerColor,
  getEacOutcomeColor,
  getSessionStatusColor,
  commonBarriers,
  commonInterventions,
} from '@/lib/eac';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Loader2,
  Edit,
  Plus,
  X,
} from 'lucide-react';

export default function EacEpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [episode, setEpisode] = useState<EacEpisode | null>(null);
  const [sessions, setSessions] = useState<EacSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session completion modal state
  const [completingSession, setCompletingSession] = useState<EacSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    barriers_identified: [] as string[],
    interventions_provided: [] as string[],
    adherence_percentage: '',
    missed_doses_last_week: '',
    session_notes: '',
    follow_up_actions: '',
    customBarrier: '',
    customIntervention: '',
  });

  useEffect(() => {
    fetchEpisodeData();
  }, [id]);

  const fetchEpisodeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [episodeData, sessionsData] = await Promise.all([
        eacApi.getEpisode(id),
        eacApi.listSessions({ episode_id: id }),
      ]);

      setEpisode(episodeData);
      setSessions(sessionsData.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!completingSession) return;

    try {
      await eacApi.completeSession(completingSession.id, {
        barriers_identified: sessionFormData.barriers_identified,
        interventions_provided: sessionFormData.interventions_provided,
        adherence_percentage: sessionFormData.adherence_percentage ? parseFloat(sessionFormData.adherence_percentage) : undefined,
        missed_doses_last_week: sessionFormData.missed_doses_last_week ? parseInt(sessionFormData.missed_doses_last_week) : undefined,
        session_notes: sessionFormData.session_notes || undefined,
        follow_up_actions: sessionFormData.follow_up_actions || undefined,
      });

      showSuccess(`Session ${completingSession.session_number} completed successfully`);
      setCompletingSession(null);
      setSessionFormData({
        barriers_identified: [],
        interventions_provided: [],
        adherence_percentage: '',
        missed_doses_last_week: '',
        session_notes: '',
        follow_up_actions: '',
        customBarrier: '',
        customIntervention: '',
      });
      fetchEpisodeData();
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const toggleBarrier = (barrier: string) => {
    setSessionFormData(prev => ({
      ...prev,
      barriers_identified: prev.barriers_identified.includes(barrier)
        ? prev.barriers_identified.filter(b => b !== barrier)
        : [...prev.barriers_identified, barrier],
    }));
  };

  const toggleIntervention = (intervention: string) => {
    setSessionFormData(prev => ({
      ...prev,
      interventions_provided: prev.interventions_provided.includes(intervention)
        ? prev.interventions_provided.filter(i => i !== intervention)
        : [...prev.interventions_provided, intervention],
    }));
  };

  const addCustomBarrier = () => {
    if (sessionFormData.customBarrier.trim()) {
      setSessionFormData(prev => ({
        ...prev,
        barriers_identified: [...prev.barriers_identified, prev.customBarrier.trim()],
        customBarrier: '',
      }));
    }
  };

  const addCustomIntervention = () => {
    if (sessionFormData.customIntervention.trim()) {
      setSessionFormData(prev => ({
        ...prev,
        interventions_provided: [...prev.interventions_provided, prev.customIntervention.trim()],
        customIntervention: '',
      }));
    }
  };

  const removeBarrier = (barrier: string) => {
    setSessionFormData(prev => ({
      ...prev,
      barriers_identified: prev.barriers_identified.filter(b => b !== barrier),
    }));
  };

  const removeIntervention = (intervention: string) => {
    setSessionFormData(prev => ({
      ...prev,
      interventions_provided: prev.interventions_provided.filter(i => i !== intervention),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading EAC episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading EAC episode
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error || 'EAC episode not found'}
              </p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-medium"
              >
                ← Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg mt-1"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Enhanced Adherence Counseling
              {episode.is_active ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </span>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Patient: {episode.patient_name || episode.patient_id}</span>
              {episode.art_no && (
                <>
                  <span>•</span>
                  <span>ART No: {episode.art_no}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Episode Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Episode Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trigger Reason</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getEacTriggerColor(episode.trigger_reason)}`}>
                  {episode.trigger_reason}
                </span>
              </div>
              {episode.trigger_details && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trigger Details</p>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {episode.trigger_details}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(episode.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sessions Completed</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {episode.sessions_completed} / 3
                </p>
              </div>
              {episode.baseline_viral_load && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Baseline Viral Load</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {episode.baseline_viral_load.toLocaleString()} copies/mL
                    </p>
                  </div>
                  {episode.baseline_vl_date && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Baseline VL Date</p>
                      <p className="text-base text-gray-900 dark:text-white mt-1">
                        {new Date(episode.baseline_vl_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}
              {episode.outcome && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Outcome</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getEacOutcomeColor(episode.outcome)}`}>
                    {episode.outcome}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Counseling Sessions
            </h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        Session {session.session_number}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    {session.status === 'Scheduled' && (
                      <button
                        onClick={() => {
                          setCompletingSession(session);
                          setSessionFormData({
                            barriers_identified: [],
                            interventions_provided: [],
                            adherence_percentage: '',
                            missed_doses_last_week: '',
                            session_notes: '',
                            follow_up_actions: '',
                            customBarrier: '',
                            customIntervention: '',
                          });
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete Session
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Scheduled Date</p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(session.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    {session.actual_date && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Actual Date</p>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(session.actual_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {session.status === 'Completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {session.barriers_identified && session.barriers_identified.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Barriers Identified
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {session.barriers_identified.map((barrier, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs"
                              >
                                {barrier}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.interventions_provided && session.interventions_provided.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Interventions Provided
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {session.interventions_provided.map((intervention, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs"
                              >
                                {intervention}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.adherence_percentage !== null && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Adherence Rate</p>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {session.adherence_percentage}%
                            </p>
                          </div>
                          {session.missed_doses_last_week !== null && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Missed Doses (Last Week)</p>
                              <p className="text-gray-900 dark:text-white font-medium">
                                {session.missed_doses_last_week}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {session.session_notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Session Notes
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.session_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/art/${episode.art_id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <User className="h-4 w-4" />
                View ART Record
              </Link>
              <Link
                href={`/dashboard/patients/${episode.patient_id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <FileText className="h-4 w-4" />
                View Patient Profile
              </Link>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Sessions Completed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {episode.sessions_completed}/3
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${(episode.sessions_completed / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Completion Modal */}
      {completingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Session {completingSession.session_number}
                </h2>
                <button
                  onClick={() => setCompletingSession(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Barriers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barriers Identified *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {commonBarriers.map((barrier) => (
                    <label
                      key={barrier}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                        sessionFormData.barriers_identified.includes(barrier)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sessionFormData.barriers_identified.includes(barrier)}
                        onChange={() => toggleBarrier(barrier)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{barrier}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionFormData.customBarrier}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, customBarrier: e.target.value })}
                    placeholder="Add custom barrier..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomBarrier())}
                  />
                  <button
                    type="button"
                    onClick={addCustomBarrier}
                    className="px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {sessionFormData.barriers_identified.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sessionFormData.barriers_identified.map((barrier, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs"
                      >
                        {barrier}
                        <button onClick={() => removeBarrier(barrier)} className="hover:text-red-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Interventions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interventions Provided *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {commonInterventions.map((intervention) => (
                    <label
                      key={intervention}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                        sessionFormData.interventions_provided.includes(intervention)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sessionFormData.interventions_provided.includes(intervention)}
                        onChange={() => toggleIntervention(intervention)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{intervention}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionFormData.customIntervention}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, customIntervention: e.target.value })}
                    placeholder="Add custom intervention..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomIntervention())}
                  />
                  <button
                    type="button"
                    onClick={addCustomIntervention}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {sessionFormData.interventions_provided.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sessionFormData.interventions_provided.map((intervention, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs"
                      >
                        {intervention}
                        <button onClick={() => removeIntervention(intervention)} className="hover:text-green-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Adherence Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adherence Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={sessionFormData.adherence_percentage}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, adherence_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Missed Doses (Last Week)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sessionFormData.missed_doses_last_week}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, missed_doses_last_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Notes
                </label>
                <textarea
                  value={sessionFormData.session_notes}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Follow-up Actions
                </label>
                <textarea
                  value={sessionFormData.follow_up_actions}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, follow_up_actions: e.target.value })}
                  rows={2}
                  placeholder="e.g., Schedule next session in 4 weeks, arrange home visit..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => setCompletingSession(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSession}
                disabled={sessionFormData.barriers_identified.length === 0 || sessionFormData.interventions_provided.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
