'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Loader2, AlertCircle } from 'lucide-react';
import { clinicsApi, Clinic, getFacilityTypeLabel, getLevelOfCareLabel } from '@/lib/clinics';
import { getErrorMessage } from '@/lib/api';

export default function ClinicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params?.id as string;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClinic = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clinicsApi.getById(clinicId);
        setClinic(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      loadClinic();
    }
  }, [clinicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-7 w-7 animate-spin text-[#065f46]" />
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error || 'Clinic not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/clinics"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clinics
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clinic.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-mono">{clinic.facility_code}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              clinic.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {clinic.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={<Building2 className="h-4 w-4 text-[#065f46]" />} label="Facility Type" value={getFacilityTypeLabel(clinic.facility_type)} />
        <InfoCard icon={<Building2 className="h-4 w-4 text-[#065f46]" />} label="Level of Care" value={getLevelOfCareLabel(clinic.level_of_care)} />
        <InfoCard icon={<MapPin className="h-4 w-4 text-[#065f46]" />} label="Address" value={clinic.address || 'N/A'} />
        <InfoCard icon={<MapPin className="h-4 w-4 text-[#065f46]" />} label="Location" value={[clinic.region, clinic.district, clinic.country].filter(Boolean).join(', ') || 'N/A'} />
        <InfoCard icon={<Phone className="h-4 w-4 text-[#065f46]" />} label="Phone" value={clinic.phone || 'N/A'} />
        <InfoCard icon={<Mail className="h-4 w-4 text-[#065f46]" />} label="Email" value={clinic.email || 'N/A'} />
        <InfoCard icon={<Globe className="h-4 w-4 text-[#065f46]" />} label="Website" value={clinic.website || 'N/A'} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Services Provided</h2>
        <div className="flex flex-wrap gap-2">
          <ServiceBadge label="HIV Services" enabled={clinic.provides_hiv_services} />
          <ServiceBadge label="TB Services" enabled={clinic.provides_tb_services} />
          <ServiceBadge label="Malaria Services" enabled={clinic.provides_malaria_services} />
          <ServiceBadge label="Maternal Health" enabled={clinic.provides_maternal_health} />
          <ServiceBadge label="Laboratory" enabled={clinic.provides_laboratory} />
          <ServiceBadge label="Pharmacy" enabled={clinic.provides_pharmacy} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ServiceBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${
        enabled
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {label}
    </span>
  );
}
