'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { formConfigApi, FormConfigData } from '@/lib/form-config';
import { ConfigurableFormKey, FORM_SCHEMAS } from '@/lib/form-schemas';
import { useToast } from '@/components/toast-provider';

const FORM_LABELS: Record<ConfigurableFormKey, string> = {
  patient: 'Patient Registration',
  hts: 'HTS',
  pep: 'PEP',
  prep: 'PrEP',
  art: 'ART',
};

export default function AdminFormConfigsPage() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [selectedForm, setSelectedForm] = useState<ConfigurableFormKey>('patient');
  const [draft, setDraft] = useState<FormConfigData>({ fields: {}, options: {} });
  const [newOptionValue, setNewOptionValue] = useState<Record<string, string>>({});

  const { data: formConfigs = [], isLoading } = useQuery({
    queryKey: ['admin-form-configs'],
    queryFn: formConfigApi.listAll,
    staleTime: 5 * 60 * 1000,
  });

  const currentConfig = useMemo(
    () => formConfigs.find((cfg) => cfg.form_key === selectedForm)?.config ?? {},
    [formConfigs, selectedForm]
  );

  useEffect(() => {
    setDraft({
      fields: { ...(currentConfig.fields ?? {}) },
      options: { ...(currentConfig.options ?? {}) },
    });
    setNewOptionValue({});
  }, [currentConfig, selectedForm]);

  const saveMutation = useMutation({
    mutationFn: () => formConfigApi.updateConfig(selectedForm, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-form-configs'] });
      queryClient.invalidateQueries({ queryKey: ['form-config', selectedForm] });
      showSuccess('Form configuration updated');
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Failed to update form config'),
  });

  const schema = FORM_SCHEMAS[selectedForm];
  const optionKeys = Object.keys(schema.options ?? {});

  const updateField = (fieldKey: string, patch: { label?: string; visible?: boolean; required?: boolean }) => {
    setDraft((prev) => ({
      ...prev,
      fields: {
        ...(prev.fields ?? {}),
        [fieldKey]: {
          ...(prev.fields?.[fieldKey] ?? {}),
          ...patch,
        },
      },
    }));
  };

  const getOptionValues = (optionKey: string): string[] =>
    draft.options?.[optionKey] ?? schema.options?.[optionKey] ?? [];

  const addOption = (optionKey: string) => {
    const value = (newOptionValue[optionKey] ?? '').trim();
    if (!value) return;
    const current = getOptionValues(optionKey);
    if (current.includes(value)) {
      showError('Option already exists');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      options: {
        ...(prev.options ?? {}),
        [optionKey]: [...current, value],
      },
    }));
    setNewOptionValue((prev) => ({ ...prev, [optionKey]: '' }));
  };

  const removeOption = (optionKey: string, value: string) => {
    const current = getOptionValues(optionKey);
    setDraft((prev) => ({
      ...prev,
      options: {
        ...(prev.options ?? {}),
        [optionKey]: current.filter((opt) => opt !== value),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure form field visibility, required flags, labels, and select options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-900 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Forms</p>
          <div className="space-y-1">
            {(Object.keys(FORM_LABELS) as ConfigurableFormKey[]).map((formKey) => (
              <button
                key={formKey}
                type="button"
                onClick={() => setSelectedForm(formKey)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedForm === formKey
                    ? 'bg-[#065f46] text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {FORM_LABELS[formKey]}
              </button>
            ))}
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{FORM_LABELS[selectedForm]} Fields</h2>
            </div>
            {isLoading ? (
              <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading configuration...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left px-4 py-2">Field</th>
                      <th className="text-left px-4 py-2">Label</th>
                      <th className="text-left px-4 py-2">Visible</th>
                      <th className="text-left px-4 py-2">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(schema.fields).map(([fieldKey, fieldDef]) => {
                      const override = draft.fields?.[fieldKey] ?? {};
                      const visible = override.visible ?? fieldDef.visible ?? true;
                      const required = override.required ?? fieldDef.required ?? false;
                      const label = override.label ?? fieldDef.label;
                      return (
                        <tr key={fieldKey} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2 font-mono text-xs">{fieldKey}</td>
                          <td className="px-4 py-2">
                            <input
                              value={label}
                              onChange={(e) => updateField(fieldKey, { label: e.target.value })}
                              className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 px-2"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={visible}
                              onChange={(e) => updateField(fieldKey, { visible: e.target.checked })}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={required}
                              onChange={(e) => updateField(fieldKey, { required: e.target.checked })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {optionKeys.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Option Lists</h2>
              </div>
              <div className="p-4 space-y-4">
                {optionKeys.map((optionKey) => (
                  <div key={optionKey} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <p className="text-sm font-medium mb-2">{optionKey}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getOptionValues(optionKey).map((value) => (
                        <span
                          key={value}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {value}
                          <button type="button" onClick={() => removeOption(optionKey, value)} className="text-green-700">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newOptionValue[optionKey] ?? ''}
                        onChange={(e) => setNewOptionValue((prev) => ({ ...prev, [optionKey]: e.target.value }))}
                        placeholder={`Add ${optionKey} option`}
                        className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 px-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addOption(optionKey)}
                        className="inline-flex items-center gap-1 px-3 h-9 rounded-md border border-gray-300 dark:border-gray-600 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-medium hover:bg-[#064e3b] disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
