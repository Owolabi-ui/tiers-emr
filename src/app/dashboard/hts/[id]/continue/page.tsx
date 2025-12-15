"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { htsApi, CompleteHtsWorkflow } from "@/lib/hts";
import HtsLabOrderingStep from "@/components/hts/HtsLabOrderingStep";
import HtsTestingForm from "@/components/hts/HtsTestingForm";
import HtsPostTestForm from "@/components/hts/HtsPostTestForm";
import HtsReferralForm from "@/components/hts/HtsReferralForm";

const STEPS = [
  { id: 3, name: "Lab Ordering", description: "Create lab order for HIV testing" },
  { id: 4, name: "HIV Testing", description: "Screening and confirmatory test results" },
  { id: 5, name: "Post-Test Counseling", description: "Results disclosure and counseling" },
  { id: 6, name: "Referral (Optional)", description: "Referral to other services" },
];

export default function ContinueHtsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htsData, setHtsData] = useState<CompleteHtsWorkflow | null>(null);
  const [currentStep, setCurrentStep] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHtsData = async () => {
      try {
        const data = await htsApi.getComplete(id);
        setHtsData(data);
        
        // Determine which step to resume from
        if (!data.testing) {
          setCurrentStep(3); // Lab ordering
        } else if (!data.post_test) {
          setCurrentStep(5); // Post-test counseling
        } else if (!data.referral) {
          setCurrentStep(6); // Referral
        } else {
          // Session is complete, redirect to details
          router.push(`/dashboard/hts/${id}`);
          return;
        }
      } catch (err: any) {
        console.error("Error fetching HTS data:", err);
        setError(err.message || "Failed to load HTS session");
      } finally {
        setLoading(false);
      }
    };

    fetchHtsData();
  }, [id, router]);

  const handleNext = () => {
    if (currentStep === 3) setCurrentStep(4);
    else if (currentStep === 4) setCurrentStep(5);
    else if (currentStep === 5) setCurrentStep(6);
  };

  const handlePrevious = () => {
    if (currentStep === 4) setCurrentStep(3);
    else if (currentStep === 5) setCurrentStep(4);
    else if (currentStep === 6) setCurrentStep(5);
  };

  const handleSaveStep = async (stepNumber: number, data: any) => {
    setSaving(true);
    setError(null);

    try {
      switch (stepNumber) {
        case 3:
          // Lab ordering - just navigation
          handleNext();
          break;

        case 4:
          await htsApi.createTesting(id, data);
          handleNext();
          break;

        case 5:
          await htsApi.createPostTest(id, data);
          handleNext();
          break;

        case 6:
          if (Object.keys(data).length > 0) {
            await htsApi.createReferral(id, data);
          }
          // Redirect to detail page
          router.push(`/dashboard/hts/${id}`);
          break;

        default:
          break;
      }
    } catch (err: any) {
      console.error("Error saving HTS step:", err);
      setError(err.message || "Failed to save step. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    if (!htsData) return null;

    switch (currentStep) {
      case 3:
        return (
          <HtsLabOrderingStep
            htsInitialId={id}
            patientId={htsData.initial.patient_id}
            onNext={() => handleSaveStep(3, {})}
            onPrevious={() => router.push(`/dashboard/hts/${id}`)}
          />
        );
      case 4:
        return (
          <HtsTestingForm
            initialData={htsData.testing || {}}
            onSave={(data) => handleSaveStep(4, data)}
            loading={saving}
            htsInitialId={id}
          />
        );
      case 5:
        return (
          <HtsPostTestForm
            initialData={htsData.post_test || {}}
            onSave={(data) => handleSaveStep(5, data)}
            loading={saving}
            htsInitialId={id}
          />
        );
      case 6:
        return (
          <HtsReferralForm
            initialData={htsData.referral || {}}
            onSave={(data) => handleSaveStep(6, data)}
            onSkip={() => handleSaveStep(6, {})}
            loading={saving}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading HTS session...</p>
        </div>
      </div>
    );
  }

  if (error || !htsData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || "HTS session not found"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-red-600 hover:text-red-800 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/hts/${id}`)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Session Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Continue HTS Session</h1>
          <p className="mt-2 text-sm text-gray-600">
            Client Code: <span className="font-medium">{htsData.initial.client_code}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === step.id
                        ? "bg-[#5b21b6] text-white"
                        : currentStep > step.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
