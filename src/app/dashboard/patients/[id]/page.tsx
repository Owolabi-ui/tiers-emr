'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  patientsApi,
  Patient,
  PatientDetails,
  getPatientFullName,
  formatPatientAge,
  formatDate,
  ServiceType,
} from '@/lib/patients';
import { getErrorMessage } from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Heart,
  Shield,
  Activity,
  Brain,
  Loader2,
  AlertCircle,
  UserPlus,
  Fingerprint,
} from 'lucide-react';
import PatientFingerprintCapture from '@/components/PatientFingerprintCapture';

const serviceIcons: Record<ServiceType, React.ElementType> = {
  PREP: Shield,
  PEP: Shield,
  ART: Heart,
  'Mental Health': Brain,
};

const serviceColors: Record<ServiceType, string> = {
  PREP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PEP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ART: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Mental Health': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFingerprintCapture, setShowFingerprintCapture] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const [patientData, detailsData] = await Promise.all([
          patientsApi.getById(patientId),
          patientsApi.getDetails(patientId),
        ]);
        setPatient(patientData);
        setDetails(detailsData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await patientsApi.delete(patientId);
      router.push('/dashboard/patients');
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const refreshPatientDetails = async () => {
    try {
      const [patientData, detailsData] = await Promise.all([
        patientsApi.getById(patientId),
        patientsApi.getDetails(patientId),
      ]);
      setPatient(patientData);
      setDetails(detailsData);
    } catch (err) {
      console.error('Failed to refresh patient details:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading patient
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error || 'Patient not found'}
              </p>
              <Link
                href="/dashboard/patients"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#5b21b6] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to patients
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/patients"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5b21b6]">{getPatientFullName(patient)}</h1>
            <p className="text-sm text-gray-500">
              Hospital No: <span className="font-mono">{patient.hospital_no}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFingerprintCapture(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Fingerprint className="h-4 w-4" />
            Add Fingerprint
          </button>
          <Link
            href={`/dashboard/patients/${patientId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <User className="h-4 w-4" />
            Sex
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{patient.sex}</p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            Age
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{formatPatientAge(patient)}</p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Activity className="h-4 w-4" />
            Status
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {patient.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-purple-50/40 dark:bg-[#5b21b6]/10 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            Registered
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatDate(patient.created_at)}
          </p>
        </div>
      </div>

      {/* Services Enrolled */}
      {details && details.services.length > 0 && (
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Enrolled Services</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {details.services.map((service) => {
                const Icon = serviceIcons[service] || Activity;
                return (
                  <span
                    key={service}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${serviceColors[service]}`}
                  >
                    <Icon className="h-4 w-4" />
                    {service}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <User className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Personal Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <InfoRow label="Full Name" value={getPatientFullName(patient)} />
            {patient.preferred_name && (
              <InfoRow label="Preferred Name" value={patient.preferred_name} />
            )}
            <InfoRow label="Sex" value={patient.sex} />
            {patient.gender && <InfoRow label="Gender Identity" value={patient.gender} />}
            <InfoRow label="Date of Birth" value={formatDate(patient.date_of_birth)} />
            {patient.marital_status && (
              <InfoRow label="Marital Status" value={patient.marital_status} />
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Phone className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Contact Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <InfoRow
              label="Phone"
              value={patient.phone_number}
              icon={<Phone className="h-4 w-4" />}
            />
            {patient.alternate_phone && (
              <InfoRow
                label="Alternate Phone"
                value={patient.alternate_phone}
                icon={<Phone className="h-4 w-4" />}
              />
            )}
            <InfoRow label="Email" value={patient.email} icon={<Mail className="h-4 w-4" />} />
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Address</h2>
          </div>
          <div className="p-5 space-y-4">
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="City" value={patient.city} />
            {/* State and LGA would need to be fetched and displayed by name */}
          </div>
        </div>

        {/* Education & Occupation */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Education & Occupation</h2>
          </div>
          <div className="p-5 space-y-4">
            <InfoRow label="Education" value={patient.educational_level} />
            <InfoRow label="Occupation" value={patient.occupation} />
            {patient.occupation_details && (
              <InfoRow label="Occupation Details" value={patient.occupation_details} />
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-white" />
            <h2 className="font-semibold text-white">Emergency Contact</h2>
          </div>
          <div className="p-5 space-y-4">
            <InfoRow label="Name" value={patient.emergency_contact_name} />
            <InfoRow label="Relationship" value={patient.emergency_contact_relationship} />
            <InfoRow label="Phone" value={patient.emergency_contact_phone} />
          </div>
        </div>

        {/* Biometrics */}
        {details && details.biometrics.length > 0 && (
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="bg-[#5b21b6] px-5 py-3 flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Biometrics</h2>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {details.biometrics.map((bio) => (
                  <div
                    key={bio.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {bio.biometric_type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        bio.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {bio.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fingerprint Capture Modal */}
      {showFingerprintCapture && (
        <PatientFingerprintCapture
          patientId={patientId}
          onSuccess={() => {
            setShowFingerprintCapture(false);
            refreshPatientDetails(); // Refresh to show new fingerprint
          }}
          onCancel={() => setShowFingerprintCapture(false)}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-500 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
        {value || '-'}
      </span>
    </div>
  );
}
