'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { psychologyApi, TherapyGoal, CreateGoalRequest, UpdateGoalRequest, goalStatusOptions } from '@/lib/psychology';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Target,
  Plus,
  Check,
  X,
  Calendar,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

export default function TherapyGoalsPage() {
  const params = useParams();
  const patientId = params?.patientId as string;
  
  const [goals, setGoals] = useState<TherapyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const [newGoal, setNewGoal] = useState<CreateGoalRequest>({
    patient_id: patientId,
    goal_description: '',
    target_date: '',
  });

  useEffect(() => {
    fetchGoals();
  }, [patientId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await psychologyApi.getPatientGoals(patientId);
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await psychologyApi.createGoal(newGoal);
      setNewGoal({ patient_id: patientId, goal_description: '', target_date: '' });
      setShowNewForm(false);
      fetchGoals();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateGoal = async (goalId: string, data: UpdateGoalRequest) => {
    try {
      await psychologyApi.updateGoal(goalId, data);
      setEditingGoal(null);
      fetchGoals();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMarkAchieved = async (goalId: string) => {
    try {
      await psychologyApi.updateGoal(goalId, {
        status: 'Achieved',
        achieved_date: new Date().toISOString().split('T')[0],
      });
      fetchGoals();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/psychology/patients/${patientId}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Target className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              Therapy Goals
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set and track therapeutic goals
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* New Goal Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Therapy Goal</h2>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Description *
              </label>
              <textarea
                value={newGoal.goal_description}
                onChange={(e) => setNewGoal({ ...newGoal, goal_description: e.target.value })}
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
                placeholder="e.g., Reduce anxiety symptoms by practicing daily mindfulness for 10 minutes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={newGoal.target_date || ''}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNewGoal({ patient_id: patientId, goal_description: '', target_date: '' });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 gap-4">
        {goals.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Target className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Therapy Goals
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start setting therapeutic goals to track patient progress.
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      goal.status === 'Achieved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      goal.status === 'Discontinued' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {goal.status}
                    </span>
                    {goal.target_date && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{goal.goal_description}</p>
                  {goal.progress_notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <strong>Progress:</strong> {goal.progress_notes}
                    </p>
                  )}
                  {goal.achieved_date && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Achieved on {new Date(goal.achieved_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {goal.status !== 'Achieved' && (
                    <button
                      onClick={() => handleMarkAchieved(goal.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                      title="Mark as achieved"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingGoal(editingGoal === goal.id ? null : goal.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingGoal === goal.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      defaultValue={goal.status}
                      onChange={(e) => handleUpdateGoal(goal.id, { status: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
                    >
                      {goalStatusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Progress Notes
                    </label>
                    <textarea
                      defaultValue={goal.progress_notes || ''}
                      onBlur={(e) => {
                        if (e.target.value !== goal.progress_notes) {
                          handleUpdateGoal(goal.id, { progress_notes: e.target.value });
                        }
                      }}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-neutral-900 dark:text-white"
                      placeholder="Document progress towards this goal..."
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(goal.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
