export type VitalSignStatus = 'low' | 'normal' | 'high' | 'underweight' | 'overweight' | 'obese';

export const getTemperatureStatus = (value: number): VitalSignStatus => {
  if (value < 36.0) return 'low';
  if (value > 37.5) return 'high';
  return 'normal';
};

export const getPulseStatus = (value: number): VitalSignStatus => {
  if (value < 60) return 'low';
  if (value > 100) return 'high';
  return 'normal';
};

export const getRespirationStatus = (value: number): VitalSignStatus => {
  if (value < 12) return 'low';
  if (value > 20) return 'high';
  return 'normal';
};

export const getSystolicBpStatus = (value: number): VitalSignStatus => {
  if (value < 90) return 'low';
  if (value > 130) return 'high';
  return 'normal';
};

export const getDiastolicBpStatus = (value: number): VitalSignStatus => {
  if (value < 60) return 'low';
  if (value > 90) return 'high';
  return 'normal';
};

export const getSpO2Status = (value: number): VitalSignStatus => {
  if (value < 95) return 'low';
  return 'normal';
};

export const getBmiStatus = (value: number): VitalSignStatus => {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
};

export const getStatusColor = (status: VitalSignStatus): string => {
  if (status === 'low' || status === 'underweight') return 'text-blue-600 dark:text-blue-400';
  if (status === 'normal') return 'text-green-600 dark:text-green-400';
  if (status === 'high' || status === 'overweight') return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getStatusLabel = (status: VitalSignStatus): string => {
  if (status === 'low') return 'Low';
  if (status === 'normal') return 'Normal';
  if (status === 'high') return 'High';
  if (status === 'underweight') return 'Underweight';
  if (status === 'overweight') return 'Overweight';
  return 'Obese';
};

