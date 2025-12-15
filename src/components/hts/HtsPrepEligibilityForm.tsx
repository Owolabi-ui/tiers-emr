"use client";

import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { HtsPrepEligibilityRequest } from "@/lib/hts";

interface HtsPrepEligibilityFormProps {
  initialData?: Partial<HtsPrepEligibilityRequest>;
  onSave: (data: HtsPrepEligibilityRequest) => void;
  loading?: boolean;
}

export default function HtsPrepEligibilityForm({ initialData, onSave, loading }: HtsPrepEligibilityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HtsPrepEligibilityRequest>({
    defaultValues: initialData,
  });

  const onSubmit = (data: HtsPrepEligibilityRequest) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          <strong>PrEP (Pre-Exposure Prophylaxis)</strong> is for HIV-negative individuals at high risk of HIV infection.
          Check all eligibility criteria below.
        </p>
      </div>

      {/* Eligibility Criteria */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">PrEP Eligibility Criteria</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="hiv_negative"
                type="checkbox"
                {...register("hiv_negative")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="hiv_negative" className="text-sm font-medium text-gray-700">
                HIV Negative
              </label>
              <p className="text-xs text-gray-500">Confirmed negative HIV test result</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="no_acute_hiv_symptoms"
                type="checkbox"
                {...register("no_acute_hiv_symptoms")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="no_acute_hiv_symptoms" className="text-sm font-medium text-gray-700">
                No Acute HIV Symptoms
              </label>
              <p className="text-xs text-gray-500">No symptoms of acute HIV infection (fever, rash, fatigue, etc.)</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="no_indication_for_pep"
                type="checkbox"
                {...register("no_indication_for_pep")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="no_indication_for_pep" className="text-sm font-medium text-gray-700">
                No Indication for PEP
              </label>
              <p className="text-xs text-gray-500">No recent exposure requiring Post-Exposure Prophylaxis</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="no_proteinuria"
                type="checkbox"
                {...register("no_proteinuria")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="no_proteinuria" className="text-sm font-medium text-gray-700">
                No Proteinuria
              </label>
              <p className="text-xs text-gray-500">No protein in urine (normal kidney function)</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="no_drug_interaction"
                type="checkbox"
                {...register("no_drug_interaction")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="no_drug_interaction" className="text-sm font-medium text-gray-700">
                No Drug Interactions
              </label>
              <p className="text-xs text-gray-500">No medications that would interact with PrEP</p>
            </div>
          </div>
        </div>
      </div>

      {/* PrEP Offered */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="prep_offered"
              type="checkbox"
              {...register("prep_offered")}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="prep_offered" className="text-sm font-medium text-gray-900">
              PrEP Offered to Client
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Check this box if PrEP was offered to the client based on eligibility assessment
            </p>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Note:</h4>
        <p className="text-xs text-gray-600">
          If all eligibility criteria are met and the client is at substantial ongoing risk of HIV acquisition,
          PrEP should be offered. The client will need to provide informed consent and commit to adherence
          and follow-up visits.
        </p>
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
