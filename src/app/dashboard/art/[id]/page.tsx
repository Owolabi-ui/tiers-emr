'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { artApi, ArtInformation } from '@/lib/art';
import { getErrorMessage } from '@/lib/api';
import { getOrdersByService, LabTestOrderWithDetails } from '@/lib/laboratory';
import { pharmacyApi, Prescription, getPrescriptionStatusColor } from '@/lib/pharmacy';
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
} from 'lucide-react';

export default function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [artInfo, setArtInfo] = useState<ArtInformation | null>(null);
  const [labOrders, setLabOrders] = useState<LabTestOrderWithDetails[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [eacEpisodes, setEacEpisodes] = useState<EacEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await artApi.getById(id);
        setArtInfo(data);
        
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* ART Client Information */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#5b21b6]" />
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
                <UserCircle className="h-5 w-5 text-[#5b21b6]" />
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
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#5b21b6] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
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
                <Pill className="h-5 w-5 text-[#5b21b6]" />
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
                      href={`/dashboard/pharmacy/prescriptions/${prescription.id}`}
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#5b21b6] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viral Load Testing Status */}
          {labOrders.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-[#5b21b6]" />
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
                      href={`/dashboard/lab/orders/${order.id}`}
                      className="ml-4 px-3 py-1.5 text-xs font-medium text-[#5b21b6] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
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
                <User className="h-5 w-5 text-[#5b21b6]" />
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
              <User className="h-5 w-5 text-[#5b21b6]" />
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
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5b21b6] hover:bg-[#4c1d95] rounded-lg transition-colors"
              >
                <Pill className="h-4 w-4" />
                Prescribe Medication
              </Link>
              <Link
                href={`/dashboard/fileText/${artInfo.patient_id}`}
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
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
  );
}
