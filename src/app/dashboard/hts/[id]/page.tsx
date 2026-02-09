"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, User, CheckCircle, XCircle, Edit } from "lucide-react";
import { htsApi, CompleteHtsWorkflow } from "@/lib/hts";

// Type helper for dynamic property access
type PreTestRecord = Record<string, any>;
const isTrue = (value: unknown): value is true => value === true;

export default function HtsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [htsData, setHtsData] = useState<CompleteHtsWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtsData = async () => {
      try {
        const data = await htsApi.getComplete(id);
        setHtsData(data);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
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
        <div className="bg-white shadow rounded-lg p-6 mb-6">
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
        </div>

        {/* Pre-Test Counseling */}
        {htsData.pre_test && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
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
          </div>
        )}

        {/* Testing Results */}
        {htsData.testing && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
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
          </div>
        )}

        {/* PrEP Eligibility */}
        {htsData.prep_eligibility && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
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
          </div>
        )}

        {/* Post-Test Counseling */}
        {htsData.post_test && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Post-Test Counseling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Syphilis</p>
                    <p className="text-sm font-semibold text-gray-900">{htsData.post_test.syphilis_test_result}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Hepatitis B</p>
                    <p className="text-sm font-semibold text-gray-900">{htsData.post_test.hepatitis_b_test_result}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Hepatitis C</p>
                    <p className="text-sm font-semibold text-gray-900">{htsData.post_test.hepatitis_c_test_result}</p>
                  </div>
                </div>
              </div>
              {htsData.post_test.comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Comments</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{htsData.post_test.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referral */}
        {htsData.referral && (
          <div className="bg-white shadow rounded-lg p-6">
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
          </div>
        )}
      </div>
    </div>
  );
}
