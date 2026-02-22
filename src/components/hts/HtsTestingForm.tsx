"use client";

import { useForm } from "react-hook-form";
import { Save, CheckCircle, Lock } from "lucide-react";
import { HtsTestingRequest, TEST_RESULTS } from "@/lib/hts";
import { getOrdersByService, getResultsByService, LabTestOrderWithDetails } from "@/lib/laboratory";
import { useEffect, useState } from "react";

interface HtsTestingFormProps {
  initialData?: Partial<HtsTestingRequest>;
  onSave: (data: HtsTestingRequest) => void;
  loading?: boolean;
  htsInitialId?: string; // For fetching lab results (UUID)
}

type ServiceLabResultEntry = {
  value?: string | null;
  data?: { result?: string | null } | null;
  date?: string | null;
  interpretation?: string | null;
};

type ServiceLabResultsMap = Record<string, ServiceLabResultEntry>;

const normalizeResult = (value?: string | null): "Reactive" | "Non-reactive" | "Not done" => {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "REACTIVE" || normalized === "POSITIVE") return "Reactive";
  if (normalized === "NON-REACTIVE" || normalized === "NEGATIVE" || normalized === "NON REACTIVE") {
    return "Non-reactive";
  }
  return "Not done";
};

const extractResultValue = (entry?: ServiceLabResultEntry | null): string | null => {
  if (!entry) return null;
  return entry.value ?? entry.data?.result ?? null;
};

const getResultByKeys = (results: ServiceLabResultsMap, keys: string[]): ServiceLabResultEntry | null => {
  for (const key of keys) {
    if (results[key]) return results[key];
  }
  return null;
};

const getResultColor = (value?: string | null): string => {
  const normalized = (value || "").toUpperCase();
  if (normalized.includes("REACTIVE") || normalized.includes("POSITIVE")) return "text-red-600";
  if (normalized.includes("NON-REACTIVE") || normalized.includes("NEGATIVE")) return "text-green-600";
  return "text-gray-600";
};

export default function HtsTestingForm({ initialData, onSave, loading, htsInitialId }: HtsTestingFormProps) {
  const [labResultsLoaded, setLabResultsLoaded] = useState(false);
  const [loadingLabResults, setLoadingLabResults] = useState(false);
  const [serviceLabResults, setServiceLabResults] = useState<ServiceLabResultsMap>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<HtsTestingRequest>({
    defaultValues: initialData,
  });

  const screeningResult = watch("screening_test_result");

  // Auto-fill from lab results
  useEffect(() => {
    const loadLabResults = async () => {
      if (!htsInitialId) return;

      try {
        setLoadingLabResults(true);
        const [results, orders] = await Promise.all([
          getResultsByService("HTS", htsInitialId),
          getOrdersByService("HTS", htsInitialId),
        ]);
        setServiceLabResults(results as ServiceLabResultsMap);

        const completedStatuses = new Set(["Completed", "Reviewed", "Communicated"]);
        const hasResult = (order: LabTestOrderWithDetails) =>
          completedStatuses.has(order.status) && !!(order.result_value || (order.result_data as { result?: string } | null)?.result);

        const rapidOrders = (orders || [])
          .filter((order) => {
            const code = order.test_info?.test_code?.toUpperCase();
            return (code === "HIV_RAPID" || code === "HIV-RAPID") && hasResult(order);
          })
          .sort((a, b) => {
            const aTime = new Date(a.resulted_at || a.ordered_at || a.created_at).getTime();
            const bTime = new Date(b.resulted_at || b.ordered_at || b.created_at).getTime();
            return aTime - bTime;
          });

        const repeatRapidOrder = rapidOrders.find((order) => !!order.parent_order_id) || null;

        // Check for HIV_RAPID (screening test)
        const screening = getResultByKeys(results as ServiceLabResultsMap, ["HIV_RAPID", "HIV-RAPID"]);
        if (screening) {
          const value = extractResultValue(screening);
          const date = screening.date;
          setValue("screening_test_result", normalizeResult(value));
          if (date) {
            setValue("screening_test_date", date.split("T")[0]);
          }
          setLabResultsLoaded(true);
        }

        // Check for HIV_DNA (confirmatory test)
        const confirmatory = getResultByKeys(results as ServiceLabResultsMap, ["HIV_DNA", "HIV-DNA"]);
        if (confirmatory) {
          const value = extractResultValue(confirmatory);
          const date = confirmatory.date;
          setValue("confirmatory_test_result", normalizeResult(value));
          if (date) {
            setValue("confirmatory_test_date", date.split("T")[0]);
          }
        }

        // If no HIV_DNA result, use repeat HIV_RAPID as confirmatory fallback
        if (!confirmatory && repeatRapidOrder) {
          const repeatValue =
            repeatRapidOrder.result_value ??
            ((repeatRapidOrder.result_data as { result?: string } | null)?.result ?? null);

          setValue("confirmatory_test_result", normalizeResult(repeatValue));
          if (repeatRapidOrder.resulted_at) {
            setValue("confirmatory_test_date", repeatRapidOrder.resulted_at.split("T")[0]);
          }
        }

        // Auto-set final result based on screening
        if (screening) {
          const screeningValue = extractResultValue(screening);
          if (confirmatory) {
            // If confirmatory exists, use that
            setValue("final_result", normalizeResult(extractResultValue(confirmatory)));
          } else if (repeatRapidOrder) {
            const repeatValue =
              repeatRapidOrder.result_value ??
              ((repeatRapidOrder.result_data as { result?: string } | null)?.result ?? null);
            setValue("final_result", normalizeResult(repeatValue));
          } else {
            // Otherwise use screening result
            setValue("final_result", normalizeResult(screeningValue));
          }
        }
      } catch (error) {
        console.error("Failed to load lab results:", error);
        // Don't set error state - just allow manual entry
      } finally {
        setLoadingLabResults(false);
      }
    };

    loadLabResults();
  }, [htsInitialId, setValue]);

  const onSubmit = (data: HtsTestingRequest) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lab Results Auto-Fill Badge */}
      {labResultsLoaded && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-800">Lab Results Loaded</h4>
            <p className="mt-1 text-sm text-green-700">
              Test results from laboratory are displayed below. Review and confirm to continue.
            </p>
          </div>
        </div>
      )}

      {/* Waiting for Lab Results */}
      {!labResultsLoaded && !loadingLabResults && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <svg className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800">Waiting for Lab Results</h4>
            <p className="mt-1 text-sm text-yellow-700">
              Lab tests must be completed before you can proceed. Return to the Lab Ordering step to check test status, or wait for the laboratory to complete the tests.
            </p>
          </div>
        </div>
      )}

      {loadingLabResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-blue-700">Loading lab results...</p>
        </div>
      )}

      {/* Screening Test */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Screening Test Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screening Test Result <span className="text-red-500">*</span>
              {labResultsLoaded && <Lock className="inline h-4 w-4 ml-2 text-green-600" />}
            </label>
            <select
              {...register("screening_test_result", { required: "Screening result is required" })}
              disabled={true}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm cursor-not-allowed ${
                labResultsLoaded 
                  ? "bg-green-50 border-green-300 text-gray-700" 
                  : "bg-gray-100 border-gray-300 text-gray-500"
              }`}
            >
              <option value="">Waiting for lab results...</option>
              {TEST_RESULTS.map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </select>
            {errors.screening_test_result && (
              <p className="mt-1 text-sm text-red-600">{errors.screening_test_result.message}</p>
            )}
            {!labResultsLoaded && (
              <p className="mt-1 text-xs text-gray-500">Results will auto-populate from laboratory</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screening Test Date <span className="text-red-500">*</span>
              {labResultsLoaded && <Lock className="inline h-4 w-4 ml-2 text-green-600" />}
            </label>
            <input
              type="date"
              {...register("screening_test_date", { required: "Screening date is required" })}
              disabled={true}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm cursor-not-allowed ${
                labResultsLoaded 
                  ? "bg-green-50 border-green-300 text-gray-700" 
                  : "bg-gray-100 border-gray-300 text-gray-500"
              }`}
            />
            {errors.screening_test_date && (
              <p className="mt-1 text-sm text-red-600">{errors.screening_test_date.message}</p>
            )}
            {!labResultsLoaded && (
              <p className="mt-1 text-xs text-gray-500">Date will auto-populate from laboratory</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmatory Test (conditional) */}
      {screeningResult === "Reactive" && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmatory Test Results (Required for Reactive Screening)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmatory Test Result
                {labResultsLoaded && <Lock className="inline h-4 w-4 ml-2 text-green-600" />}
              </label>
              <select
                {...register("confirmatory_test_result")}
                disabled={true}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm cursor-not-allowed ${
                  labResultsLoaded 
                    ? "bg-green-50 border-green-300 text-gray-700" 
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}
              >
                <option value="">Waiting for confirmatory test...</option>
                {TEST_RESULTS.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
              {!labResultsLoaded && (
                <p className="mt-1 text-xs text-gray-500">Confirmatory test must be ordered and completed in lab</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmatory Test Date
                {labResultsLoaded && <Lock className="inline h-4 w-4 ml-2 text-green-600" />}
              </label>
              <input
                type="date"
                {...register("confirmatory_test_date")}
                disabled={true}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm cursor-not-allowed ${
                  labResultsLoaded 
                    ? "bg-green-50 border-green-300 text-gray-700" 
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Final Result */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Final Result</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final HIV Test Result <span className="text-red-500">*</span>
            {labResultsLoaded && <Lock className="inline h-4 w-4 ml-2 text-green-600" />}
          </label>
          <select
            {...register("final_result", { required: "Final result is required" })}
            disabled={true}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm cursor-not-allowed ${
              labResultsLoaded 
                ? "bg-green-50 border-green-300 text-gray-700" 
                : "bg-gray-100 border-gray-300 text-gray-500"
            }`}
          >
            <option value="">Waiting for lab results...</option>
            {TEST_RESULTS.map((result) => (
              <option key={result} value={result}>
                {result}
              </option>
            ))}
          </select>
          {errors.final_result && (
            <p className="mt-1 text-sm text-red-600">{errors.final_result.message}</p>
          )}
          {!labResultsLoaded && (
            <p className="mt-2 text-xs text-gray-500">
              Final result will be determined automatically from lab test results
            </p>
          )}
          {labResultsLoaded && (
            <p className="mt-2 text-sm text-gray-500">
              {screeningResult === "Reactive"
                ? "For reactive screening, final result matches confirmatory test result"
                : "Final result based on screening test"
              }
            </p>
          )}
        </div>
      </div>

      {/* STI Screening Results (Read-only display) */}
      {labResultsLoaded && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">STI Co-infection Screening Results</h3>
          <p className="text-sm text-gray-600 mb-4">
            Results from additional screening tests ordered with this HTS session
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const syphilis = getResultByKeys(serviceLabResults, ["TPHA", "VDRL", "RPR", "SYPHILIS_RAPID", "SYPHILIS-RAPID"]);
              if (!syphilis) return null;
              const value = extractResultValue(syphilis);
              return (
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Syphilis Screening</p>
                  <p className={`text-lg font-semibold ${getResultColor(value)}`}>{value || "Pending"}</p>
                  {syphilis.date && (
                    <p className="text-xs text-gray-500 mt-1">{new Date(syphilis.date).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })()}

            {(() => {
              const hepB = getResultByKeys(serviceLabResults, ["HBSAG", "HBsAg", "HBV_RAPID", "HBV-RAPID"]);
              if (!hepB) return null;
              const value = extractResultValue(hepB);
              return (
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Hepatitis B (HBsAg)</p>
                  <p className={`text-lg font-semibold ${getResultColor(value)}`}>{value || "Pending"}</p>
                  {hepB.date && (
                    <p className="text-xs text-gray-500 mt-1">{new Date(hepB.date).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })()}

            {(() => {
              const hepC = getResultByKeys(serviceLabResults, ["HCV_AB", "HCVAB", "HCV_RAPID", "HCV-RAPID"]);
              if (!hepC) return null;
              const value = extractResultValue(hepC);
              return (
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Hepatitis C (HCV-AB)</p>
                  <p className={`text-lg font-semibold ${getResultColor(value)}`}>{value || "Pending"}</p>
                  {hepC.date && (
                    <p className="text-xs text-gray-500 mt-1">{new Date(hepC.date).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })()}
          </div>

          <p className="text-xs text-gray-500 mt-4 italic">
            Note: STI screening results are read-only here and remain source-of-truth in the laboratory module.
          </p>
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
