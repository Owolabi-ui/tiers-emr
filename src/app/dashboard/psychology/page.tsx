'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { psychologyApi, CounselingSession, TherapyGoal } from '@/lib/psychology';
import { patientsApi, Patient } from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import { GenerateIntakeLinkModal } from '@/components/generate-intake-link-modal';
import {
  Brain,
  Plus,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Target,
  Activity,
  Clock,
  Search,
  ClipboardList,
  QrCode,
  Send,
} from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  activeGoals: number;
  recentAssessments: number;
}

export default function PsychologyPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [goals, setGoals] = useState<TherapyGoal[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ totalSessions: 0, activeGoals: 0, recentAssessments: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredPatients([]);
        return;
      }

      // Search patients
      searchPatients(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchPatients = async (query: string) => {
    if (query.trim().length < 2) {
      setFilteredPatients([]);
      return;
    }

    try {
      setSearchLoading(true);
      
      console.log('[Psychology] Searching for:', query);
      
      // Use the search endpoint with the query
      const result = await patientsApi.search({
        search: query,
        page: 1,
        page_size: 10,
      });
      
      console.log('[Psychology] Search result:', result);
      console.log('[Psychology] Patients found:', result.data?.length || 0);
      
      setFilteredPatients(result.data || result.patients || []);
    } catch (err) {
      console.error('[Psychology] Error searching patients:', err);
      // Don't show error for search, just clear results
      setFilteredPatients([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setSearchQuery('');
    setFilteredPatients([]);
    router.push(`/dashboard/psychology/patients/${patientId}`);
  };

  const handleSendIntake = (patient: { id: string; name: string }) => {
    setSelectedPatient(patient);
    setShowIntakeModal(true);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Mental Health
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mental health assessments, counseling sessions, and therapy goals
          </p>
        </div>
      </div>

      {/* Patient Search */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Patient
          </h2>
        </div>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, hospital number, or phone number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-indigo-600" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {filteredPatients.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="w-full px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => handlePatientSelect(patient.id)}
                      className="flex-1 text-left hover:opacity-70"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {patient.hospital_no && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Hospital No: {patient.hospital_no}
                          </p>
                        )}
                        {patient.phone_number && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {patient.phone_number}
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {patient.gender} • {patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : '?'} yrs
                      </div>
                      <button
                        onClick={() => handleSendIntake({ 
                          id: patient.id, 
                          name: `${patient.first_name} ${patient.last_name}` 
                        })}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center gap-2 transition-colors"
                        title="Send Intake Form"
                      >
                        <Send className="h-4 w-4" />
                        Send Intake
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {searchQuery && filteredPatients.length === 0 && !searchLoading && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No patients found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 dark:bg-indigo-500 p-3 rounded-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                PHQ-9 Depression Screening
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Assess depression severity with the 9-item questionnaire
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Search for a patient above to begin assessment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 dark:bg-purple-500 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                GAD-7 Anxiety Screening
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Evaluate anxiety levels with the 7-item scale
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Search for a patient above to begin assessment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Counseling Session
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Document therapy sessions and interventions
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Search for a patient above to create session
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalSessions}
              </p>
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Goals
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.activeGoals}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Assessments (30d)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.recentAssessments}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Patients in System
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                -
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Use search above
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              For Patients:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Use the search bar above to find a patient</li>
              <li>Click on the patient to view their mental health profile</li>
              <li>From the patient profile, you can:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Conduct PHQ-9 depression screening</li>
                  <li>Conduct GAD-7 anxiety screening</li>
                  <li>Create counseling session notes</li>
                  <li>Manage therapy goals</li>
                  <li>View assessment history</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Available Assessment Tools:
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">•</span>
                <span><strong>PHQ-9:</strong> Patient Health Questionnaire - Depression severity (0-27 scale)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400">•</span>
                <span><strong>GAD-7:</strong> Generalized Anxiety Disorder assessment (0-21 scale)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span><strong>AUDIT-C:</strong> Alcohol Use Disorders Identification Test (coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Intake Modal */}
      {showIntakeModal && selectedPatient && (
        <GenerateIntakeLinkModal
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          onClose={() => {
            setShowIntakeModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            // Could show a success message or refresh data
          }}
        />
      )}
    </div>
  );
}
