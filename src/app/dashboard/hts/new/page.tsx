"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Save, CheckCircle } from "lucide-react";
import { htsApi, HtsInitialRequest, HtsPreTestRequest, HtsTestingRequest, HtsPostTestRequest, HtsReferralRequest } from "@/lib/hts";

// Import step components (we'll create these next)
import HtsInitialForm from "@/components/hts/HtsInitialForm";
import HtsPreTestForm from "@/components/hts/HtsPreTestForm";
import HtsLabOrderingStep from "@/components/hts/HtsLabOrderingStep";
import HtsTestingForm from "@/components/hts/HtsTestingForm";
import HtsPostTestForm from "@/components/hts/HtsPostTestForm";
import HtsReferralForm from "@/components/hts/HtsReferralForm";

const STEPS = [
  { id: 1, name: "Initial Information", description: "Client demographics and session details" },
  { id: 2, name: "Pre-Test Counseling", description: "Knowledge assessment and risk evaluation" },
  { id: 3, name: "Lab Ordering", description: "Create lab order for HIV testing" },
  { id: 4, name: "HIV Testing", description: "Screening and confirmatory test results" },
  { id: 5, name: "Post-Test Counseling", description: "Results disclosure and counseling" },
  { id: 6, name: "Referral (Optional)", description: "Referral to other services" },
];

export default function NewHtsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patient_id");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htsInitialId, setHtsInitialId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Form data states
  const [initialData, setInitialData] = useState<Partial<HtsInitialRequest>>({});
  const [preTestData, setPreTestData] = useState<Partial<HtsPreTestRequest>>({});
  const [testingData, setTestingData] = useState<Partial<HtsTestingRequest>>({});
  const [postTestData, setPostTestData] = useState<Partial<HtsPostTestRequest>>({});
  const [referralData, setReferralData] = useState<Partial<HtsReferralRequest>>({});

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveStep = async (stepNumber: number, data: any) => {
    setLoading(true);
    setError(null);

    try {
      switch (stepNumber) {
        case 1:
          // Create HTS Initial
          const initialResponse = await htsApi.createInitial(data as HtsInitialRequest);
          setHtsInitialId(initialResponse.id);
          setPatientId(data.patient_id);
          setInitialData(data);
          setCompletedSteps([...completedSteps, 1]);
          handleNext();
          break;

        case 2:
          if (!htsInitialId) {
            throw new Error("HTS Initial ID not found. Please complete Step 1 first.");
          }
          await htsApi.createPreTest(htsInitialId, data as HtsPreTestRequest);
          setPreTestData(data);
          setCompletedSteps([...completedSteps, 2]);
          handleNext();
          break;

        case 3:
          // Lab ordering step - just navigation, no API call
          setCompletedSteps([...completedSteps, 3]);
          handleNext();
          break;

        case 4:
          if (!htsInitialId) {
            throw new Error("HTS Initial ID not found. Please complete Step 1 first.");
          }
          await htsApi.createTesting(htsInitialId, data as HtsTestingRequest);
          setTestingData(data);
          setCompletedSteps([...completedSteps, 4]);
          handleNext();
          break;

        case 5:
          if (!htsInitialId) {
            throw new Error("HTS Initial ID not found. Please complete Step 1 first.");
          }
          await htsApi.createPostTest(htsInitialId, data as HtsPostTestRequest);
          setPostTestData(data);
          setCompletedSteps([...completedSteps, 5]);
          handleNext();
          break;

        case 6:
          if (!htsInitialId) {
            throw new Error("HTS Initial ID not found. Please complete Step 1 first.");
          }
          if (Object.keys(data).length > 0) {
            await htsApi.createReferral(htsInitialId, data as HtsReferralRequest);
            setReferralData(data);
          }
          setCompletedSteps([...completedSteps, 6]);
          // Redirect to HTS detail page
          router.push(`/dashboard/hts/${htsInitialId}`);
          break;

        default:
          break;
      }
    } catch (err: any) {
      console.error("Error saving HTS step:", err);

      // Handle specific error cases
      if (err.response?.status === 409) {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || "";

        // Check if it's a unique constraint violation
        if (errorMessage.includes("unique_patient_hts") || errorMessage.includes("patient_id") && errorMessage.includes("date_of_visit")) {
          setError("This patient already has an HTS session scheduled for this date. Please choose a different date or patient.");
        } else if (errorMessage.includes("client_code")) {
          setError("The client code already exists. Please refresh the page and try again.");
        } else {
          setError(`Conflict: ${errorMessage || "A record with this information already exists"}. Please try again or contact support.`);
        }
      } else {
        setError(err.message || "Failed to save step. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <HtsInitialForm
            initialData={initialData}
            preselectedPatientId={preselectedPatientId}
            onSave={(data) => handleSaveStep(1, data)}
            loading={loading}
          />
        );
      case 2:
        return (
          <HtsPreTestForm
            initialData={preTestData}
            onSave={(data) => handleSaveStep(2, data)}
            loading={loading}
          />
        );
      case 3:
        return (
          <HtsLabOrderingStep
            htsInitialId={htsInitialId!}
            patientId={patientId!}
            onNext={() => handleSaveStep(3, {})}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <HtsTestingForm
            initialData={testingData}
            onSave={(data) => handleSaveStep(4, data)}
            loading={loading}
            htsInitialId={htsInitialId}
          />
        );
      case 5:
        return (
          <HtsPostTestForm
            initialData={postTestData}
            onSave={(data) => handleSaveStep(5, data)}
            loading={loading}
            htsInitialId={htsInitialId}
          />
        );
      case 6:
        return (
          <HtsReferralForm
            initialData={referralData}
            onSave={(data) => handleSaveStep(6, data)}
            onSkip={() => handleSaveStep(6, {})}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">New HTS Session</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete the HIV Testing Services workflow step by step
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                  {completedSteps.includes(step.id) ? (
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-blue-600" />
                    </div>
                  ) : (
                    stepIdx !== STEPS.length - 1 && (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-200" />
                      </div>
                    )
                  )}
                  <div
                    className={`relative w-10 h-10 flex items-center justify-center rounded-full ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : completedSteps.includes(step.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-500'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 hidden sm:block">
                    <p className={`text-xs font-medium ${currentStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{STEPS[currentStep - 1].name}</h2>
            <p className="mt-1 text-sm text-gray-600">{STEPS[currentStep - 1].description}</p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep < STEPS.length && (
            <p className="text-sm text-gray-500 self-center">
              Step {currentStep} of {STEPS.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
