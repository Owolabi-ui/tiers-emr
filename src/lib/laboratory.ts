import { api } from './api';

// ============================================================================
// ENUMS
// ============================================================================

export type LabTestCategory =
  | 'Hematology'
  | 'Chemistry'
  | 'Immunology'
  | 'Microbiology'
  | 'Molecular'
  | 'Serology'
  | 'Urinalysis'
  | 'Other';

export type LabTestPriority = 'Routine' | 'Urgent' | 'STAT';

export type SampleType =
  | 'Blood'
  | 'Serum'
  | 'Plasma'
  | 'Urine'
  | 'Stool'
  | 'Sputum'
  | 'CSF'
  | 'Swab'
  | 'Tissue'
  | 'Other';

export type LabTestStatus =
  | 'Ordered'
  | 'Sample Collected'
  | 'In Progress'
  | 'Completed'
  | 'Reviewed'
  | 'Communicated'
  | 'Cancelled';

export type ResultInterpretation =
  | 'Normal'
  | 'Abnormal'
  | 'Critical'
  | 'Indeterminate'
  | 'Inconclusive'
  | 'Not Applicable'
  | 'Pending';

export interface CategoricalResult {
  result: string;
}

export interface GlucoseResult {
  value: number;
  test_type: 'FBS' | 'RBS';
}

export interface UrinalysisResult {
  sg?: string;
  ph?: string;
  leucocytes?: string;
  nitrite?: string;
  protein?: string;
  glucose?: string;
  ketone?: string;
  urobilinogen?: string;
  bilirubin?: string;
  blood?: string;
}

export type LabResultData = CategoricalResult | GlucoseResult | UrinalysisResult;

// ============================================================================
// INTERFACES - Lab Test Catalog
// ============================================================================

export interface LabTestCatalog {
  id: string;
  test_code: string;
  test_name: string;
  category: LabTestCategory;
  description: string | null;
  sample_type: SampleType;
  turnaround_time_hours: number;
  normal_range_min: number | null;
  normal_range_max: number | null;
  unit_of_measure: string | null;
  is_active: boolean;
  requires_fasting: boolean;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLabTestCatalogRequest {
  test_code: string;
  test_name: string;
  category: LabTestCategory;
  description?: string | null;
  sample_type: SampleType;
  turnaround_time_hours: number;
  normal_range_min?: number | null;
  normal_range_max?: number | null;
  unit_of_measure?: string | null;
  requires_fasting?: boolean;
  special_instructions?: string | null;
}

export interface UpdateLabTestCatalogRequest {
  test_name?: string;
  category?: LabTestCategory;
  description?: string | null;
  sample_type?: SampleType;
  turnaround_time_hours?: number;
  normal_range_min?: number | null;
  normal_range_max?: number | null;
  unit_of_measure?: string | null;
  is_active?: boolean;
  requires_fasting?: boolean;
  special_instructions?: string | null;
}

// ============================================================================
// INTERFACES - Lab Test Orders
// ============================================================================

export interface LabTestOrder {
  id: string;
  patient_id: string;
  patient_name: string | null;
  order_number: string;
  test_info: {
    id: string;
    test_code: string;
    test_name: string;
    test_category: LabTestCategory;
    sample_type: SampleType;
    reference_range_text: string | null;
    turnaround_time_hours: number | null;
  };
  priority: LabTestPriority;
  status: LabTestStatus;
  clinical_indication: string | null;
  clinical_notes: string | null;
  sample_collected_at: string | null;
  sample_id: string | null;
  result_value: string | null;
  result_data?: LabResultData | null;
  result_unit: string | null;
  result_interpretation: ResultInterpretation | null;
  result_notes: string | null;
  requires_repeat: boolean;
  parent_order_id?: string | null;
  repeat_reason?: string | null;
  resulted_at: string | null;
  reviewed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  communicated_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  ordered_by: string;
  ordered_at: string;
  created_at: string;
}

export interface CreateLabTestOrderRequest {
  patient_id: string;
  test_id: string;
  priority: LabTestPriority;
  clinical_indication?: string | null;
  clinical_notes?: string | null;
  service_type?: string | null;
  service_record_id?: string | null;
}

export interface CollectSampleRequest {
  sample_id: string; // Required: unique sample identifier
  sample_collected_at?: string | null; // ISO datetime, defaults to now
}

export interface EnterResultRequest {
  result_value?: string | null;
  result_data?: LabResultData | null;
  result_unit?: string | null;
  result_interpretation: ResultInterpretation;
  result_notes?: string | null;
}

export interface ReviewResultRequest {
  reviewed_notes?: string | null;
}

export interface CommunicateResultRequest {
  communicated_notes?: string | null;
}

export interface CancelOrderRequest {
  cancellation_reason: string;
}

// ============================================================================
// INTERFACES - Lab Results History
// ============================================================================

export interface LabResultHistory {
  id: string;
  order_id: string;
  result_value: string;
  result_interpretation: ResultInterpretation;
  result_notes: string | null;
  entered_by: string;
  entered_at: string;
}

// ============================================================================
// INTERFACES - Critical Results
// ============================================================================

export interface LabCriticalResult {
  id: string;
  order_id: string;
  patient_id: string;
  test_id: string;
  result_value: string;
  detected_at: string;
  detected_by: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface AcknowledgeCriticalResultRequest {
  action_taken: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface LabTestOrderWithDetails extends LabTestOrder {
  ordered_by_name?: string;
}

export interface LabTestOrderListResponse {
  data: LabTestOrderWithDetails[];
  total: number;
  page: number;
  per_page: number;
}

export interface LabTestCatalogListResponse {
  data: LabTestCatalog[];
  total: number;
}

export interface LabOrderDetailsResponse {
  order: LabTestOrderWithDetails;
  result_history: LabResultHistory[];
  critical_result: LabCriticalResult | null;
}

export interface LabStatisticsResponse {
  total_orders: number;
  by_status: Array<[LabTestStatus, number]>;
  by_category: Array<[LabTestCategory, number]>;
  by_priority: Array<[LabTestPriority, number]>;
  pending_results: number;
  completed_today: number;
  critical_results_pending: number;
  stat_orders_pending: number;
  repeat_tests_pending?: number;
  average_turnaround_time_hours: number;
  this_month_orders: number;
  completion_rate: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const laboratoryApi = {
  // ========== Lab Test Catalog ==========

  // Get all lab tests in catalog
  getCatalog: async (activeOnly: boolean = false): Promise<LabTestCatalogListResponse> => {
    const response = await api.get<LabTestCatalogListResponse>('/api/v1/lab/catalog', {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  // Get active lab tests in catalog
  getActiveCatalog: async (): Promise<LabTestCatalogListResponse> => {
    const response = await api.get<LabTestCatalogListResponse>('/api/v1/lab/catalog', {
      params: { active_only: true }
    });
    return response.data;
  },

  // Get lab test by ID
  getCatalogTest: async (testId: string): Promise<LabTestCatalog> => {
    const response = await api.get<LabTestCatalog>(`/api/v1/lab/catalog/${testId}`);
    return response.data;
  },

  // Create new lab test in catalog
  createCatalogTest: async (data: CreateLabTestCatalogRequest): Promise<LabTestCatalog> => {
    const response = await api.post<LabTestCatalog>('/api/v1/lab/catalog', data);
    return response.data;
  },

  // Update lab test in catalog
  updateCatalogTest: async (testId: string, data: UpdateLabTestCatalogRequest): Promise<LabTestCatalog> => {
    const response = await api.put<LabTestCatalog>(`/api/v1/lab/catalog/${testId}`, data);
    return response.data;
  },

  // ========== Lab Test Orders ==========

  // Create new lab test order
  createOrder: async (data: CreateLabTestOrderRequest): Promise<LabTestOrder> => {
    const response = await api.post<LabTestOrder>('/api/v1/lab/orders', data);
    return response.data;
  },

  // Get all lab test orders (with filters)
  getOrders: async (params?: {
    patient_id?: string;
    status?: LabTestStatus;
    priority?: LabTestPriority;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<LabTestOrderListResponse> => {
    const response = await api.get<LabTestOrderListResponse>('/api/v1/lab/orders', { params });
    return response.data;
  },

  // Get lab order by ID with full details
  getOrderById: async (orderId: string): Promise<LabOrderDetailsResponse> => {
    const response = await api.get<LabTestOrderWithDetails>(`/api/v1/lab/orders/${orderId}`);
    // Transform backend response to match expected format
    return {
      order: response.data,
      result_history: [],
      critical_result: null,
    };
  },

  // Get lab orders by patient
  getOrdersByPatient: async (patientId: string): Promise<LabTestOrderWithDetails[]> => {
    const response = await api.get<{ patient_id: string; orders: LabTestOrderWithDetails[]; total: number }>(`/api/v1/lab/patient/${patientId}/orders`);
    return response.data.orders || [];
  },

  // Collect sample for order
  collectSample: async (orderId: string, data: CollectSampleRequest): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/collect-sample`, data);
    return response.data;
  },

  // Start processing order
  startProcessing: async (orderId: string): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/status`, { status: 'In Progress' });
    return response.data;
  },

  // Enter result for order
  enterResult: async (orderId: string, data: EnterResultRequest): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/result`, data);
    return response.data;
  },

  // Get repeat/confirmatory orders generated from an original order
  getRepeatTests: async (orderId: string): Promise<LabTestOrder[]> => {
    const response = await api.get<LabTestOrder[]>(`/api/v1/lab/orders/${orderId}/repeats`);
    return response.data;
  },

  // Review result
  reviewResult: async (orderId: string, data: ReviewResultRequest = {}): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/review`, data);
    return response.data;
  },

  // Communicate result to patient/clinician
  communicateResult: async (orderId: string, data: CommunicateResultRequest = {}): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/communicate`, data);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: string, data: CancelOrderRequest): Promise<LabTestOrder> => {
    const response = await api.put<LabTestOrder>(`/api/v1/lab/orders/${orderId}/cancel`, data);
    return response.data;
  },

  // ========== Critical Results ==========

  // Get unacknowledged critical results
  getCriticalResults: async (): Promise<LabCriticalResult[]> => {
    const response = await api.get<{ data: LabCriticalResult[] }>('/api/v1/lab/critical-results');
    return response.data.data || [];
  },

  // Acknowledge critical result
  acknowledgeCriticalResult: async (criticalResultId: string, data: AcknowledgeCriticalResultRequest): Promise<LabCriticalResult> => {
    const response = await api.put<LabCriticalResult>(`/api/v1/lab/critical-results/${criticalResultId}/acknowledge`, data);
    return response.data;
  },

  // ========== Statistics ==========

  // Get laboratory statistics
  getStatistics: async (): Promise<LabStatisticsResponse> => {
    const response = await api.get<LabStatisticsResponse>('/api/v1/lab/statistics');
    return response.data;
  },
};

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

export const labTestCategoryOptions: LabTestCategory[] = [
  'Hematology',
  'Chemistry',
  'Immunology',
  'Microbiology',
  'Molecular',
  'Serology',
  'Urinalysis',
  'Other',
];

export const labTestPriorityOptions: LabTestPriority[] = [
  'Routine',
  'Urgent',
  'STAT',
];

export const sampleTypeOptions: SampleType[] = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'CSF',
  'Swab',
  'Tissue',
  'Other',
];

export const labTestStatusOptions: LabTestStatus[] = [
  'Ordered',
  'Sample Collected',
  'In Progress',
  'Completed',
  'Reviewed',
  'Communicated',
  'Cancelled',
];

export const resultInterpretationOptions: ResultInterpretation[] = [
  'Normal',
  'Abnormal',
  'Critical',
  'Indeterminate',
  'Inconclusive',
  'Not Applicable',
  'Pending',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getStatusColor = (status: LabTestStatus): string => {
  switch (status) {
    case 'Ordered':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Sample Collected':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Reviewed':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'Communicated':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'Cancelled':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const getPriorityColor = (priority: LabTestPriority): string => {
  switch (priority) {
    case 'STAT':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'Urgent':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Routine':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const getInterpretationColor = (interpretation: ResultInterpretation): string => {
  switch (interpretation) {
    case 'Normal':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Abnormal':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'Indeterminate':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    case 'Inconclusive':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Not Applicable':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    case 'Pending':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const formatOrderNumber = (orderNumber: string): string => {
  return orderNumber.toUpperCase();
};

export const getCategoryIcon = (category: LabTestCategory): string => {
  // Return appropriate icon name for each category
  switch (category) {
    case 'Hematology':
      return 'droplet';
    case 'Chemistry':
      return 'flask';
    case 'Immunology':
      return 'shield';
    case 'Microbiology':
      return 'microscope';
    case 'Molecular':
      return 'dna';
    case 'Serology':
      return 'test-tube';
    case 'Urinalysis':
      return 'beaker';
    default:
      return 'vial';
  }
};

// ============================================================================
// SERVICE-LINKED LAB ORDERS
// Helper functions for creating lab orders from HTS, PREP, PEP, ART modules
// ============================================================================

/**
 * Get test catalog entry by test code
 */
export const getTestByCode = async (testCode: string): Promise<LabTestCatalog | null> => {
  try {
    const response = await api.get(`/api/v1/lab/catalog/${testCode}`);
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      console.warn(`Lab test '${testCode}' not found in catalog`);
      return null;
    }
    throw error;
  }
};

/**
 * Create HIV screening order for HTS
 */
export const createHTSScreeningOrder = async (
  patientId: string,
  htsInitialId: string,
  clinicalNotes?: string
): Promise<LabTestOrder> => {
  const test = await getTestByCode('HIV_RAPID'); // HIV Rapid Screening Test
  
  if (!test) {
    throw new Error('HIV_RAPID test not found in catalog. Please add it to the lab catalog first.');
  }
  
  return laboratoryApi.createOrder({
    patient_id: patientId,
    test_id: test.id,
    priority: 'Routine',
    service_type: 'HTS',
    service_record_id: htsInitialId,
    clinical_indication: 'HIV Testing Services - Screening',
    clinical_notes: clinicalNotes,
  });
};

/**
 * Create HIV confirmatory order for HTS
 */
export const createHTSConfirmatoryOrder = async (
  patientId: string,
  htsInitialId: string,
  clinicalNotes?: string
): Promise<LabTestOrder> => {
  const test = await getTestByCode('HIV_DNA'); // Using HIV DNA PCR for confirmatory
  
  if (!test) {
    throw new Error('HIV_DNA test not found in catalog. Please add it to the lab catalog first.');
  }
  
  return laboratoryApi.createOrder({
    patient_id: patientId,
    test_id: test.id,
    priority: 'Urgent',
    service_type: 'HTS',
    service_record_id: htsInitialId,
    clinical_indication: 'HIV Testing Services - Confirmatory Test',
    clinical_notes: clinicalNotes,
  });
};
/**
 * Create additional STI screening tests for HTS (Syphilis, Hep B, Hep C)
 * Allows selective ordering of individual tests
 */
export const createHTSAdditionalTests = async (
  patientId: string,
  htsInitialId: string,
  clinicalNotes?: string,
  options?: {
    includeSyphilis?: boolean;
    includeHepB?: boolean;
    includeHepC?: boolean;
  }
): Promise<LabTestOrder[]> => {
  const { includeSyphilis = true, includeHepB = true, includeHepC = true } = options || {};
  
  const orderPromises: Promise<LabTestOrder>[] = [];
  
  // Syphilis test (TPHA)
  if (includeSyphilis) {
    const syphilisTest = await getTestByCode('TPHA');
    if (syphilisTest) {
      orderPromises.push(
        laboratoryApi.createOrder({
          patient_id: patientId,
          test_id: syphilisTest.id,
          priority: 'Routine',
          service_type: 'HTS',
          service_record_id: htsInitialId,
          clinical_indication: 'HIV Testing Services - STI Co-infection Screening (Syphilis)',
          clinical_notes: clinicalNotes,
        })
      );
    }
  }
  
  // Hepatitis B test (HBsAg)
  if (includeHepB) {
    const hepBTest = await getTestByCode('HBSAG');
    if (hepBTest) {
      orderPromises.push(
        laboratoryApi.createOrder({
          patient_id: patientId,
          test_id: hepBTest.id,
          priority: 'Routine',
          service_type: 'HTS',
          service_record_id: htsInitialId,
          clinical_indication: 'HIV Testing Services - Hepatitis B Co-infection Screening',
          clinical_notes: clinicalNotes,
        })
      );
    }
  }
  
  // Hepatitis C test (HCV-AB)
  if (includeHepC) {
    const hepCTest = await getTestByCode('HCVAB');
    if (hepCTest) {
      orderPromises.push(
        laboratoryApi.createOrder({
          patient_id: patientId,
          test_id: hepCTest.id,
          priority: 'Routine',
          service_type: 'HTS',
          service_record_id: htsInitialId,
          clinical_indication: 'HIV Testing Services - Hepatitis C Co-infection Screening',
          clinical_notes: clinicalNotes,
        })
      );
    }
  }
  
  if (orderPromises.length === 0) {
    throw new Error('No STI tests found in catalog. Please add TPHA, HBSAG, and HCVAB tests to the lab catalog first.');
  }
  
  return Promise.all(orderPromises);
};

/**
 * Create Viral Load for ART monitoring
 */
export const createARTViralLoadOrder = async (
  patientId: string,
  artInformationId: string,
  indication: string = 'ART Monitoring - Routine Viral Load'
): Promise<LabTestOrder> => {
  const test = await getTestByCode('HIV_VL'); // HIV Viral Load
  
  if (!test) {
    throw new Error('HIV_VL test not found in catalog. Please add it to the lab catalog first.');
  }
  
  return laboratoryApi.createOrder({
    patient_id: patientId,
    test_id: test.id,
    priority: 'Routine',
    service_type: 'ART',
    service_record_id: artInformationId,
    clinical_indication: indication,
  });
};

/**
 * Get lab orders for a specific service record
 */
export const getOrdersByService = async (
  serviceType: string,
  serviceRecordId: string
): Promise<LabTestOrderWithDetails[]> => {
  const response = await api.get(
    `/api/v1/lab/orders/by-service/${serviceType}/${serviceRecordId}`
  );
  return response.data;
};

/**
 * Get lab results for a service (for auto-filling forms)
 * Returns map of test_code -> {value, date, interpretation}
 */
export const getResultsByService = async (
  serviceType: string,
  serviceRecordId: string
): Promise<Record<string, { value: string; date: string; interpretation?: string }>> => {
  const response = await api.get(
    `/api/v1/lab/results/by-service/${serviceType}/${serviceRecordId}`
  );
  return response.data;
};

// ============================================================================
// HELPER FUNCTIONS - Test Type Detection
// ============================================================================

/**
 * Determine if a test is qualitative (dropdown) or quantitative (numeric input)
 */
export const isQualitativeTest = (testCode: string): boolean => {
  const normalizedCode = testCode.toUpperCase();
  const qualitativeTests = [
    'HIV_RAPID',
    'HIV_DNA',
    'HBsAg',
    'HBSAG',      // Hepatitis B Surface Antigen
    'HCV_AB',
    'HCVAB',      // Hepatitis C Antibody
    'VDRL',
    'TPHA',       // Syphilis test
    'RPR',
    'PREGNANCY',
    'MALARIA',
    'TB_GENE',
    'URINE_PROTEIN',
    'URINE_GLUCOSE',
    'BLOOD_GROUP',
    'HBV_RAPID',
    'HCV_RAPID',
    'SYPHILIS_RAPID',
    'MALARIA_RAPID',
    'GONORRHEA_RAPID',
    'CHLAMYDIA_RAPID',
    'HERPES_I_II',
    'H_PYLORI',
  ];
  return qualitativeTests.map((code) => code.toUpperCase()).includes(normalizedCode);
};

/**
 * Get options for qualitative test results
 */
export const getQualitativeOptions = (testCode: string): string[] => {
  return getCategoricalOptions(testCode);
};

export const getTestResultType = (
  testCode: string
): 'categorical' | 'glucose' | 'urinalysis' | 'numeric' => {
  const code = testCode.toUpperCase();

  if (code === 'URINALYSIS') return 'urinalysis';
  if (code === 'GLUCOSE') return 'glucose';
  if (isQualitativeTest(code)) return 'categorical';
  return 'numeric';
};

export const getCategoricalOptions = (testCode: string): string[] => {
  const code = testCode.toUpperCase();

  if (['HIV_RAPID', 'SYPHILIS_RAPID'].includes(code)) {
    return ['REACTIVE', 'NON-REACTIVE', 'INCONCLUSIVE'];
  }

  if (
    ['HBV_RAPID', 'HCV_RAPID', 'MALARIA_RAPID', 'GONORRHEA_RAPID', 'CHLAMYDIA_RAPID', 'HERPES_I_II', 'H_PYLORI']
      .includes(code)
  ) {
    return ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'];
  }

  // HIV and most rapid tests (including STI screening tests)
  if (
    code.includes('HIV') ||
    code.includes('HBSAG') ||
    code.includes('HCV') ||
    code === 'TPHA' ||
    code === 'VDRL' ||
    code === 'RPR'
  ) {
    return ['REACTIVE', 'NON-REACTIVE', 'INDETERMINATE'];
  }

  // Pregnancy, malaria
  if (code === 'PREGNANCY' || code === 'MALARIA') {
    return ['POSITIVE', 'NEGATIVE', 'INVALID'];
  }

  // Urine tests
  if (code.startsWith('URINE_')) {
    return ['POSITIVE', 'NEGATIVE', 'TRACE'];
  }

  // Default qualitative
  return ['POSITIVE', 'NEGATIVE', 'INDETERMINATE'];
};

// ============================================================================
// HELPER FUNCTIONS - PREP Specific
// ============================================================================

/**
 * Create PREP Baseline Tests
 * Required before initiating PREP:
 * - HIV Rapid Test (must be negative)
 * - Creatinine (kidney function)
 * - Hepatitis B Surface Antigen
 * - Pregnancy Test (for women of childbearing age)
 * Optional:
 * - ALT/AST (liver function)
 */
export const createPREPBaselineTests = async (
  patientId: string,
  htsInitialId: string,
  options: {
    includePregnancyTest?: boolean;
    includeLiverFunction?: boolean;
  } = {}
): Promise<LabTestOrder[]> => {
  const orders: LabTestOrder[] = [];

  try {
    // 1. HIV Rapid Test (mandatory - must be negative for PREP eligibility)
    const hivTest = await getTestByCode('HIV_RAPID');
    if (!hivTest) {
      throw new Error('HIV_RAPID test not found in catalog');
    }
    const hivOrder = await laboratoryApi.createOrder({
      patient_id: patientId,
      test_id: hivTest.id,
      priority: 'Routine',
      service_type: 'PREP_BASELINE',
      service_record_id: htsInitialId,
      clinical_indication: 'PREP Baseline Assessment - HIV Status Verification',
    });
    orders.push(hivOrder);

    // 2. Creatinine (mandatory - kidney function baseline)
    const creatinineTest = await getTestByCode('CREATININE');
    if (!creatinineTest) {
      throw new Error('CREATININE test not found in catalog');
    }
    const creatinineOrder = await laboratoryApi.createOrder({
      patient_id: patientId,
      test_id: creatinineTest.id,
      priority: 'Routine',
      service_type: 'PREP_BASELINE',
      service_record_id: htsInitialId,
      clinical_indication: 'PREP Baseline Assessment - Renal Function',
    });
    orders.push(creatinineOrder);

    // 3. Hepatitis B Surface Antigen (mandatory)
    const hbsagTest = await getTestByCode('HBSAG');
    if (!hbsagTest) {
      throw new Error('HBSAG test not found in catalog');
    }
    const hbsagOrder = await laboratoryApi.createOrder({
      patient_id: patientId,
      test_id: hbsagTest.id,
      priority: 'Routine',
      service_type: 'PREP_BASELINE',
      service_record_id: htsInitialId,
      clinical_indication: 'PREP Baseline Assessment - Hepatitis B Screening',
    });
    orders.push(hbsagOrder);

    // 4. Pregnancy Test (optional - for women of childbearing age)
    if (options.includePregnancyTest) {
      const pregnancyTest = await getTestByCode('PREGNANCY');
      if (!pregnancyTest) {
        throw new Error('PREGNANCY test not found in catalog');
      }
      const pregnancyOrder = await laboratoryApi.createOrder({
        patient_id: patientId,
        test_id: pregnancyTest.id,
        priority: 'Routine',
        service_type: 'PREP_BASELINE',
        service_record_id: htsInitialId,
        clinical_indication: 'PREP Baseline Assessment - Pregnancy Screening',
      });
      orders.push(pregnancyOrder);
    }

    // 5. Liver Function Tests (optional - ALT and AST)
    if (options.includeLiverFunction) {
      const altTest = await getTestByCode('ALT');
      if (!altTest) {
        throw new Error('ALT test not found in catalog');
      }
      const altOrder = await laboratoryApi.createOrder({
        patient_id: patientId,
        test_id: altTest.id,
        priority: 'Routine',
        service_type: 'PREP_BASELINE',
        service_record_id: htsInitialId,
        clinical_indication: 'PREP Baseline Assessment - Liver Function (ALT)',
      });
      orders.push(altOrder);

      const astTest = await getTestByCode('AST');
      if (!astTest) {
        throw new Error('AST test not found in catalog');
      }
      const astOrder = await laboratoryApi.createOrder({
        patient_id: patientId,
        test_id: astTest.id,
        priority: 'Routine',
        service_type: 'PREP_BASELINE',
        service_record_id: htsInitialId,
        clinical_indication: 'PREP Baseline Assessment - Liver Function (AST)',
      });
      orders.push(astOrder);
    }

    return orders;
  } catch (error) {
    console.error('Error creating PREP baseline tests:', error);
    throw error;
  }
};

/**
 * Create PREP Monitoring Tests
 * Required during PREP follow-up visits:
 * - HIV Rapid Test (every 3 months)
 * - Creatinine (at 3 months, then every 6 months)
 */
export const createPREPMonitoringTests = async (
  patientId: string,
  prepCommencementId: string,
  options: {
    includeCreatinine?: boolean; // Month 3, 6, 9, 12, etc.
  } = { includeCreatinine: true }
): Promise<LabTestOrder[]> => {
  const orders: LabTestOrder[] = [];

  try {
    // 1. HIV Rapid Test (mandatory at every visit)
    const hivTest = await getTestByCode('HIV_RAPID');
    if (!hivTest) {
      throw new Error('HIV_RAPID test not found in catalog');
    }
    const hivOrder = await laboratoryApi.createOrder({
      patient_id: patientId,
      test_id: hivTest.id,
      priority: 'Routine',
      service_type: 'PREP_MONITORING',
      service_record_id: prepCommencementId,
      clinical_indication: 'PREP Follow-up - HIV Status Monitoring',
    });
    orders.push(hivOrder);

    // 2. Creatinine (conditional - based on schedule)
    if (options.includeCreatinine) {
      const creatinineTest = await getTestByCode('CREATININE');
      if (!creatinineTest) {
        throw new Error('CREATININE test not found in catalog');
      }
      const creatinineOrder = await laboratoryApi.createOrder({
        patient_id: patientId,
        test_id: creatinineTest.id,
        priority: 'Routine',
        service_type: 'PREP_MONITORING',
        service_record_id: prepCommencementId,
        clinical_indication: 'PREP Follow-up - Renal Function Monitoring',
      });
      orders.push(creatinineOrder);
    }

    return orders;
  } catch (error) {
    console.error('Error creating PREP monitoring tests:', error);
    throw error;
  }
};
