'use client';

import { useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, FileText, Loader2, Upload } from 'lucide-react';
import { bulkUploadApi, ImportResult, RowIssue, ValidationReport } from '@/lib/bulk-upload';
import { getErrorMessage } from '@/lib/api';

type Step = 'upload' | 'preview' | 'done';

export default function BulkUploadPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidate = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const validationReport = await bulkUploadApi.validate(file);
      setReport(validationReport);
      setStep('preview');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const importResult = await bulkUploadApi.confirm(file);
      setResult(importResult);
      setStep('done');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setReport(null);
    setResult(null);
    setError(null);
  };

  const IssueTable = ({ issues, type }: { issues: RowIssue[]; type: 'error' | 'warning' }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 pr-4">Ref</th>
            <th className="pb-2 pr-4">Row</th>
            <th className="pb-2 pr-4">Field</th>
            <th className="pb-2">Issue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {issues.map((issue, i) => (
            <tr
              key={`${issue.patient_ref}-${issue.row}-${issue.field}-${i}`}
              className={type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}
            >
              <td className="py-1.5 pr-4 font-mono">{issue.patient_ref}</td>
              <td className="py-1.5 pr-4">{issue.row}</td>
              <td className="py-1.5 pr-4">{issue.field}</td>
              <td className="py-1.5">{issue.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#5b21b6]">Bulk Patient Upload - ART</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import existing ART patients from CSV. Validate first, then confirm.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {step === 'upload' && (
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-[#5b21b6] transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-[#5b21b6]">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to select CSV file</p>
                <p className="text-xs text-gray-500 mt-1">Combined patient CSV (all rows)</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={handleValidate}
            disabled={!file || loading}
            className="w-full py-2.5 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Validating...' : 'Validate File'}
          </button>
        </div>
      )}

      {step === 'preview' && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.total_rows}</p>
              <p className="text-xs text-gray-500 mt-1">Total rows</p>
            </div>
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{report.valid_count}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to import</p>
            </div>
            <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{report.error_count}</p>
              <p className="text-xs text-gray-500 mt-1">Errors</p>
            </div>
          </div>

          {report.warnings.length > 0 && (
            <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  {report.warnings.length} Warning(s) - these rows will still be imported
                </p>
              </div>
              <IssueTable issues={report.warnings} type="warning" />
            </div>
          )}

          {report.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {report.errors.length} Error(s) - fix these before importing
                </p>
              </div>
              <IssueTable issues={report.errors} type="error" />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Upload Different File
            </button>
            <button
              onClick={handleConfirm}
              disabled={report.error_count > 0 || loading}
              className="flex-1 py-2.5 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Importing...' : `Confirm Import (${report.valid_count} patients)`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {result.imported} patient{result.imported !== 1 ? 's' : ''} imported successfully
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-red-600 mt-1">{result.skipped} row(s) failed during import</p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="text-left">
              <IssueTable issues={result.errors} type="error" />
            </div>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 rounded-lg bg-[#5b21b6] text-white font-medium hover:bg-[#4c1d95]"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
