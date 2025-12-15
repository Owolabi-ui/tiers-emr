"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import {
  HtsInitialRequest,
  TARGET_GROUP_CODES,
  HTS_TYPES,
  HTS_SETTINGS,
  TESTING_MODALITIES,
  SESSION_TYPES,
  REFERRAL_SOURCES,
  SEX_PARTNERS,
} from "@/lib/hts";
import { MARITAL_STATUSES, EDUCATIONAL_LEVELS, OCCUPATION_TYPES, patientsApi } from "@/lib/patients";

interface HtsInitialFormProps {
  initialData?: Partial<HtsInitialRequest>;
  onSave: (data: HtsInitialRequest) => void;
  loading?: boolean;
}

export default function HtsInitialForm({ initialData, onSave, loading }: HtsInitialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<HtsInitialRequest>({
    defaultValues: initialData || {
      first_time_visit: true,
      num_children_under_15: 0,
    },
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Server-side search with debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if input is too short or patient already selected
    if (patientSearch.length < 2 || selectedPatient) {
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const response = await patientsApi.search({
          search: patientSearch,
          page: 1,
          page_size: 20, // Only fetch top 20 results
        });
        const patientList = response.patients || response.data || [];
        setSearchResults(patientList);
      } catch (error) {
        console.error("Error searching patients:", error);
        setSearchResults([]);
      } finally {
        setLoadingPatients(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [patientSearch, selectedPatient]);

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setValue("patient_id", patient.id);
    setPatientSearch(`${patient.first_name} ${patient.last_name} - ${patient.hospital_number || patient.hospital_no}`);
    setShowPatientDropdown(false);
    setSearchResults([]);
  };

  const handleSearchChange = (value: string) => {
    setPatientSearch(value);
    // Clear selection if user starts typing again
    if (selectedPatient && value !== `${selectedPatient.first_name} ${selectedPatient.last_name} - ${selectedPatient.hospital_number || selectedPatient.hospital_no}`) {
      setSelectedPatient(null);
      setValue("patient_id", "");
    }
    setShowPatientDropdown(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate a unique client code
  const generateClientCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HTS-${year}${month}${day}-${time}${milliseconds}${random}`;
  };

  // Auto-generate client code on mount
  useEffect(() => {
    if (!initialData?.client_code) {
      setValue("client_code", generateClientCode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (data: HtsInitialRequest) => {
    // Regenerate client code right before submission to ensure uniqueness
    if (!initialData?.client_code) {
      data.client_code = generateClientCode();
      setValue("client_code", data.client_code);
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection - Searchable */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Patient <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowPatientDropdown(true)}
            placeholder="Search by name or hospital number..."
            className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500"
          />
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Loading/Clear Icon */}
          {loadingPatients && patientSearch.length >= 2 ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            </div>
          ) : patientSearch && (
            <button
              type="button"
              onClick={() => {
                setPatientSearch("");
                setSelectedPatient(null);
                setValue("patient_id", "");
                setSearchResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input
          type="hidden"
          {...register("patient_id", { required: "Patient is required" })}
        />
        {errors.patient_id && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.patient_id.message}
          </p>
        )}

        {/* Loading state */}
        {showPatientDropdown && loadingPatients && patientSearch.length >= 2 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 text-center animate-fadeIn">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Searching patients...</span>
            </div>
          </div>
        )}

        {/* Dropdown List */}
        {showPatientDropdown && !loadingPatients && searchResults.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto animate-fadeIn">
            <div className="py-1">
              {searchResults.map((patient, index) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:bg-purple-50 dark:focus:bg-purple-900/20 focus:outline-none transition-colors duration-150 ease-in-out border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {patient.first_name} {patient.middle_name || ''} {patient.last_name}
                        </div>
                      </div>
                      <div className="flex items-center mt-1.5 text-xs text-gray-500 dark:text-gray-400 space-x-3">
                        <span className="inline-flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {patient.hospital_number || patient.hospital_no}
                        </span>
                        <span>•</span>
                        <span>{patient.sex}</span>
                        <span>•</span>
                        <span>Age: {patient.age || 'N/A'}</span>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
              Showing {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </div>
          </div>
        )}

        {/* No results message */}
        {showPatientDropdown && !loadingPatients && patientSearch.length >= 2 && searchResults.length === 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-6 text-center animate-fadeIn">
            <svg className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No patients found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No results matching <span className="font-semibold text-gray-700 dark:text-gray-300">"{patientSearch}"</span>
            </p>
          </div>
        )}

        {/* Instruction message */}
        {showPatientDropdown && !loadingPatients && patientSearch.length > 0 && patientSearch.length < 2 && (
          <div className="absolute z-10 mt-2 w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4 animate-fadeIn">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Type at least 2 characters to search
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Date of Visit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date of Visit <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register("date_of_visit", { required: "Date of visit is required" })}
          className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   dark:bg-gray-700 dark:text-white
                   transition-all duration-200 ease-in-out
                   hover:border-gray-400 dark:hover:border-gray-500"
        />
        {errors.date_of_visit && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.date_of_visit.message}
          </p>
        )}
      </div>

      {/* Client Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Client Code <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Auto-generated)</span>
        </label>
        <input
          type="text"
          {...register("client_code", { required: "Client code is required" })}
          readOnly
          className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed
                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Client code will be auto-generated"
        />
        {errors.client_code && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.client_code.message}
          </p>
        )}
      </div>

      {/* Two-column grid for demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Group Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Group <span className="text-red-500">*</span>
          </label>
          <select
            {...register("target_group_code", { required: "Target group is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select target group</option>
            {TARGET_GROUP_CODES.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          {errors.target_group_code && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.target_group_code.message}
            </p>
          )}
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Marital Status <span className="text-red-500">*</span>
          </label>
          <select
            {...register("marital_status", { required: "Marital status is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select marital status</option>
            {MARITAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.marital_status && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.marital_status.message}
            </p>
          )}
        </div>

        {/* Type of HTS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type of HTS <span className="text-red-500">*</span>
          </label>
          <select
            {...register("type_of_hts", { required: "HTS type is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select HTS type</option>
            {HTS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type_of_hts && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.type_of_hts.message}
            </p>
          )}
        </div>

        {/* Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Setting <span className="text-red-500">*</span>
          </label>
          <select
            {...register("settings", { required: "Setting is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select setting</option>
            {HTS_SETTINGS.map((setting) => (
              <option key={setting} value={setting}>
                {setting}
              </option>
            ))}
          </select>
          {errors.settings && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.settings.message}
            </p>
          )}
        </div>

        {/* Testing Modality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Testing Modality <span className="text-red-500">*</span>
          </label>
          <select
            {...register("testing_modality", { required: "Testing modality is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select testing modality</option>
            {TESTING_MODALITIES.map((modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>
          {errors.testing_modality && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.testing_modality.message}
            </p>
          )}
        </div>

        {/* Type of Session */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type of Session <span className="text-red-500">*</span>
          </label>
          <select
            {...register("type_of_session", { required: "Session type is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select session type</option>
            {SESSION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type_of_session && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.type_of_session.message}
            </p>
          )}
        </div>

        {/* Number of Children Under 15 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Children Under 15 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            {...register("num_children_under_15", {
              required: "Number of children is required",
              valueAsNumber: true,
            })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500"
          />
          {errors.num_children_under_15 && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.num_children_under_15.message}
            </p>
          )}
        </div>

        {/* Source of Referral */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source of Referral <span className="text-red-500">*</span>
          </label>
          <select
            {...register("source_of_referral", { required: "Source of referral is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select referral source</option>
            {REFERRAL_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
          {errors.source_of_referral && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.source_of_referral.message}
            </p>
          )}
        </div>

        {/* Sex Partners */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sex Partners <span className="text-red-500">*</span>
          </label>
          <select
            {...register("sex_partners", { required: "Sex partners is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select sex partners</option>
            {SEX_PARTNERS.map((partner) => (
              <option key={partner} value={partner}>
                {partner}
              </option>
            ))}
          </select>
          {errors.sex_partners && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.sex_partners.message}
            </p>
          )}
        </div>

        {/* Educational Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Educational Level <span className="text-red-500">*</span>
          </label>
          <select
            {...register("educational_level", { required: "Educational level is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select educational level</option>
            {EDUCATIONAL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.educational_level && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.educational_level.message}
            </p>
          )}
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Occupation <span className="text-red-500">*</span>
          </label>
          <select
            {...register("occupation", { required: "Occupation is required" })}
            className="block w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     dark:bg-gray-700 dark:text-white
                     transition-all duration-200 ease-in-out
                     hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          >
            <option value="">Select occupation</option>
            {OCCUPATION_TYPES.map((occupation) => (
              <option key={occupation} value={occupation}>
                {occupation}
              </option>
            ))}
          </select>
          {errors.occupation && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.occupation.message}
            </p>
          )}
        </div>
      </div>

      {/* First Time Visit Checkbox */}
      <div className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <input
          id="first_time_visit"
          type="checkbox"
          {...register("first_time_visit")}
          className="h-5 w-5 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-all duration-150"
        />
        <label htmlFor="first_time_visit" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          First Time Visit
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
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
