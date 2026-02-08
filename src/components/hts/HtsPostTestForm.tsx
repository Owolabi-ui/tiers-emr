"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Lock, CheckCircle } from "lucide-react";
import { HtsPostTestRequest, PREVIOUS_HIV_TEST_STATUSES, ADDITIONAL_TEST_RESULTS } from "@/lib/hts";
import { getResultsByService, getOrdersByService } from "@/lib/laboratory";

interface HtsPostTestFormProps {
  initialData?: Partial<HtsPostTestRequest>;
  onSave: (data: HtsPostTestRequest) => void;
  loading?: boolean;
  htsInitialId?: string; // UUID for lab results auto-fill
}

export default function HtsPostTestForm({ initialData, onSave, loading, htsInitialId }: HtsPostTestFormProps) {
  const [labResultsLoaded, setLabResultsLoaded] = useState(false);
  const [availableTests, setAvailableTests] = useState({
    syphilis: false,
    hepatitisB: false,
    hepatitisC: false,
  });
  const normalizeAdditionalTestResult = (raw: string) => {
    // Assumption: Lab techs may enter case or hyphen variants (e.g., "Non-reactive").
    // We normalize to HTS AdditionalTestResult values without changing backend behavior.
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ").replace(/-/g, " ");
    if (normalized === "reactive" || normalized === "positive") return "Positive";
    if (normalized === "non reactive" || normalized === "negative" || normalized === "nonreactive") return "Negative";
    if (
      normalized === "not done" ||
      normalized === "notdone" ||
      normalized === "not performed" ||
      normalized === "notperformed" ||
      normalized === "n/a" ||
      normalized === "na"
    ) {
      return "Not done";
    }
    return null;
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HtsPostTestRequest>({
    defaultValues: initialData,
  });

  // Auto-fill lab results if available
  useEffect(() => {
    const loadLabResults = async () => {
      if (!htsInitialId) return;

      try {
        // First, check which tests were ordered
        const orders = await getOrdersByService("HTS", htsInitialId);
        
        console.log('Lab orders:', orders);
        
        const orderedTests = {
          syphilis: orders.some(o => o.test_info.test_code === 'TPHA'),
          hepatitisB: orders.some(o => o.test_info.test_code === 'HBSAG'),
          hepatitisC: orders.some(o => o.test_info.test_code === 'HCVAB'),
        };
        
        console.log('Ordered tests:', orderedTests);
        
        setAvailableTests(orderedTests);

        // Check if results are already in the orders themselves
        let hasResults = false;
        let hasAnyCompletedTest = false;

        // Check each order for completed results
        orders.forEach(order => {
          if (order.status === 'Completed' || order.status === 'Reviewed' || order.status === 'Communicated') {
            // Mark that we have at least one completed test
            if (order.test_info.test_code === 'TPHA' || order.test_info.test_code === 'HBSAG' || order.test_info.test_code === 'HCVAB') {
              hasAnyCompletedTest = true;
            }
            
            if (order.test_info.test_code === 'TPHA' && order.result_value) {
              console.log('Found TPHA result:', order.result_value);
              const normalized = normalizeAdditionalTestResult(order.result_value);
              if (normalized) {
                setValue("syphilis_test_result", normalized);
                hasResults = true;
              } else {
                console.warn('Invalid TPHA result from lab:', order.result_value, '- will require manual selection');
              }
            }
            if (order.test_info.test_code === 'HBSAG' && order.result_value) {
              console.log('Found HBSAG result:', order.result_value);
              const normalized = normalizeAdditionalTestResult(order.result_value);
              if (normalized) {
                setValue("hepatitis_b_test_result", normalized);
                hasResults = true;
              } else {
                console.warn('Invalid HBSAG result from lab:', order.result_value, '- will require manual selection');
              }
            }
            if (order.test_info.test_code === 'HCVAB' && order.result_value) {
              console.log('Found HCVAB result:', order.result_value);
              const normalized = normalizeAdditionalTestResult(order.result_value);
              if (normalized) {
                setValue("hepatitis_c_test_result", normalized);
                hasResults = true;
              } else {
                console.warn('Invalid HCVAB result from lab:', order.result_value, '- will require manual selection');
              }
            }
          }
        });

        // Mark as loaded if we got any valid results OR if tests are completed (even with invalid values)
        if (hasResults || hasAnyCompletedTest) {
          setLabResultsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load lab results:", error);
        // Fail silently - allow manual entry
      }
    };

    loadLabResults();
  }, [htsInitialId, setValue]);

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lab Results Auto-Fill Banner */}
      {labResultsLoaded && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Lab Results Loaded
              </p>
              <p className="text-xs text-green-600 mt-1">
                STI screening results from laboratory are displayed below. Review and confirm to continue.
              </p>
            </div>
          </div>
        </div>
      )}

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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Previous HIV Test Status <span className="text-red-500">*</span>
        </label>
        <select
          {...register("previous_hiv_test_status", { required: "Previous test status is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select previous test status</option>
          {PREVIOUS_HIV_TEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {errors.previous_hiv_test_status && (
          <p className="mt-1 text-sm text-red-600">{errors.previous_hiv_test_status.message}</p>
        )}
      </div>

      {/* Result Documentation */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Result Documentation</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="result_form_signed"
              type="checkbox"
              {...register("result_form_signed")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="result_form_signed" className="ml-3 text-sm text-gray-700">
              Result form signed by client
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="result_form_filled"
              type="checkbox"
              {...register("result_form_filled")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="result_form_filled" className="ml-3 text-sm text-gray-700">
              Result form completely filled
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="client_received_result"
              type="checkbox"
              {...register("client_received_result")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="client_received_result" className="ml-3 text-sm text-gray-700">
              Client received test result
            </label>
          </div>
        </div>
      </div>

      {/* Partner Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Information</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="partner_uses_fp_method"
              type="checkbox"
              {...register("partner_uses_fp_method")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_uses_fp_method" className="ml-3 text-sm text-gray-700">
              Partner uses family planning method
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="partner_uses_condom"
              type="checkbox"
              {...register("partner_uses_condom")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="partner_uses_condom" className="ml-3 text-sm text-gray-700">
              Partner uses condoms
            </label>
          </div>
        </div>
      </div>

      {/* Post-Test Counseling */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Post-Test Counseling</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="post_test_counseling_done"
              type="checkbox"
              {...register("post_test_counseling_done")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="post_test_counseling_done" className="ml-3 text-sm text-gray-700">
              Post-test counseling completed
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="client_referred_to_services"
              type="checkbox"
              {...register("client_referred_to_services")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="client_referred_to_services" className="ml-3 text-sm text-gray-700">
              Client referred to appropriate services
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="risk_reduction_plan_developed"
              type="checkbox"
              {...register("risk_reduction_plan_developed")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="risk_reduction_plan_developed" className="ml-3 text-sm text-gray-700">
              Risk reduction plan developed
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="disclosure_plan_developed"
              type="checkbox"
              {...register("disclosure_plan_developed")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="disclosure_plan_developed" className="ml-3 text-sm text-gray-700">
              Disclosure plan developed
            </label>
          </div>
        </div>
      </div>

      {/* Partner/Child Testing */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Partner & Child Testing</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="will_bring_partners"
              type="checkbox"
              {...register("will_bring_partners")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="will_bring_partners" className="ml-3 text-sm text-gray-700">
              Client will bring partner(s) for testing
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="will_bring_children"
              type="checkbox"
              {...register("will_bring_children")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="will_bring_children" className="ml-3 text-sm text-gray-700">
              Client will bring children for testing
            </label>
          </div>
        </div>
      </div>

      {/* Prevention Services */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prevention Services Provided</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="provided_fp_info"
              type="checkbox"
              {...register("provided_fp_info")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="provided_fp_info" className="ml-3 text-sm text-gray-700">
              Family planning information provided
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="condom_use_demonstrated"
              type="checkbox"
              {...register("condom_use_demonstrated")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="condom_use_demonstrated" className="ml-3 text-sm text-gray-700">
              Condom use demonstrated
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="condoms_provided"
              type="checkbox"
              {...register("condoms_provided")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="condoms_provided" className="ml-3 text-sm text-gray-700">
              Condoms provided to client
            </label>
          </div>
        </div>
      </div>

      {/* Additional Tests - Only show if ordered */}
      {(availableTests.syphilis || availableTests.hepatitisB || availableTests.hepatitisC) && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">STI Screening Results</h3>
          <p className="text-sm text-gray-600 mb-4">
            These tests were ordered through the Laboratory module. Results auto-populate when completed by lab technician.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableTests.syphilis && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Syphilis Test (TPHA) <span className="text-red-500">*</span>
                  {labResultsLoaded && <Lock className="inline h-4 w-4 ml-1 text-green-600" />}
                </label>
                <select
                  {...register("syphilis_test_result", { required: availableTests.syphilis ? "Syphilis test result is required" : false })}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    labResultsLoaded 
                      ? "bg-green-50 border-green-300 text-gray-900" 
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <option value="">{labResultsLoaded ? 'Select result' : 'Waiting for lab...'}</option>
                  {ADDITIONAL_TEST_RESULTS.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
                {errors.syphilis_test_result && (
                  <p className="mt-1 text-sm text-red-600">{errors.syphilis_test_result.message}</p>
                )}
                {labResultsLoaded && (
                  <p className="mt-1 text-xs text-green-600">✓ Result loaded from lab - verify before proceeding</p>
                )}
              </div>
            )}

            {availableTests.hepatitisB && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hepatitis B Test (HBsAg) <span className="text-red-500">*</span>
                  {labResultsLoaded && <Lock className="inline h-4 w-4 ml-1 text-green-600" />}
                </label>
                <select
                  {...register("hepatitis_b_test_result", { required: availableTests.hepatitisB ? "Hepatitis B test result is required" : false })}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    labResultsLoaded 
                      ? "bg-green-50 border-green-300 text-gray-900" 
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <option value="">{labResultsLoaded ? 'Select result' : 'Waiting for lab...'}</option>
                  {ADDITIONAL_TEST_RESULTS.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
                {errors.hepatitis_b_test_result && (
                  <p className="mt-1 text-sm text-red-600">{errors.hepatitis_b_test_result.message}</p>
                )}
                {labResultsLoaded && (
                  <p className="mt-1 text-xs text-green-600">✓ Result loaded from lab - verify before proceeding</p>
                )}
              </div>
            )}

            {availableTests.hepatitisC && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hepatitis C Test (HCV-AB) <span className="text-red-500">*</span>
                  {labResultsLoaded && <Lock className="inline h-4 w-4 ml-1 text-green-600" />}
                </label>
                <select
                  {...register("hepatitis_c_test_result", { required: availableTests.hepatitisC ? "Hepatitis C test result is required" : false })}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    labResultsLoaded 
                      ? "bg-green-50 border-green-300 text-gray-900" 
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <option value="">{labResultsLoaded ? 'Select result' : 'Waiting for lab...'}</option>
                  {ADDITIONAL_TEST_RESULTS.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
                {errors.hepatitis_c_test_result && (
                  <p className="mt-1 text-sm text-red-600">{errors.hepatitis_c_test_result.message}</p>
                )}
                {labResultsLoaded && (
                  <p className="mt-1 text-xs text-green-600">✓ Result loaded from lab - verify before proceeding</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments/Notes
        </label>
        <textarea
          {...register("comments")}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter any additional notes or observations..."
        />
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
