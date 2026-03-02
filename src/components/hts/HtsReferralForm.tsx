"use client";

import { useForm } from "react-hook-form";
import { Save, SkipForward } from "lucide-react";
import { HtsReferralRequest } from "@/lib/hts";
import { useFormConfig } from "@/hooks/useFormConfig";
import { FORM_SCHEMAS } from "@/lib/form-schemas";

interface HtsReferralFormProps {
  initialData?: Partial<HtsReferralRequest>;
  onSave: (data: HtsReferralRequest) => void;
  onSkip: () => void;
  loading?: boolean;
}

export default function HtsReferralForm({ initialData, onSave, onSkip, loading }: HtsReferralFormProps) {
  const { isVisible, getLabel, getOptions } = useFormConfig("hts", FORM_SCHEMAS.hts);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HtsReferralRequest>({
    defaultValues: {
      ...initialData,
      referral_services: initialData?.referral_services || [],
    },
  });

  const onSubmit = (data: HtsReferralRequest) => {
    // Ensure referral_services is always an array (even if empty)
    if (!data.referral_services) {
      data.referral_services = [];
    }
    onSave(data);
  };

  const showReferringSection =
    isVisible("referring_org_unit") ||
    isVisible("referring_org_name") ||
    isVisible("referring_org_address") ||
    isVisible("referring_org_phone") ||
    isVisible("referring_org_contact_person");

  const showReferredSection =
    isVisible("referred_org_unit") ||
    isVisible("referred_org_name") ||
    isVisible("referred_org_address") ||
    isVisible("referred_org_phone") ||
    isVisible("referred_org_contact_person");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          This section is <strong>optional</strong>. Complete only if the client is being referred to another facility or service.
          You can skip this step if no referral is needed.
        </p>
      </div>

      {/* Referring Organization */}
      {showReferringSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Referring Organization (From)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isVisible("referring_org_unit") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referring_org_unit")}
            </label>
            <input
              type="text"
              {...register("referring_org_unit")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., HTS Unit"
            />
          </div>
          )}

          {isVisible("referring_org_name") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referring_org_name")}
            </label>
            <input
              type="text"
              {...register("referring_org_name")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., City Health Center"
            />
          </div>
          )}

          {isVisible("referring_org_address") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referring_org_address")}
            </label>
            <input
              type="text"
              {...register("referring_org_address")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Organization address"
            />
          </div>
          )}

          {isVisible("referring_org_phone") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referring_org_phone")}
            </label>
            <input
              type="tel"
              {...register("referring_org_phone")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="+234 XXX XXX XXXX"
            />
          </div>
          )}

          {isVisible("referring_org_contact_person") && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referring_org_contact_person")}
            </label>
            <input
              type="text"
              {...register("referring_org_contact_person")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Name of referring staff member"
            />
          </div>
          )}
        </div>
      </div>
      )}

      {/* Referred To Organization */}
      {showReferredSection && (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Referred To Organization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isVisible("referred_org_unit") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referred_org_unit")}
            </label>
            <input
              type="text"
              {...register("referred_org_unit")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., ART Clinic"
            />
          </div>
          )}

          {isVisible("referred_org_name") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referred_org_name")}
            </label>
            <input
              type="text"
              {...register("referred_org_name")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Regional Hospital"
            />
          </div>
          )}

          {isVisible("referred_org_address") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referred_org_address")}
            </label>
            <input
              type="text"
              {...register("referred_org_address")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Organization address"
            />
          </div>
          )}

          {isVisible("referred_org_phone") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referred_org_phone")}
            </label>
            <input
              type="tel"
              {...register("referred_org_phone")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="+234 XXX XXX XXXX"
            />
          </div>
          )}

          {isVisible("referred_org_contact_person") && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getLabel("referred_org_contact_person")}
            </label>
            <input
              type="text"
              {...register("referred_org_contact_person")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Name of receiving staff member"
            />
          </div>
          )}
        </div>
      </div>
      )}

      {/* Referral Services */}
      {isVisible("referral_services") && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getLabel("referral_services")}
        </label>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600 mb-3">Select all services the client is being referred for:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getOptions("referral_services", [
              "ART Treatment",
              "PrEP Services",
              "TB Screening",
              "STI Treatment",
              "Family Planning",
              "Psychosocial Support",
              "Nutrition Services",
              "PMTCT Services",
              "Other Medical Services",
            ]).map((service) => (
              <div key={service} className="flex items-center">
                <input
                  id={`service-${service}`}
                  type="checkbox"
                  value={service}
                  {...register("referral_services")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`service-${service}`} className="ml-3 text-sm text-gray-700">
                  {service}
                </label>
              </div>
            ))}
          </div>
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
          placeholder="Enter any additional information about the referral..."
        />
      </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="h-5 w-5 mr-2" />
          Skip Referral
        </button>

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
              Complete HTS Session
            </>
          )}
        </button>
      </div>
    </form>
  );
}
