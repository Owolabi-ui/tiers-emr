"use client";

import { useForm } from "react-hook-form";
import { Save, AlertTriangle } from "lucide-react";
import { HtsPreTestRequest } from "@/lib/hts";
import { useEffect, useState } from "react";

interface HtsPreTestFormProps {
  initialData?: Partial<HtsPreTestRequest>;
  onSave: (data: HtsPreTestRequest) => void;
  loading?: boolean;
}

// Calculate HIV Risk Score based on risk factors
function calculateHivRiskScore(data: Partial<HtsPreTestRequest>): number {
  let score = 0;
  
  // High risk factors (3 points each)
  if (data.risk_unprotected_anal_sex) score += 3;
  if (data.risk_sharing_needles) score += 3;
  if (data.risk_been_paid_for_sex) score += 3;
  
  // Medium risk factors (2 points each)
  if (data.risk_unprotected_vaginal_sex) score += 2;
  if (data.risk_multiple_partners) score += 2;
  if (data.risk_sti) score += 2;
  if (data.risk_paid_for_sex) score += 2;
  if (data.risk_sexual_orgy) score += 2;
  
  // Lower risk factors (1 point each)
  if (data.risk_blood_transfusion) score += 1;
  if (data.risk_sex_under_influence) score += 1;
  if (data.risk_condom_breakage) score += 1;
  if (data.risk_anal_sex) score += 1;
  if (data.risk_vaginal_sex) score += 1;
  
  return score;
}

// Calculate Partner Risk Score
function calculatePartnerRiskScore(data: Partial<HtsPreTestRequest>): number {
  let score = 0;
  
  // High risk partners (3 points each)
  if (data.partner_hiv_positive) score += 3;
  if (data.partner_injects_drugs) score += 3;
  
  // Medium risk (2 points each)
  if (data.partner_newly_diagnosed_on_treatment) score += 2;
  if (data.partner_returned_after_ltfu) score += 2;
  if (data.partner_has_sex_with_men) score += 2;
  if (data.partner_adolescent_hiv_positive) score += 2;
  
  // Lower risk (1 point each) - on treatment with suppressed VL is lower risk
  if (data.partner_on_arv_suppressed_vl) score += 1;
  if (data.partner_pregnant_on_arv) score += 1;
  if (data.partner_transgender) score += 1;
  
  return score;
}

export default function HtsPreTestForm({ initialData, onSave, loading }: HtsPreTestFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HtsPreTestRequest>({
    defaultValues: initialData || {
      // Knowledge Assessment 1
      previously_tested_negative: false,
      informed_hiv_transmission: false,
      informed_risk_factors: false,
      informed_prevention_methods: false,
      informed_test_results: false,
      consent_given: false,
      used_drugs_sexual_performance: false,

      // Knowledge Assessment 2 (Transmission)
      transmission_sexual_intercourse: false,
      transmission_blood_transfusion: false,
      transmission_mother_to_child: false,
      transmission_sharing_toilet: false,
      transmission_sharp_objects: false,
      transmission_eating_utensils: false,
      transmission_mosquito_bites: false,
      transmission_kissing: false,
      transmission_hugging: false,

      // Knowledge Assessment 3 (Prevention)
      prevention_faithful_partner: false,
      prevention_condom_use: false,
      prevention_abstinence: false,
      prevention_delay_sexual_debut: false,
      prevention_reduce_partners: false,
      prevention_avoid_risky_partners: false,
      prevention_avoid_sharp_objects: false,
      prevention_healthy_looking_can_have_hiv: false,

      // HIV Risk Assessment
      risk_blood_transfusion: false,
      risk_unprotected_vaginal_sex: false,
      risk_unprotected_anal_sex: false,
      risk_sharing_needles: false,
      risk_sti: false,
      risk_multiple_partners: false,
      risk_sex_under_influence: false,
      risk_anal_sex: false,
      risk_vaginal_sex: false,
      risk_paid_for_sex: false,
      risk_been_paid_for_sex: false,
      risk_condom_breakage: false,
      risk_sexual_orgy: false,

      // Drug Use
      drug_use: [],
      drug_route: [],

      // Partner Risk Assessment
      partner_newly_diagnosed_on_treatment: false,
      partner_on_arv_suppressed_vl: false,
      partner_pregnant_on_arv: false,
      partner_returned_after_ltfu: false,
      partner_adolescent_hiv_positive: false,
      partner_hiv_positive: false,
      partner_injects_drugs: false,
      partner_has_sex_with_men: false,
      partner_transgender: false,

      // STI Screening
      sti_urethral_discharge: false,
      sti_scrotal_swelling: false,
      sti_genital_sore: false,
      sti_anal_pain: false,
      sti_anal_discharge: false,
      sti_anal_itching: false,

      // GBV
      experiencing_violence: false,
    },
  });

  // Watch all form values for real-time risk score calculation
  const formValues = watch();
  const [hivRiskScore, setHivRiskScore] = useState(0);
  const [partnerRiskScore, setPartnerRiskScore] = useState(0);

  // Calculate risk scores whenever form values change
  useEffect(() => {
    const hivScore = calculateHivRiskScore(formValues);
    const partnerScore = calculatePartnerRiskScore(formValues);
    setHivRiskScore(hivScore);
    setPartnerRiskScore(partnerScore);
  }, [formValues]);

  const onSubmit = (data: HtsPreTestRequest) => {
    // Ensure drug_use and drug_route are always arrays (even if empty)
    if (!data.drug_use) data.drug_use = [];
    if (!data.drug_route) data.drug_route = [];

    // Include calculated risk scores
    data.hiv_risk_score = hivRiskScore;
    data.partner_risk_score = partnerRiskScore;

    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Risk Scores Display - Real-time calculation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">HIV Risk Score</p>
              <p className="text-4xl font-bold text-red-900 dark:text-red-100">{hivRiskScore}</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                {hivRiskScore === 0 && "No risk factors identified"}
                {hivRiskScore > 0 && hivRiskScore <= 5 && "Low to moderate risk"}
                {hivRiskScore > 5 && hivRiskScore <= 10 && "Moderate to high risk"}
                {hivRiskScore > 10 && "High risk - PrEP recommended"}
              </p>
            </div>
            <AlertTriangle className={`h-8 w-8 ${hivRiskScore > 5 ? 'text-red-600' : 'text-red-400'}`} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Partner Risk Score</p>
              <p className="text-4xl font-bold text-orange-900 dark:text-orange-100">{partnerRiskScore}</p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                {partnerRiskScore === 0 && "No partner risk factors"}
                {partnerRiskScore > 0 && partnerRiskScore <= 4 && "Low partner risk"}
                {partnerRiskScore > 4 && partnerRiskScore <= 8 && "Moderate partner risk"}
                {partnerRiskScore > 8 && "High partner risk - PrEP recommended"}
              </p>
            </div>
            <AlertTriangle className={`h-8 w-8 ${partnerRiskScore > 4 ? 'text-orange-600' : 'text-orange-400'}`} />
          </div>
        </div>
      </div>

      {/* Knowledge Assessment 1 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Assessment 1: HIV Testing History & Awareness</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="previously_tested_negative"
              type="checkbox"
              {...register("previously_tested_negative")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="previously_tested_negative" className="ml-3 text-sm text-gray-700">
              Previously tested negative
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="informed_hiv_transmission"
              type="checkbox"
              {...register("informed_hiv_transmission")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="informed_hiv_transmission" className="ml-3 text-sm text-gray-700">
              Informed about HIV transmission
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="informed_risk_factors"
              type="checkbox"
              {...register("informed_risk_factors")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="informed_risk_factors" className="ml-3 text-sm text-gray-700">
              Informed about risk factors
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="informed_prevention_methods"
              type="checkbox"
              {...register("informed_prevention_methods")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="informed_prevention_methods" className="ml-3 text-sm text-gray-700">
              Informed about prevention methods
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="informed_test_results"
              type="checkbox"
              {...register("informed_test_results")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="informed_test_results" className="ml-3 text-sm text-gray-700">
              Informed about test results
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="consent_given"
              type="checkbox"
              {...register("consent_given")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="consent_given" className="ml-3 text-sm text-gray-700">
              Consent given
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="used_drugs_sexual_performance"
              type="checkbox"
              {...register("used_drugs_sexual_performance")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="used_drugs_sexual_performance" className="ml-3 text-sm text-gray-700">
              Used drugs for sexual performance
            </label>
          </div>
        </div>
      </div>

      {/* Knowledge Assessment 2 - HIV Transmission */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Assessment 2: HIV Transmission</h3>
        <p className="text-sm text-gray-600 mb-4">Select all that client knows are ways HIV can be transmitted:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              id="transmission_sexual_intercourse"
              type="checkbox"
              {...register("transmission_sexual_intercourse")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_sexual_intercourse" className="ml-3 text-sm text-gray-700">
              Sexual intercourse
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_blood_transfusion"
              type="checkbox"
              {...register("transmission_blood_transfusion")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_blood_transfusion" className="ml-3 text-sm text-gray-700">
              Blood transfusion
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_mother_to_child"
              type="checkbox"
              {...register("transmission_mother_to_child")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_mother_to_child" className="ml-3 text-sm text-gray-700">
              Mother to child
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_sharing_toilet"
              type="checkbox"
              {...register("transmission_sharing_toilet")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_sharing_toilet" className="ml-3 text-sm text-gray-700">
              Sharing toilet (misconception)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_sharp_objects"
              type="checkbox"
              {...register("transmission_sharp_objects")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_sharp_objects" className="ml-3 text-sm text-gray-700">
              Sharing sharp objects
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_eating_utensils"
              type="checkbox"
              {...register("transmission_eating_utensils")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_eating_utensils" className="ml-3 text-sm text-gray-700">
              Sharing eating utensils (misconception)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_mosquito_bites"
              type="checkbox"
              {...register("transmission_mosquito_bites")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_mosquito_bites" className="ml-3 text-sm text-gray-700">
              Mosquito bites (misconception)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_kissing"
              type="checkbox"
              {...register("transmission_kissing")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_kissing" className="ml-3 text-sm text-gray-700">
              Kissing (misconception)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="transmission_hugging"
              type="checkbox"
              {...register("transmission_hugging")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transmission_hugging" className="ml-3 text-sm text-gray-700">
              Hugging (misconception)
            </label>
          </div>
        </div>
      </div>

      {/* Knowledge Assessment 3 - HIV Prevention */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Assessment 3: HIV Prevention</h3>
        <p className="text-sm text-gray-600 mb-4">Select all that client knows are ways to prevent HIV:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              id="prevention_faithful_partner"
              type="checkbox"
              {...register("prevention_faithful_partner")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_faithful_partner" className="ml-3 text-sm text-gray-700">
              Being faithful to uninfected partner
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_condom_use"
              type="checkbox"
              {...register("prevention_condom_use")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_condom_use" className="ml-3 text-sm text-gray-700">
              Using condoms
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_abstinence"
              type="checkbox"
              {...register("prevention_abstinence")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_abstinence" className="ml-3 text-sm text-gray-700">
              Abstinence
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_delay_sexual_debut"
              type="checkbox"
              {...register("prevention_delay_sexual_debut")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_delay_sexual_debut" className="ml-3 text-sm text-gray-700">
              Delaying sexual debut
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_reduce_partners"
              type="checkbox"
              {...register("prevention_reduce_partners")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_reduce_partners" className="ml-3 text-sm text-gray-700">
              Reducing number of partners
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_avoid_risky_partners"
              type="checkbox"
              {...register("prevention_avoid_risky_partners")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_avoid_risky_partners" className="ml-3 text-sm text-gray-700">
              Avoiding risky sexual partners
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_avoid_sharp_objects"
              type="checkbox"
              {...register("prevention_avoid_sharp_objects")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_avoid_sharp_objects" className="ml-3 text-sm text-gray-700">
              Avoiding sharing sharp objects
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="prevention_healthy_looking_can_have_hiv"
              type="checkbox"
              {...register("prevention_healthy_looking_can_have_hiv")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prevention_healthy_looking_can_have_hiv" className="ml-3 text-sm text-gray-700">
              Knows healthy-looking person can have HIV
            </label>
          </div>
        </div>
      </div>

      {/* HIV Risk Assessment */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">HIV Risk Assessment</h3>
        <p className="text-sm text-gray-600 mb-4">Select all risk behaviors present:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              id="risk_blood_transfusion"
              type="checkbox"
              {...register("risk_blood_transfusion")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_blood_transfusion" className="ml-3 text-sm text-gray-700">
              Blood transfusion
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_unprotected_vaginal_sex"
              type="checkbox"
              {...register("risk_unprotected_vaginal_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_unprotected_vaginal_sex" className="ml-3 text-sm text-gray-700">
              Unprotected vaginal sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_unprotected_anal_sex"
              type="checkbox"
              {...register("risk_unprotected_anal_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_unprotected_anal_sex" className="ml-3 text-sm text-gray-700">
              Unprotected anal sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_sharing_needles"
              type="checkbox"
              {...register("risk_sharing_needles")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_sharing_needles" className="ml-3 text-sm text-gray-700">
              Sharing needles/syringes
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_sti"
              type="checkbox"
              {...register("risk_sti")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_sti" className="ml-3 text-sm text-gray-700">
              STI present
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_multiple_partners"
              type="checkbox"
              {...register("risk_multiple_partners")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_multiple_partners" className="ml-3 text-sm text-gray-700">
              Multiple sexual partners
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_sex_under_influence"
              type="checkbox"
              {...register("risk_sex_under_influence")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_sex_under_influence" className="ml-3 text-sm text-gray-700">
              Sex under influence of drugs/alcohol
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_anal_sex"
              type="checkbox"
              {...register("risk_anal_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_anal_sex" className="ml-3 text-sm text-gray-700">
              Anal sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_vaginal_sex"
              type="checkbox"
              {...register("risk_vaginal_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_vaginal_sex" className="ml-3 text-sm text-gray-700">
              Vaginal sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_paid_for_sex"
              type="checkbox"
              {...register("risk_paid_for_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_paid_for_sex" className="ml-3 text-sm text-gray-700">
              Paid for sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_been_paid_for_sex"
              type="checkbox"
              {...register("risk_been_paid_for_sex")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_been_paid_for_sex" className="ml-3 text-sm text-gray-700">
              Been paid for sex
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_condom_breakage"
              type="checkbox"
              {...register("risk_condom_breakage")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_condom_breakage" className="ml-3 text-sm text-gray-700">
              Condom breakage/slippage
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_sexual_orgy"
              type="checkbox"
              {...register("risk_sexual_orgy")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_sexual_orgy" className="ml-3 text-sm text-gray-700">
              Sexual orgy
            </label>
          </div>
        </div>
      </div>

      {/* Partner Risk Assessment */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              id="partner_newly_diagnosed_on_treatment"
              type="checkbox"
              {...register("partner_newly_diagnosed_on_treatment")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_newly_diagnosed_on_treatment" className="ml-3 text-sm text-gray-700">
              Partner newly diagnosed on treatment
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_on_arv_suppressed_vl"
              type="checkbox"
              {...register("partner_on_arv_suppressed_vl")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_on_arv_suppressed_vl" className="ml-3 text-sm text-gray-700">
              Partner on ARV with suppressed VL
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_pregnant_on_arv"
              type="checkbox"
              {...register("partner_pregnant_on_arv")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_pregnant_on_arv" className="ml-3 text-sm text-gray-700">
              Partner pregnant on ARV
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_returned_after_ltfu"
              type="checkbox"
              {...register("partner_returned_after_ltfu")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_returned_after_ltfu" className="ml-3 text-sm text-gray-700">
              Partner returned after LTFU
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_adolescent_hiv_positive"
              type="checkbox"
              {...register("partner_adolescent_hiv_positive")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_adolescent_hiv_positive" className="ml-3 text-sm text-gray-700">
              Partner is adolescent HIV positive
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_hiv_positive"
              type="checkbox"
              {...register("partner_hiv_positive")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_hiv_positive" className="ml-3 text-sm text-gray-700">
              Partner is HIV positive
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_injects_drugs"
              type="checkbox"
              {...register("partner_injects_drugs")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_injects_drugs" className="ml-3 text-sm text-gray-700">
              Partner injects drugs
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_has_sex_with_men"
              type="checkbox"
              {...register("partner_has_sex_with_men")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_has_sex_with_men" className="ml-3 text-sm text-gray-700">
              Partner has sex with men
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_transgender"
              type="checkbox"
              {...register("partner_transgender")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_transgender" className="ml-3 text-sm text-gray-700">
              Partner is transgender
            </label>
          </div>
        </div>
      </div>

      {/* STI Screening */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">STI Screening</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <input
              id="sti_urethral_discharge"
              type="checkbox"
              {...register("sti_urethral_discharge")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_urethral_discharge" className="ml-3 text-sm text-gray-700">
              Urethral discharge
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sti_scrotal_swelling"
              type="checkbox"
              {...register("sti_scrotal_swelling")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_scrotal_swelling" className="ml-3 text-sm text-gray-700">
              Scrotal swelling
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sti_genital_sore"
              type="checkbox"
              {...register("sti_genital_sore")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_genital_sore" className="ml-3 text-sm text-gray-700">
              Genital sore/ulcer
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sti_anal_pain"
              type="checkbox"
              {...register("sti_anal_pain")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_anal_pain" className="ml-3 text-sm text-gray-700">
              Anal pain
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sti_anal_discharge"
              type="checkbox"
              {...register("sti_anal_discharge")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_anal_discharge" className="ml-3 text-sm text-gray-700">
              Anal discharge
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sti_anal_itching"
              type="checkbox"
              {...register("sti_anal_itching")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sti_anal_itching" className="ml-3 text-sm text-gray-700">
              Anal itching
            </label>
          </div>
        </div>
      </div>

      {/* GBV */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gender-Based Violence (GBV)</h3>
        <div className="flex items-center">
          <input
            id="experiencing_violence"
            type="checkbox"
            {...register("experiencing_violence")}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="experiencing_violence" className="ml-3 text-sm text-gray-700">
            Client is experiencing violence
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save & Continue
            </>
          )}
        </button>
      </div>
    </form>
  );
}
