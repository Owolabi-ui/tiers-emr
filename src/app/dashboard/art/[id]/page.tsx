'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { artApi, ArtFollowup, ArtInformation, CreateArtFollowupRequest } from '@/lib/art';
import { getErrorMessage } from '@/lib/api';
import { getOrdersByService, LabTestCatalog, LabTestOrderWithDetails, laboratoryApi } from '@/lib/laboratory';
import { DrugCatalog, pharmacyApi, Prescription, getPrescriptionStatusColor } from '@/lib/pharmacy';
import { eacApi, EacEpisode, getEacTriggerColor } from '@/lib/eac';
import {
  ArrowLeft,
  Heart,
  User,
  Calendar,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit,
  FileText,
  FlaskConical,
  Clock,
  Pill,
  UserCircle,
  Plus,
  XCircle,
  X,
} from 'lucide-react';

export default function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [artInfo, setArtInfo] = useState<ArtInformation | null>(null);
  const [labOrders, setLabOrders] = useState<LabTestOrderWithDetails[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [followups, setFollowups] = useState<ArtFollowup[]>([]);
  const [selectedFollowup, setSelectedFollowup] = useState<ArtFollowup | null>(null);
  const [eacEpisodes, setEacEpisodes] = useState<EacEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [catalog, setCatalog] = useState<LabTestCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [labOrderLoading, setLabOrderLoading] = useState(false);
  const [labOrderError, setLabOrderError] = useState<string | null>(null);
  const [labOrderSuccess, setLabOrderSuccess] = useState<string | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [visitSuccess, setVisitSuccess] = useState<string | null>(null);
  const [drugOptions, setDrugOptions] = useState<DrugCatalog[]>([]);
  const [drugLoading, setDrugLoading] = useState(false);
  const [visitForm, setVisitForm] = useState<CreateArtFollowupRequest>({
    patient_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    duration_months: 1,
    weight_kg: undefined,
    height_cm: undefined,
    bp_systolic: undefined,
    bp_diastolic: undefined,
    functional_status: undefined,
    who_clinical_stage: undefined,
    tb_status: undefined,
    other_problems: undefined,
    arv_drug_id: 26,
    cotrimoxazole_dose: undefined,
    inh_dose: undefined,
    other_drugs: undefined,
    order_cd4: false,
    order_vl: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await artApi.getById(id);
        setArtInfo(data);
        setVisitForm((prev) => ({ ...prev, patient_id: data.patient_id }));
        
        // Fetch lab orders for this ART record
        try {
          const orders = await getOrdersByService('ART', id);
          setLabOrders(orders);
        } catch (err) {
          console.error('Failed to fetch lab orders:', err);
          // Don't fail the whole page if lab orders fail
        }

        // Fetch prescriptions for this patient
        try {
          const prescriptionData = await pharmacyApi.listPrescriptions({
            patient_id: data.patient_id,
          });
          setPrescriptions(prescriptionData.data);
        } catch (err) {
          console.error('Failed to fetch prescriptions:', err);
          // Don't fail the whole page if prescriptions fail
        }

        // Fetch ART followups for this patient
        try {
          const followupData = await artApi.getFollowups(data.patient_id);
          setFollowups(followupData);
        } catch (err) {
          console.error('Failed to fetch ART followups:', err);
        }

        // Fetch EAC episodes for this ART patient
        try {
          const eacData = await eacApi.listEpisodes({
            art_id: id,
          });
          setEacEpisodes(eacData.data);
        } catch (err) {
          console.error('Failed to fetch EAC episodes:', err);
          // Don't fail the whole page if EAC episodes fail
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Awaiting First Dispensing
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Active on Treatment
          </span>
        );
      case 'On EAC':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <AlertCircle className="h-4 w-4" />
            On EAC
          </span>
        );
      case 'Transferred Out':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Transferred Out
          </span>
        );
      case 'Deceased':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Deceased
          </span>
        );
      case 'LTFU':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            Lost to Follow-Up
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getLabStatusBadge = (status: string) => {
    switch (status) {
      case 'Ordered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Ordered
          </span>
        );
      case 'Sample Collected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <FlaskConical className="h-3 w-3" />
            Sample Collected
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Loader2 className="h-3 w-3" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const handleOpenLabModal = async () => {
    setShowLabModal(true);
    setSelectedTest('');
    setLabOrderError(null);
    setLabOrderSuccess(null);
    if (catalog.length === 0) {
      try {
        setCatalogLoading(true);
        const res = await laboratoryApi.getCatalog(true);
        setCatalog(res.tests);
      } catch (err) {
        setLabOrderError(getErrorMessage(err));
      } finally {
        setCatalogLoading(false);
      }
    }
  };

  const handleSubmitLabOrder = async () => {
    if (!selectedTest || !artInfo) return;
    try {
      setLabOrderLoading(true);
      setLabOrderError(null);
      await laboratoryApi.createOrder({
        patient_id: artInfo.patient_id,
        test_id: selectedTest,
        service_type: 'ART',
        service_record_id: artInfo.id,
        priority: 'Routine',
        clinical_indication: 'ART monitoring',
      });
      setLabOrderSuccess('Lab test ordered successfully.');
      const orders = await getOrdersByService('ART', id);
      setLabOrders(orders);
      setTimeout(() => {
        setShowLabModal(false);
        setLabOrderSuccess(null);
      }, 1500);
    } catch (err) {
      setLabOrderError(getErrorMessage(err));
    } finally {
      setLabOrderLoading(false);
    }
  };

  const openVisitModal = async () => {
    setShowVisitModal(true);
    setVisitError(null);
    setVisitSuccess(null);
    setVisitForm((prev) => ({
      ...prev,
      patient_id: artInfo?.patient_id ?? prev.patient_id,
      visit_date: new Date().toISOString().split('T')[0],
    }));

    if (drugOptions.length === 0) {
      try {
        setDrugLoading(true);
        const res = await pharmacyApi.getDrugs({ active_only: true });
        const arvDrugs = res.drugs.filter((d) => d.commodity_type.toUpperCase() === 'ARV');
        setDrugOptions(res.drugs);
        if (arvDrugs.length > 0) {
          setVisitForm((p) => {
            const hasValidCurrent = arvDrugs.some((d) => d.id === p.arv_drug_id);
            return hasValidCurrent ? p : { ...p, arv_drug_id: arvDrugs[0].id };
          });
        }
      } catch (err) {
        setVisitError(getErrorMessage(err));
      } finally {
        setDrugLoading(false);
      }
    }
  };

  const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSaveVisit = async () => {
    if (!artInfo) return;
    try {
      setVisitSaving(true);
      setVisitError(null);
      const payload: CreateArtFollowupRequest = {
        ...visitForm,
        patient_id: artInfo.patient_id,
      };
      const res = await artApi.createFollowup(payload);
      setVisitSuccess(`Visit recorded. Prescription: ${res.prescription_number}`);

      const [nextFollowups, nextPrescriptions, nextLabOrders] = await Promise.all([
        artApi.getFollowups(artInfo.patient_id),
        pharmacyApi.listPrescriptions({ patient_id: artInfo.patient_id }),
        getOrdersByService('ART', id),
      ]);

      setFollowups(nextFollowups);
      setPrescriptions(nextPrescriptions.data);
      setLabOrders(nextLabOrders);

      setTimeout(() => {
        setShowVisitModal(false);
        setVisitSuccess(null);
      }, 1400);
    } catch (err) {
      setVisitError(getErrorMessage(err));
    } finally {
      setVisitSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#065f46] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading ART information...</p>
        </div>
      </div>
    );
  }

  if (error || !artInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-lg font-medium text-red-800 dark:text-red-300">
                Error loading ART information
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error || 'ART record not found'}
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
    <>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {artInfo.patient_name}
              </h1>
              {getStatusBadge(artInfo.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Hospital No: {artInfo.patient_hospital_no}</span>
              <span>•</span>
              <span className="font-mono">ART No: {artInfo.art_no}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openVisitModal}
            className="px-4 py-2 rounded-lg border border-[#065f46] text-[#065f46] text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Visit
          </button>
          <button
            onClick={handleOpenLabModal}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Order Lab Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* ART Client Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#065f46]" />
              ART Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ART Number</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 font-mono">
                  {artInfo.art_no}
                </p>
              </div>
              {artInfo.next_appointment_date && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Next Appointment</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(artInfo.next_appointment_date).toLocaleDateString()}
                    {new Date(artInfo.next_appointment_date) < new Date() && (
                      <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-normal">
                        ({Math.floor((new Date().getTime() - new Date(artInfo.next_appointment_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date Confirmed HIV Positive</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(artInfo.date_confirmed_hiv_positive).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date Enrolled into HIV Care</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(artInfo.date_enrolled_into_hiv_care).toLocaleDateString()}
                </p>
              </div>
              {artInfo.mode_of_hiv_test && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mode of HIV Test</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {artInfo.mode_of_hiv_test}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Entry Point</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {artInfo.entry_point}
                </p>
              </div>
              {artInfo.where_test_was_done && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Where Test Was Done</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {artInfo.where_test_was_done}
                  </p>
                </div>
              )}
              {artInfo.prior_art && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prior ART</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {artInfo.prior_art}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Adherence Counseling (EAC) */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-[#065f46]" />
                Enhanced Adherence Counseling
              </h2>
              <Link
                href={`/dashboard/eac/new?patient_id=${artInfo.patient_id}&art_id=${id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors"
              >
                <AlertCircle className="h-3 w-3" />
                Initiate EAC
              </Link>
            </div>
            {eacEpisodes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No EAC episodes recorded</p>
            ) : (
              <div className="space-y-3">
                {eacEpisodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEacTriggerColor(episode.trigger_reason)}`}>
                          {episode.trigger_reason}
                        </span>
                        {episode.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started {new Date(episode.start_date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{episode.sessions_completed}/3 sessions completed</span>
                        {episode.baseline_viral_load && (
                          <>
                            <span>•</span>
                            <span>Baseline VL: {episode.baseline_viral_load.toLocaleString()} copies/mL</span>
                          </>
                        )}
                      </div>
                      {episode.trigger_details && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{episode.trigger_details}</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/eac/${episode.id}`}
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#065f46] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Pill className="h-5 w-5 text-[#065f46]" />
                Prescriptions
              </h2>
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {prescription.prescription_number}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPrescriptionStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(prescription.prescribed_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{prescription.items.length} medication{prescription.items.length !== 1 ? 's' : ''}</span>
                        {prescription.diagnosis && (
                          <>
                            <span>•</span>
                            <span>{prescription.diagnosis}</span>
                          </>
                        )}
                      </div>
                      {prescription.status === 'Pending' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <Clock className="h-3 w-3" />
                          <span>Awaiting pharmacy dispensing</span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/pharmacy/${prescription.id}`}
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#065f46] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visit History */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#065f46]" />
              Visit History
            </h2>
            {followups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No follow-up visits recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                      <th className="pb-2 pr-4">Visit Date</th>
                      <th className="pb-2 pr-4">Duration (Months)</th>
                      <th className="pb-2 pr-4">WHO Stage</th>
                      <th className="pb-2">Functional Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {followups.map((f) => (
                      <tr
                        key={f.id}
                        className="cursor-pointer hover:bg-green-50/40 dark:hover:bg-green-900/10"
                        onClick={() => setSelectedFollowup(f)}
                      >
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {new Date(f.visit_date).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                          {f.duration_months_on_art ?? '-'}
                        </td>
                        <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                          {f.who_clinical_stage ?? '-'}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {f.functional_status ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Viral Load Testing Status */}
          {labOrders.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-[#065f46]" />
                Laboratory Testing
              </h2>
              <div className="space-y-3">
                {labOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.test_info.test_name}
                        </p>
                        {getLabStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{order.order_number}</span>
                        {order.clinical_indication && (
                          <>
                            <span>•</span>
                            <span>{order.clinical_indication}</span>
                          </>
                        )}
                      </div>
                      {order.result_value && (
                        <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Result</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.result_value} {order.result_unit}
                            {order.result_interpretation && (
                              <span className="ml-2 text-gray-500">({order.result_interpretation})</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/laboratory/${order.id}`}
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#065f46] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next of Kin Information */}
          {(artInfo.name_of_next_of_kin || artInfo.relationship_with_next_of_kin || artInfo.phone_no_of_next_of_kin) && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-[#065f46]" />
                Next of Kin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artInfo.name_of_next_of_kin && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {artInfo.name_of_next_of_kin}
                    </p>
                  </div>
                )}
                {artInfo.relationship_with_next_of_kin && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Relationship</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                      {artInfo.relationship_with_next_of_kin}
                    </p>
                  </div>
                )}
                {artInfo.phone_no_of_next_of_kin && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {artInfo.phone_no_of_next_of_kin}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#065f46]" />
              Patient Information
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View complete patient demographics and medical history
                </p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-2">
                  Patient ID: {artInfo.patient_id}
                </p>
              </div>
              <Link
                href={`/dashboard/patients/${artInfo.patient_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                View Patient Profile
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
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
                href={`/dashboard/art/${id}/edit`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Information
              </Link>
              <Link
                href={`/dashboard/patients/${artInfo.patient_id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <User className="h-4 w-4" />
                View Patient Profile
              </Link>
              <Link
                href={`/dashboard/pharmacy/prescriptions/new?patient_id=${artInfo.patient_id}&source=ART&source_id=${id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#065f46] hover:bg-[#064e3b] rounded-lg transition-colors"
              >
                <Pill className="h-4 w-4" />
                Prescribe Medication
              </Link>
              <Link
                href={`/dashboard/patients/${artInfo.patient_id}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg"
              >
                <FileText className="h-4 w-4" />
                View Medical Records
              </Link>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ART Enrollment
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(artInfo.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Patient enrolled in ART program
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    HIV Diagnosis Confirmed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(artInfo.date_confirmed_hiv_positive).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {artInfo.updated_at !== artInfo.created_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Information Updated
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(artInfo.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ART Information */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium">Lifelong Treatment</p>
                <p className="mt-1">
                  ART is a lifelong commitment. Regular adherence monitoring and viral load testing 
                  are essential for treatment success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      {showLabModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full border border-black/10 dark:border-white/15">
          <div className="bg-[#065f46] px-5 py-3 flex items-center justify-between rounded-t-xl">
            <h3 className="font-semibold text-white">Order Lab Test</h3>
            <button onClick={() => setShowLabModal(false)} className="text-white hover:text-gray-200">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {catalogLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[#065f46]" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Test <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#065f46]/50"
                >
                  <option value="">Choose a test...</option>
                  {catalog.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.test_name} ({test.test_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {labOrderError && (
              <p className="text-sm text-red-600">{labOrderError}</p>
            )}
            {labOrderSuccess && (
              <p className="text-sm text-green-600">{labOrderSuccess}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLabModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitLabOrder}
                disabled={!selectedTest || labOrderLoading}
                className="px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-medium hover:bg-[#064e3b] disabled:opacity-50 flex items-center gap-2"
              >
                {labOrderLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Order Test
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-3xl border border-black/10 dark:border-white/15 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#065f46] px-5 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="font-semibold text-white">Record ART Follow-up Visit</h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="text-white hover:text-gray-200"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Visit */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Visit</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Visit Date</label>
                    <input
                      type="date"
                      value={visitForm.visit_date}
                      onChange={(e) => setVisitForm((p) => ({ ...p, visit_date: e.target.value }))}
                      className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Duration (Months)</label>
                    <select
                      value={visitForm.duration_months ?? 1}
                      onChange={(e) =>
                        setVisitForm((p) => ({ ...p, duration_months: Number(e.target.value) || 1 }))
                      }
                      className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                    >
                      {[1, 2, 3].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vitals (Optional)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Weight (kg)"
                    value={visitForm.weight_kg ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, weight_kg: parseOptionalNumber(e.target.value) }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Height (cm)"
                    value={visitForm.height_cm ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, height_cm: parseOptionalNumber(e.target.value) }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  />
                  <input
                    type="number"
                    step="1"
                    placeholder="BP Systolic"
                    value={visitForm.bp_systolic ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, bp_systolic: parseOptionalNumber(e.target.value) }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  />
                  <input
                    type="number"
                    step="1"
                    placeholder="BP Diastolic"
                    value={visitForm.bp_diastolic ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, bp_diastolic: parseOptionalNumber(e.target.value) }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              {/* Clinical */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Clinical</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={visitForm.functional_status ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, functional_status: e.target.value || undefined }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  >
                    <option value="">Functional Status</option>
                    <option value="Working">Working</option>
                    <option value="Ambulatory">Ambulatory</option>
                    <option value="Bedridden">Bedridden</option>
                  </select>
                  <select
                    value={visitForm.who_clinical_stage ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, who_clinical_stage: e.target.value || undefined }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  >
                    <option value="">WHO Clinical Stage</option>
                    <option value="Stage 1">Stage 1</option>
                    <option value="Stage 2">Stage 2</option>
                    <option value="Stage 3">Stage 3</option>
                    <option value="Stage 4">Stage 4</option>
                  </select>
                  <select
                    value={visitForm.tb_status ?? ''}
                    onChange={(e) => setVisitForm((p) => ({ ...p, tb_status: e.target.value || undefined }))}
                    className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                  >
                    <option value="">TB Status</option>
                    <option value="No TB">No TB</option>
                    <option value="On TB Treatment">On TB Treatment</option>
                    <option value="TB Suspect">TB Suspect</option>
                  </select>
                </div>
                <textarea
                  placeholder="Other problems"
                  value={visitForm.other_problems ?? ''}
                  onChange={(e) => setVisitForm((p) => ({ ...p, other_problems: e.target.value || undefined }))}
                  className="mt-3 w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800"
                  rows={3}
                />
              </div>

              {/* Medication */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Medication</h4>
                {drugLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading drug catalog...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={visitForm.arv_drug_id}
                      onChange={(e) => setVisitForm((p) => ({ ...p, arv_drug_id: Number(e.target.value) }))}
                      className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                    >
                      {drugOptions
                        .filter((d) => d.commodity_type.toUpperCase() === 'ARV')
                        .map((drug) => (
                          <option key={drug.id} value={drug.id}>
                            {drug.commodity_name} ({drug.commodity_id})
                          </option>
                        ))}
                    </select>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Cotrimoxazole dose (optional)"
                        value={visitForm.cotrimoxazole_dose ?? ''}
                        onChange={(e) => setVisitForm((p) => ({ ...p, cotrimoxazole_dose: e.target.value || undefined }))}
                        className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                      />
                      <input
                        type="text"
                        placeholder="INH dose (optional)"
                        value={visitForm.inh_dose ?? ''}
                        onChange={(e) => setVisitForm((p) => ({ ...p, inh_dose: e.target.value || undefined }))}
                        className="w-full h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <textarea
                      placeholder="Other drugs (optional)"
                      value={visitForm.other_drugs ?? ''}
                      onChange={(e) => setVisitForm((p) => ({ ...p, other_drugs: e.target.value || undefined }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Labs */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Labs</h4>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={visitForm.order_cd4}
                      onChange={(e) => setVisitForm((p) => ({ ...p, order_cd4: e.target.checked }))}
                    />
                    Order CD4
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={visitForm.order_vl}
                      onChange={(e) => setVisitForm((p) => ({ ...p, order_vl: e.target.checked }))}
                    />
                    Order Viral Load
                  </label>
                </div>
              </div>

              {visitError && <p className="text-sm text-red-600">{visitError}</p>}
              {visitSuccess && <p className="text-sm text-green-600">{visitSuccess}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVisit}
                  disabled={visitSaving || !visitForm.visit_date || !visitForm.arv_drug_id}
                  className="px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-medium hover:bg-[#064e3b] disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {visitSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedFollowup(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-neutral-900 shadow-xl flex flex-col">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Follow-up Details</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedFollowup.visit_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedFollowup(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">WHO Stage</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.who_clinical_stage ?? '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Functional Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.functional_status ?? '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">TB Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.tb_status ?? '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Duration on ART (months)</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.duration_months_on_art ?? '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Cotrimoxazole Dose</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.cotrimoxazole_dose ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">INH Dose</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFollowup.inh_dose ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Other Drugs</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{selectedFollowup.other_drugs ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Other Problems</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{selectedFollowup.other_problems ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Recorded At</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedFollowup.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
