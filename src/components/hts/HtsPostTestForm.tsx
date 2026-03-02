"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { HtsPostTestRequest, PREVIOUS_HIV_TEST_STATUSES } from "@/lib/hts";
import { getOrdersByService } from "@/lib/laboratory";
import { useFormConfig } from "@/hooks/useFormConfig";
import { FORM_SCHEMAS } from "@/lib/form-schemas";

interface HtsPostTestFormProps {
  initialData?: Partial<HtsPostTestRequest>;
  onSave: (data: HtsPostTestRequest) => void;
  loading?: boolean;
  htsInitialId?: string; // UUID for lab results auto-fill
}

export default function HtsPostTestForm({ initialData, onSave, loading, htsInitialId }: HtsPostTestFormProps) {
  const { isVisible, isRequired, getLabel, getOptions } = useFormConfig("hts", FORM_SCHEMAS.hts);
  const [labResultsLoaded, setLabResultsLoaded] = useState(false);
  const [availableTests, setAvailableTests] = useState({
    syphilis: false,
    hepatitisB: false,
    hepatitisC: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HtsPostTestRequest>({
    defaultValues: {
      ...initialData,
      result_form_signed: initialData?.result_form_signed ?? false,
      result_form_filled: initialData?.result_form_filled ?? false,
      client_received_result: initialData?.client_received_result ?? false,
      partner_uses_fp_method: initialData?.partner_uses_fp_method ?? false,
      partner_uses_condom: initialData?.partner_uses_condom ?? false,
      post_test_counseling_done: initialData?.post_test_counseling_done ?? false,
      client_referred_to_services: initialData?.client_referred_to_services ?? false,
      risk_reduction_plan_developed: initialData?.risk_reduction_plan_developed ?? false,
      disclosure_plan_developed: initialData?.disclosure_plan_developed ?? false,
      will_bring_partners: initialData?.will_bring_partners ?? false,
      will_bring_children: initialData?.will_bring_children ?? false,
      provided_fp_info: initialData?.provided_fp_info ?? false,
      condom_use_demonstrated: initialData?.condom_use_demonstrated ?? false,
      condoms_provided: initialData?.condoms_provided ?? false,
    },
  });

  // Auto-fill lab results if available
  useEffect(() => {
    const loadLabResults = async () => {
      if (!htsInitialId) return;

      try {
        // First, check which tests were ordered
        const orders = await getOrdersByService("HTS", htsInitialId);

        const orderedTests = {
          syphilis: orders.some(o => o.test_info.test_code === 'TPHA'),
          hepatitisB: orders.some(o => o.test_info.test_code === 'HBSAG'),
          hepatitisC: orders.some(o => o.test_info.test_code === 'HCVAB'),
        };

        setAvailableTests(orderedTests);

        let hasAnyCompletedTest = false;

        // Check each order for completed results
        orders.forEach(order => {
          if (order.status === 'Completed' || order.status === 'Reviewed' || order.status === 'Communicated') {
            // Mark that we have at least one completed test
            if (order.test_info.test_code === 'TPHA' || order.test_info.test_code === 'HBSAG' || order.test_info.test_code === 'HCVAB') {
              hasAnyCompletedTest = true;
            }
          }
        });

        // Mark as loaded if ordered STI tests have completed in lab
        if (hasAnyCompletedTest) {
          setLabResultsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load lab results:", error);
        // Fail silently - allow manual entry
      }
    };

    loadLabResults();
  }, [htsInitialId]);

  const onSubmit = (data: HtsPostTestRequest) => {
    // Remove STI test fields if they weren't ordered
    const cleanedData = { ...data };
    
    if (!availableTests.syphilis) {
      delete cleanedData.syphilis_test_result;
    }
    if (!availableTests.hepatitisB) {
      delete cleanedData.hepatitis_b_test_result;
    }
    if (!availableTests.hepatitisC) {
      delete cleanedData.hepatitis_c_test_result;
    }
    
    onSave(cleanedData);
  };

  const checkboxField = (name: keyof HtsPostTestRequest, fallbackLabel: string, id: string) => {
    if (!isVisible(name)) return null;
    return (
      <div className="flex items-center">
        <input
          id={id}
          type="checkbox"
          {...register(name)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor={id} className="ml-3 text-sm text-gray-700">
          {getLabel(name) || fallbackLabel}
        </label>
      </div>
    );
  };

  const showResultDocumentationSection =
    isVisible("result_form_signed") ||
    isVisible("result_form_filled") ||
    isVisible("client_received_result");
  const showPartnerInfoSection =
    isVisible("partner_uses_fp_method") ||
    isVisible("partner_uses_condom");
  const showPostTestCounselingSection =
    isVisible("post_test_counseling_done") ||
    isVisible("client_referred_to_services") ||
    isVisible("risk_reduction_plan_developed") ||
    isVisible("disclosure_plan_developed");
  const showPartnerChildSection =
    isVisible("will_bring_partners") ||
    isVisible("will_bring_children");
  const showPreventionSection =
    isVisible("provided_fp_info") ||
    isVisible("condom_use_demonstrated") ||
    isVisible("condoms_provided");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Waiting for Lab Results - Only show if STI tests were ordered but not completed */}
      {!labResultsLoaded && (availableTests.syphilis || availableTests.hepatitisB || availableTests.hepatitisC) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Waiting for STI Screening Results
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Lab tests for {[
                  availableTests.syphilis && 'Syphilis',
                  availableTests.hepatitisB && 'Hepatitis B',
                  availableTests.hepatitisC && 'Hepatitis C'
                ].filter(Boolean).join(', ')} must be completed before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Previous HIV Test Status */}
      {isVisible("previous_hiv_test_status") && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getLabel("previous_hiv_test_status")} {isRequired("previous_hiv_test_status") && <span className="text-red-500">*</span>}
        </label>
        <select
          {...register("previous_hiv_test_status", {
            required: isRequired("previous_hiv_test_status")
              ? `${getLabel("previous_hiv_test_status")} is required`
              : false,
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select previous test status</option>
          {getOptions("previous_hiv_test_status", PREVIOUS_HIV_TEST_STATUSES as string[]).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {errors.previous_hiv_test_status && (
          <p className="mt-1 text-sm text-red-600">{errors.previous_hiv_test_status.message}</p>
        )}
      </div>
      )}

      {/* Result Documentation */}
      {showResultDocumentationSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Result Documentation</h3>
        <div className="space-y-3">
          {checkboxField("result_form_signed", "Result form signed by client", "result_form_signed")}
          {checkboxField("result_form_filled", "Result form completely filled", "result_form_filled")}
          {checkboxField("client_received_result", "Client received test result", "client_received_result")}
        </div>
      </div>
      )}

      {/* Partner Information */}
      {showPartnerInfoSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Information</h3>
        <div className="space-y-3">
          {checkboxField("partner_uses_fp_method", "Partner uses family planning method", "partner_uses_fp_method")}
          {checkboxField("partner_uses_condom", "Partner uses condoms", "partner_uses_condom")}
        </div>
      </div>
      )}

      {/* Post-Test Counseling */}
      {showPostTestCounselingSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Post-Test Counseling</h3>
        <div className="space-y-3">
          {checkboxField("post_test_counseling_done", "Post-test counseling completed", "post_test_counseling_done")}
          {checkboxField("client_referred_to_services", "Client referred to appropriate services", "client_referred_to_services")}
          {checkboxField("risk_reduction_plan_developed", "Risk reduction plan developed", "risk_reduction_plan_developed")}
          {checkboxField("disclosure_plan_developed", "Disclosure plan developed", "disclosure_plan_developed")}
        </div>
      </div>
      )}

      {/* Partner/Child Testing */}
      {showPartnerChildSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner & Child Testing</h3>
        <div className="space-y-3">
          {checkboxField("will_bring_partners", "Client will bring partner(s) for testing", "will_bring_partners")}
          {checkboxField("will_bring_children", "Client will bring children for testing", "will_bring_children")}
        </div>
      </div>
      )}

      {/* Prevention Services */}
      {showPreventionSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prevention Services Provided</h3>
        <div className="space-y-3">
          {checkboxField("provided_fp_info", "Family planning information provided", "provided_fp_info")}
          {checkboxField("condom_use_demonstrated", "Condom use demonstrated", "condom_use_demonstrated")}
          {checkboxField("condoms_provided", "Condoms provided to client", "condoms_provided")}
        </div>
      </div>
      )}

      {/* Comments */}
      {isVisible("comments") && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getLabel("comments")}
        </label>
        <textarea
          {...register("comments")}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter any additional notes or observations..."
        />
      </div>
      )}

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
