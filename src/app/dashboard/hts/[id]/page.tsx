"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, User, CheckCircle, XCircle, Edit } from "lucide-react";
import { htsApi, CompleteHtsWorkflow } from "@/lib/hts";
import { getOrdersByService, LabTestOrderWithDetails, LabResultData } from "@/lib/laboratory";
import PrintablePageWrapper from "@/components/common/PrintablePageWrapper";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import PrintSection from "@/components/common/PrintSection";

// Type helper for dynamic property access
type PreTestRecord = Record<string, any>;
const isTrue = (value: unknown): value is true => value === true;

export default function HtsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [htsData, setHtsData] = useState<CompleteHtsWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labOrders, setLabOrders] = useState<LabTestOrderWithDetails[]>([]);
  const [navigating, setNavigating] = useState<"prep" | "pep" | null>(null);

  useEffect(() => {
    const fetchHtsData = async () => {
      try {
        const [htsResponse, ordersResponse] = await Promise.allSettled([
          htsApi.getComplete(id),
          getOrdersByService("HTS", id),
        ]);

        if (htsResponse.status === "rejected") {
          throw htsResponse.reason;
        }

        const data = htsResponse.value;
        setHtsData(data);

        if (ordersResponse.status === "fulfilled") {
          setLabOrders(ordersResponse.value || []);
        } else {
          // Do not fail HTS details page if lab orders cannot be fetched
          console.warn("Failed to load HTS-linked lab orders:", ordersResponse.reason);
        }
      } catch (err: any) {
        console.error("Error fetching HTS data:", err);
        setError(err.message || "Failed to load HTS record");
      } finally {
        setLoading(false);
      }
    };

    fetchHtsData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HTS record...</p>
        </div>
      </div>
    );
  }

  if (error || !htsData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "HTS record not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const preTest = htsData.pre_test;
  const knowledgeScoreItems = preTest
    ? {
        score1: [
          { key: "previously_tested_negative", label: "Previously tested negative" },
          { key: "informed_hiv_transmission", label: "Informed about HIV transmission" },
          { key: "informed_risk_factors", label: "Informed about risk factors" },
          { key: "informed_prevention_methods", label: "Informed about prevention methods" },
          { key: "informed_test_results", label: "Informed about test results" },
          { key: "consent_given", label: "Consent given for testing" },
          { key: "used_drugs_sexual_performance", label: "Used drugs for sexual performance" },
        ],
        score2: [
          { key: "transmission_sexual_intercourse", label: "Transmission: Sexual intercourse" },
          { key: "transmission_blood_transfusion", label: "Transmission: Blood transfusion" },
          { key: "transmission_mother_to_child", label: "Transmission: Mother to child" },
          { key: "transmission_sharing_toilet", label: "Transmission: Sharing toilet" },
          { key: "transmission_sharp_objects", label: "Transmission: Sharp objects" },
          { key: "transmission_eating_utensils", label: "Transmission: Eating utensils" },
          { key: "transmission_mosquito_bites", label: "Transmission: Mosquito bites" },
          { key: "transmission_kissing", label: "Transmission: Kissing" },
          { key: "transmission_hugging", label: "Transmission: Hugging" },
        ],
        score3: [
          { key: "prevention_faithful_partner", label: "Prevention: Faithful partner" },
          { key: "prevention_condom_use", label: "Prevention: Condom use" },
          { key: "prevention_abstinence", label: "Prevention: Abstinence" },
          { key: "prevention_delay_sexual_debut", label: "Prevention: Delay sexual debut" },
          { key: "prevention_reduce_partners", label: "Prevention: Reduce partners" },
          { key: "prevention_avoid_risky_partners", label: "Prevention: Avoid risky partners" },
          { key: "prevention_avoid_sharp_objects", label: "Prevention: Avoid sharp objects" },
          { key: "prevention_healthy_looking_can_have_hiv", label: "Prevention: Healthy-looking can have HIV" },
        ],
      }
    : null;

  const hivRiskItems = preTest
    ? [
        { key: "risk_unprotected_anal_sex", label: "Unprotected anal sex", points: 3 },
        { key: "risk_sharing_needles", label: "Sharing needles", points: 3 },
        { key: "risk_been_paid_for_sex", label: "Been paid for sex", points: 3 },
        { key: "risk_unprotected_vaginal_sex", label: "Unprotected vaginal sex", points: 2 },
        { key: "risk_multiple_partners", label: "Multiple partners", points: 2 },
        { key: "risk_sti", label: "Recent STI", points: 2 },
        { key: "risk_paid_for_sex", label: "Paid for sex", points: 2 },
        { key: "risk_sexual_orgy", label: "Sexual orgy", points: 2 },
        { key: "risk_blood_transfusion", label: "Blood transfusion", points: 1 },
        { key: "risk_sex_under_influence", label: "Sex under influence", points: 1 },
        { key: "risk_condom_breakage", label: "Condom breakage", points: 1 },
        { key: "risk_anal_sex", label: "Anal sex", points: 1 },
        { key: "risk_vaginal_sex", label: "Vaginal sex", points: 1 },
      ]
    : null;

  const partnerRiskItems = preTest
    ? [
        { key: "partner_hiv_positive", label: "Partner HIV positive", points: 3 },
        { key: "partner_injects_drugs", label: "Partner injects drugs", points: 3 },
        { key: "partner_newly_diagnosed_on_treatment", label: "Partner newly diagnosed on treatment", points: 2 },
        { key: "partner_returned_after_ltfu", label: "Partner returned after LTFU", points: 2 },
        { key: "partner_has_sex_with_men", label: "Partner has sex with men", points: 2 },
        { key: "partner_adolescent_hiv_positive", label: "Partner adolescent HIV positive", points: 2 },
        { key: "partner_on_arv_suppressed_vl", label: "Partner on ARV suppressed VL", points: 1 },
        { key: "partner_pregnant_on_arv", label: "Partner pregnant on ARV", points: 1 },
        { key: "partner_transgender", label: "Partner transgender", points: 1 },
      ]
    : null;

  const stiRiskItems = preTest
    ? [
        { key: "sti_urethral_discharge", label: "Urethral discharge", points: 1 },
        { key: "sti_scrotal_swelling", label: "Scrotal swelling", points: 1 },
        { key: "sti_genital_sore", label: "Genital sore", points: 1 },
        { key: "sti_anal_pain", label: "Anal pain", points: 1 },
        { key: "sti_anal_discharge", label: "Anal discharge", points: 1 },
        { key: "sti_anal_itching", label: "Anal itching", points: 1 },
      ]
    : null;

  const sumPoints = (items: { key: string; points: number }[]) =>
    items.reduce((total, item) => {
      // Assumption: points are awarded when the risk factor is present (true).
      return total + (isTrue((preTest as PreTestRecord)?.[item.key]) ? item.points : 0);
    }, 0);

  const sumKnowledge = (items: { key: string }[]) =>
    items.reduce((total, item) => {
      // Assumption: each checked knowledge item contributes 1 point.
      return total + (isTrue((preTest as PreTestRecord)?.[item.key]) ? 1 : 0);
    }, 0);

  const extractOrderResultText = (order: LabTestOrderWithDetails): string => {
    if (order.result_value) return order.result_value;
    const data = order.result_data as LabResultData | null | undefined;
    if (data && typeof data === "object" && "result" in data && data.result) {
      return data.result;
    }
    if (data && typeof data === "object" && "value" in data && typeof data.value === "number") {
      return `${data.value}${order.result_unit ? ` ${order.result_unit}` : ""}`;
    }
    return "Pending";
  };

  const additionalTestOrders = labOrders.filter((order) => {
    const code = order.test_info?.test_code?.toUpperCase();
    return code !== "HIV_RAPID" && code !== "HIV-RAPID" && code !== "HIV_DNA" && code !== "HIV-DNA";
  });

  const visitDateDisplay = new Date(htsData.initial.date_of_visit).toLocaleDateString();
  const printedDateDisplay = new Date().toLocaleDateString();
  const normalizedFinalResult = htsData.testing?.final_result?.trim().toLowerCase();
  const canInitiatePrep =
    htsData.initial.status === "completed" &&
    (normalizedFinalResult === "non-reactive" || normalizedFinalResult === "non reactive");
  const canInitiatePep =
    htsData.initial.status === "completed" &&
    (normalizedFinalResult === "reactive" || normalizedFinalResult === "positive");
  const handleInitiatePrep = () => {
    setNavigating("prep");
    router.push(`/dashboard/prep/new?patient_id=${htsData.initial.patient_id}&from_hts=${id}`);
  };
  const handleInitiatePep = () => {
    setNavigating("pep");
    router.push(`/dashboard/pep/new?patient_id=${htsData.initial.patient_id}&from_hts=${id}`);
  };

  return (
    <PrintablePageWrapper
      printHeader={
        <PrintHeader
          title="HTS Session Details"
          subtitle={`Client Code: ${htsData.initial.client_code} | Date: ${visitDateDisplay} | Printed: ${printedDateDisplay}`}
        />
      }
    >
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to HTS Records
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HTS Session Details</h1>
              <p className="mt-2 text-sm text-gray-600">
                Client Code: <span className="font-medium">{htsData.initial.client_code}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PrintButton label="Print Record" />
              {canInitiatePrep && (
                <button
                  onClick={handleInitiatePrep}
                  disabled={navigating !== null}
                  title="Enroll patient in Pre-Exposure Prophylaxis program"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {navigating === "prep" ? "Opening..." : "Initiate PrEP"}
                </button>
              )}
              {canInitiatePep && (
                <button
                  onClick={handleInitiatePep}
                  disabled={navigating !== null}
                  title="Start PEP workflow or link patient to HIV care"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {navigating === "pep" ? "Opening..." : "Initiate PEP / Link to Care"}
                </button>
              )}
              {htsData.initial.status !== "completed" && (
                <button
                  onClick={() => router.push(`/dashboard/hts/${id}/continue`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Continue Session
                </button>
              )}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                htsData.initial.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {htsData.initial.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {htsData.initial.status}
              </div>
            </div>
          </div>
        </div>

        {/* Initial Information */}
        <PrintSection className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Initial Information
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Visit</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.date_of_visit}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Target Group</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.target_group_code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.marital_status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type of HTS</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.type_of_hts}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Setting</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.settings}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Testing Modality</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.testing_modality}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Session Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.type_of_session}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Children Under 15</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.num_children_under_15}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Referral Source</dt>
              <dd className="mt-1 text-sm text-gray-900">{htsData.initial.source_of_referral}</dd>
            </div>
          </dl>
        </PrintSection>

        {/* Pre-Test Counseling */}
        {htsData.pre_test && (
          <PrintSection pageBreakBefore className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="print-repeat-header">
              <img src="/images/TIERs-Logo-good.png" alt="TIERS Logo" />
              <p className="print-subtitle">Client Code: {htsData.initial.client_code}</p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pre-Test Counseling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Knowledge Assessment Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {htsData.pre_test.knowledge_score_1 !== null && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Knowledge Score 1</p>
                      <p className="text-lg font-semibold text-gray-900">{htsData.pre_test.knowledge_score_1}</p>
                      {knowledgeScoreItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500">Breakdown (1 point each)</p>
                          {knowledgeScoreItems.score1.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-gray-300 mt-0.5" />
                                )}
                                <span className={checked ? "text-gray-900" : "text-gray-500"}>{item.label}</span>
                                <span className="ml-auto text-gray-400">{checked ? "+1" : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-gray-500">
                            Total: {sumKnowledge(knowledgeScoreItems.score1)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {htsData.pre_test.knowledge_score_2 !== null && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Knowledge Score 2</p>
                      <p className="text-lg font-semibold text-gray-900">{htsData.pre_test.knowledge_score_2}</p>
                      {knowledgeScoreItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500">Breakdown (1 point each)</p>
                          {knowledgeScoreItems.score2.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-gray-300 mt-0.5" />
                                )}
                                <span className={checked ? "text-gray-900" : "text-gray-500"}>{item.label}</span>
                                <span className="ml-auto text-gray-400">{checked ? "+1" : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-gray-500">
                            Total: {sumKnowledge(knowledgeScoreItems.score2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {htsData.pre_test.knowledge_score_3 !== null && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Knowledge Score 3</p>
                      <p className="text-lg font-semibold text-gray-900">{htsData.pre_test.knowledge_score_3}</p>
                      {knowledgeScoreItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500">Breakdown (1 point each)</p>
                          {knowledgeScoreItems.score3.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-gray-300 mt-0.5" />
                                )}
                                <span className={checked ? "text-gray-900" : "text-gray-500"}>{item.label}</span>
                                <span className="ml-auto text-gray-400">{checked ? "+1" : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-gray-500">
                            Total: {sumKnowledge(knowledgeScoreItems.score3)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {htsData.pre_test.hiv_risk_score !== null && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-xs text-red-700">HIV Risk Score</p>
                      <p className="text-lg font-semibold text-red-900">{htsData.pre_test.hiv_risk_score}</p>
                      {hivRiskItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-red-700">Breakdown</p>
                          {hivRiskItems.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-red-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-200 mt-0.5" />
                                )}
                                <span className={checked ? "text-red-900" : "text-red-500"}>{item.label}</span>
                                <span className="ml-auto text-red-600">{checked ? `+${item.points}` : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-red-700">Total: {sumPoints(hivRiskItems)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {htsData.pre_test.partner_risk_score !== null && (
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-xs text-orange-700">Partner Risk Score</p>
                      <p className="text-lg font-semibold text-orange-900">{htsData.pre_test.partner_risk_score}</p>
                      {partnerRiskItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-orange-700">Breakdown</p>
                          {partnerRiskItems.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-orange-200 mt-0.5" />
                                )}
                                <span className={checked ? "text-orange-900" : "text-orange-500"}>{item.label}</span>
                                <span className="ml-auto text-orange-600">{checked ? `+${item.points}` : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-orange-700">Total: {sumPoints(partnerRiskItems)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {htsData.pre_test.sti_screening_score !== null && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-xs text-yellow-700">STI Screening Score</p>
                      <p className="text-lg font-semibold text-yellow-900">{htsData.pre_test.sti_screening_score}</p>
                      {stiRiskItems && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-yellow-700">Breakdown (1 point each)</p>
                          {stiRiskItems.map((item) => {
                            const checked = isTrue((preTest as PreTestRecord)?.[item.key]);
                            return (
                              <div key={item.key} className="flex items-start gap-2 text-xs">
                                {checked ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-yellow-200 mt-0.5" />
                                )}
                                <span className={checked ? "text-yellow-900" : "text-yellow-500"}>{item.label}</span>
                                <span className="ml-auto text-yellow-600">{checked ? `+${item.points}` : "0"}</span>
                              </div>
                            );
                          })}
                          <p className="text-xs text-yellow-700">Total: {sumPoints(stiRiskItems)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PrintSection>
        )}

        {/* Testing Results */}
        {htsData.testing && (
          <PrintSection pageBreakBefore className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="print-repeat-header">
              <img src="/images/TIERs-Logo-good.png" alt="TIERS Logo" />
              <p className="print-subtitle">Client Code: {htsData.initial.client_code}</p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              HIV Testing Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Screening Test</p>
                <p className={`mt-2 text-lg font-semibold ${
                  htsData.testing.screening_test_result === "Reactive" ? "text-red-600" : "text-green-600"
                }`}>
                  {htsData.testing.screening_test_result}
                </p>
                <p className="mt-1 text-xs text-gray-500">{htsData.testing.screening_test_date}</p>
              </div>

              {htsData.testing.confirmatory_test_result && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Confirmatory Test</p>
                  <p className={`mt-2 text-lg font-semibold ${
                    htsData.testing.confirmatory_test_result === "Reactive" ? "text-red-600" : "text-green-600"
                  }`}>
                    {htsData.testing.confirmatory_test_result}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{htsData.testing.confirmatory_test_date}</p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm font-medium text-blue-900">Final Result</p>
                <p className={`mt-2 text-xl font-bold ${
                  htsData.testing.final_result === "Reactive" ? "text-red-600" : "text-green-600"
                }`}>
                  {htsData.testing.final_result}
                </p>
              </div>
            </div>
          </PrintSection>
        )}

        {/* PrEP Eligibility */}
        {htsData.prep_eligibility && (
          <PrintSection pageBreakBefore className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="print-repeat-header">
              <img src="/images/TIERs-Logo-good.png" alt="TIERS Logo" />
              <p className="print-subtitle">Client Code: {htsData.initial.client_code}</p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">PrEP Eligibility Assessment</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {htsData.prep_eligibility.hiv_negative ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">HIV Negative</span>
              </div>
              <div className="flex items-center">
                {htsData.prep_eligibility.no_acute_hiv_symptoms ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">No Acute Symptoms</span>
              </div>
              <div className="flex items-center">
                {htsData.prep_eligibility.prep_offered ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700 font-medium">PrEP Offered</span>
              </div>
            </div>
          </PrintSection>
        )}

        {/* Post-Test Counseling */}
        {htsData.post_test && (
          <PrintSection pageBreakBefore className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="print-repeat-header">
              <img src="/images/TIERs-Logo-good.png" alt="TIERS Logo" />
              <p className="print-subtitle">Client Code: {htsData.initial.client_code}</p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Post-Test Counseling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Test Results</h3>
                {additionalTestOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {additionalTestOrders.map((order) => (
                      <div key={order.id} className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500">{order.test_info.test_name}</p>
                        <p className="text-sm font-semibold text-gray-900">{extractOrderResultText(order)}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: {order.status}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                    No additional lab tests linked to this HTS session.
                  </p>
                )}
              </div>
              {htsData.post_test.comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Comments</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{htsData.post_test.comments}</p>
                </div>
              )}
            </div>
          </PrintSection>
        )}

        {/* Referral */}
        {htsData.referral && (
          <PrintSection pageBreakBefore className="bg-white shadow rounded-lg p-6">
            <div className="print-repeat-header">
              <img src="/images/TIERs-Logo-good.png" alt="TIERS Logo" />
              <p className="print-subtitle">Client Code: {htsData.initial.client_code}</p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Referral Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {htsData.referral.referred_org_name && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Referred To</h3>
                    <p className="text-sm text-gray-900">{htsData.referral.referred_org_name}</p>
                    {htsData.referral.referred_org_address && (
                      <p className="text-xs text-gray-500 mt-1">{htsData.referral.referred_org_address}</p>
                    )}
                  </div>
                  {htsData.referral.comments && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600">{htsData.referral.comments}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </PrintSection>
        )}
        <div className="print-footer" />
      </div>
    </div>
    </PrintablePageWrapper>
  );
}
