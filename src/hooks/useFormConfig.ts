'use client';

import { useQuery } from '@tanstack/react-query';
import { formConfigApi } from '@/lib/form-config';
import type { DefaultSchema } from '@/lib/form-schemas';

export function useFormConfig(formKey: string, defaultSchema: DefaultSchema) {
  const { data } = useQuery({
    queryKey: ['form-config', formKey],
    queryFn: () => formConfigApi.getConfig(formKey),
    staleTime: 5 * 60 * 1000,
  });

  const overrides = data?.config ?? {};
  const fields = overrides.fields ?? {};
  const options = overrides.options ?? {};

  return {
    isRequired: (field: string): boolean =>
      fields[field]?.required ?? defaultSchema.fields[field]?.required ?? false,

    isVisible: (field: string): boolean =>
      fields[field]?.visible ?? defaultSchema.fields[field]?.visible ?? true,

    getLabel: (field: string): string =>
      fields[field]?.label ?? defaultSchema.fields[field]?.label ?? field,

    getOptions: (key: string, fallback: string[]): string[] =>
      options[key] ?? defaultSchema.options?.[key] ?? fallback,

    configLoadedAt: data?.updated_at,
  };
}
