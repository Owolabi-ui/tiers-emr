'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, AlertCircle, CheckCircle2, Loader2, FlaskConical } from 'lucide-react';
import { CreatePrepCommencementRequest, PrepType } from '@/lib/prep';
import { getResultsByService } from '@/lib/laboratory';

interface PrepCommencementFormProps {
  htsInitialId: string;
  patientId: string;
  initialData?: Partial<CreatePrepCommencementRequest>;
  onSave: (data: CreatePrepCommencementRequest) => void;
  loading: boolean;
}

export default function PrepCommencementForm({
  htsInitialId,
  patientId,
  initialData,
  onSave,
  loading,
}: PrepCommencementFormProps) {
  const [labResults, setLabResults] = useState<Record<string, any>>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [labError, setLabError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreatePrepCommencementRequest>({
    defaultValues: initialData || {
      history_of_drug_allergies: false,
      transferred_in: false,
    },
  });

  const history_of_drug_allergies = watch('history_of_drug_allergies');
  const transferred_in = watch('transferred_in');

  // Fetch lab results for baseline tests
  useEffect(() => {
    const fetchLabResults = async () => {
      try {
        setLoadingResults(true);
        setLabError(null);
        const results = await getResultsByService('PREP_BASELINE', htsInitialId);
        setLabResults(results);

        // Validate required baseline tests
        const hasHIV = results.HIV_RAPID;
        const hasCreatinine = results.CREATININE;
        const hasHepB = results.HBSAG;

        if (!hasHIV || !hasCreatinine || !hasHepB) {
          setLabError('Baseline laboratory tests are incomplete. Please ensure all mandatory tests are completed.');
        } else if (results.HIV_RAPID?.value?.toLowerCase().includes('reactive')) {
          setLabError('CRITICAL: HIV test is REACTIVE. Client is NOT eligible for PREP. Refer for HIV care.');
        }
      } catch (err) {
        console.error('Error fetching lab results:', err);
        setLabError('No baseline lab results found. Please order and complete baseline tests first.');
      } finally {
        setLoadingResults(false);
      }
    };

    fetchLabResults();
  }, [htsInitialId]);

  const onSubmit = (data: CreatePrepCommencementRequest) => {
    // Don't allow submission if HIV is reactive
    if (labResults.HIV_RAPID?.value?.toLowerCase().includes('reactive')) {
      alert('Cannot initiate PREP: HIV test is reactive');
      return;
    }

    onSave(data);
  };

  const getResultValue = (testCode: string) => {
    return labResults[testCode]?.value || 'Pending';
  };

  const getResultInterpretation = (testCode: string) => {
    const result = labResults[testCode];
    if (!result) return 'pending';
    
    const value = result.value?.toLowerCase() || '';
    const interpretation = result.interpretation?.toLowerCase() || '';
    
    if (testCode === 'HIV_RAPID') {
      if (value.includes('non-reactive')) return 'safe';
      if (value.includes('reactive')) return 'critical';
    }
    
    if (interpretation === 'normal') return 'safe';
    if (interpretation === 'abnormal' || interpretation === 'critical') return 'warning';
    
    return 'pending';
  };

  const getResultColor = (interpretation: string) => {
    switch (interpretation) {
      case 'safe':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'critical':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lab Results Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              Baseline Laboratory Results
            </h3>

            {loadingResults ? (
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading laboratory results...
              </div>
            ) : labError ? (
              <div className={`p-3 rounded-md border ${labError.includes('CRITICAL') ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
                <p className={`text-sm ${labError.includes('CRITICAL') ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                  {labError}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('HIV_RAPID'))}`}>
                  <span className="text-sm font-medium">HIV Rapid Test:</span>
                  <span className="text-sm">{getResultValue('HIV_RAPID')}</span>
                </div>
                <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('CREATININE'))}`}>
                  <span className="text-sm font-medium">Creatinine:</span>
                  <span className="text-sm">{getResultValue('CREATININE')}</span>
                </div>
                <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('HBSAG'))}`}>
                  <span className="text-sm font-medium">Hepatitis B (HBsAg):</span>
                  <span className="text-sm">{getResultValue('HBSAG')}</span>
                </div>
                {labResults.PREGNANCY && (
                  <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('PREGNANCY'))}`}>
                    <span className="text-sm font-medium">Pregnancy Test:</span>
                    <span className="text-sm">{getResultValue('PREGNANCY')}</span>
                  </div>
                )}
                {(labResults.ALT || labResults.AST) && (
                  <>
                    {labResults.ALT && (
                      <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('ALT'))}`}>
                        <span className="text-sm font-medium">ALT (Liver):</span>
                        <span className="text-sm">{getResultValue('ALT')}</span>
                      </div>
                    )}
                    {labResults.AST && (
                      <div className={`flex justify-between p-2 rounded border ${getResultColor(getResultInterpretation('AST'))}`}>
                        <span className="text-sm font-medium">AST (Liver):</span>
                        <span className="text-sm">{getResultValue('AST')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adherence Counseling Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date of Initial Adherence Counseling <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            {...register('date_initial_adherence_counseling', { required: 'This field is required' })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        {errors.date_initial_adherence_counseling && (
          <p className="mt-1 text-sm text-red-600">{errors.date_initial_adherence_counseling.message}</p>
        )}
      </div>

      {/* PREP Initiation Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date PREP Initiated
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            {...register('date_prep_initiated')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Leave blank if not initiated today</p>
      </div>

      {/* PREP Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          PREP Type at Start
        </label>
        <select
          {...register('prep_type_at_start')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select PREP type...</option>
          <option value="Oral">Oral (Daily pills)</option>
          <option value="ED PrEP">ED PrEP (Event-driven)</option>
          <option value="Injectable / CAB-LA">Injectable / CAB-LA (Long-acting)</option>
          <option value="Ring">Vaginal Ring</option>
        </select>
      </div>

      {/* Drug Allergies */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('history_of_drug_allergies')}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            History of Drug Allergies
          </span>
        </label>

        {history_of_drug_allergies && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allergy Details <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('allergy_details', {
                required: history_of_drug_allergies ? 'Please specify allergy details' : false,
              })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
              placeholder="Specify medications and reactions..."
            />
            {errors.allergy_details && (
              <p className="mt-1 text-sm text-red-600">{errors.allergy_details.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Transfer Information */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('transferred_in')}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Client Transferred From Another Facility
          </span>
        </label>

        {transferred_in && (
          <div className="space-y-3 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Previous Enrollment ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('previous_enrollment_id', {
                  required: transferred_in ? 'Previous enrollment ID is required' : false,
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g., PREP-2024-001234"
              />
              {errors.previous_enrollment_id && (
                <p className="mt-1 text-sm text-red-600">{errors.previous_enrollment_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transferred From Facility <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('transferred_from_facility', {
                  required: transferred_in ? 'Previous facility is required' : false,
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                placeholder="Name of previous facility"
              />
              {errors.transferred_from_facility && (
                <p className="mt-1 text-sm text-red-600">{errors.transferred_from_facility.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading || loadingResults || labError?.includes('CRITICAL')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving...' : 'Save PREP Commencement'}
        </button>
      </div>
    </form>
  );
}
