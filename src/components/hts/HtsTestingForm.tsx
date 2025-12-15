"use client";

import { useForm } from "react-hook-form";
import { Save, CheckCircle, Lock } from "lucide-react";
import { HtsTestingRequest, TEST_RESULTS } from "@/lib/hts";
import { getResultsByService } from "@/lib/laboratory";
import { useEffect, useState } from "react";

interface HtsTestingFormProps {
  initialData?: Partial<HtsTestingRequest>;
  onSave: (data: HtsTestingRequest) => void;
  loading?: boolean;
  htsInitialId?: string; // For fetching lab results (UUID)
}

export default function HtsTestingForm({ initialData, onSave, loading, htsInitialId }: HtsTestingFormProps) {
  const [labResultsLoaded, setLabResultsLoaded] = useState(false);
  const [loadingLabResults, setLoadingLabResults] = useState(false);

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
        const results = await getResultsByService("HTS", htsInitialId);

        // Check for HIV_RAPID (screening test)
        if (results.HIV_RAPID) {
          const { value, date } = results.HIV_RAPID;
          setValue("screening_test_result", value as "Reactive" | "Non-reactive");
          if (date) {
            setValue("screening_test_date", date.split("T")[0]);
          }
          setLabResultsLoaded(true);
        }

        // Check for HIV_DNA (confirmatory test)
        if (results.HIV_DNA) {
          const { value, date } = results.HIV_DNA;
          setValue("confirmatory_test_result", value as "Reactive" | "Non-reactive");
          if (date) {
            setValue("confirmatory_test_date", date.split("T")[0]);
          }
        }

        // Auto-set final result based on screening
        if (results.HIV_RAPID) {
          const screeningValue = results.HIV_RAPID.value;
          if (results.HIV_DNA) {
            // If confirmatory exists, use that
            setValue("final_result", results.HIV_DNA.value as "Reactive" | "Non-reactive");
          } else {
            // Otherwise use screening result
            setValue("final_result", screeningValue as "Reactive" | "Non-reactive");
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
