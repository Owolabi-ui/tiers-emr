'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2, Save } from 'lucide-react';
import { artApi, ArtStatus, CareEntryPoint, HivTestMode, PriorArtType, UpdateArtInformationRequest } from '@/lib/art';
import { getErrorMessage } from '@/lib/api';

const ENTRY_POINTS: CareEntryPoint[] = [
  'VCT',
  'ANC/PMTCT',
  'Index testing',
  'Inpatient',
  'OPD',
  'Outreach',
  'STI clinic',
  'TB-DOT',
  'Transferred in',
  'Others',
];

const HIV_TEST_MODES: HivTestMode[] = ['HIV-AB', 'PCR'];
const PRIOR_ART_OPTIONS: PriorArtType[] = [
  'PEP',
  'PMTCT only',
  'Transfer in with records',
  'Transfer in without records',
];
const STATUS_OPTIONS: ArtStatus[] = ['in_progress', 'Active', 'On EAC', 'Transferred Out', 'Deceased', 'LTFU'];

type EditArtForm = {
  art_no: string;
  date_confirmed_hiv_positive: string;
  date_enrolled_into_hiv_care: string;
  mode_of_hiv_test: string;
  entry_point: CareEntryPoint;
  where_test_was_done: string;
  prior_art: string;
  relationship_with_next_of_kin: string;
  name_of_next_of_kin: string;
  phone_no_of_next_of_kin: string;
  status: ArtStatus;
};

export default function EditArtPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditArtForm>({
    art_no: '',
    date_confirmed_hiv_positive: '',
    date_enrolled_into_hiv_care: '',
    mode_of_hiv_test: '',
    entry_point: 'VCT',
    where_test_was_done: '',
    prior_art: '',
    relationship_with_next_of_kin: '',
    name_of_next_of_kin: '',
    phone_no_of_next_of_kin: '',
    status: 'in_progress',
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await artApi.getById(id);
        setForm({
          art_no: data.art_no ?? '',
          date_confirmed_hiv_positive: data.date_confirmed_hiv_positive ?? '',
          date_enrolled_into_hiv_care: data.date_enrolled_into_hiv_care ?? '',
          mode_of_hiv_test: data.mode_of_hiv_test ?? '',
          entry_point: data.entry_point,
          where_test_was_done: data.where_test_was_done ?? '',
          prior_art: data.prior_art ?? '',
          relationship_with_next_of_kin: data.relationship_with_next_of_kin ?? '',
          name_of_next_of_kin: data.name_of_next_of_kin ?? '',
          phone_no_of_next_of_kin: data.phone_no_of_next_of_kin ?? '',
          status: data.status,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload: UpdateArtInformationRequest = {
        art_no: form.art_no || undefined,
        date_confirmed_hiv_positive: form.date_confirmed_hiv_positive || undefined,
        date_enrolled_into_hiv_care: form.date_enrolled_into_hiv_care || undefined,
        mode_of_hiv_test: (form.mode_of_hiv_test || undefined) as HivTestMode | undefined,
        entry_point: form.entry_point,
        where_test_was_done: form.where_test_was_done || undefined,
        prior_art: (form.prior_art || undefined) as PriorArtType | undefined,
        relationship_with_next_of_kin: form.relationship_with_next_of_kin || undefined,
        name_of_next_of_kin: form.name_of_next_of_kin || undefined,
        phone_no_of_next_of_kin: form.phone_no_of_next_of_kin || undefined,
        status: form.status,
      };

      await artApi.update(id, payload);
      router.push(`/dashboard/art/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/art/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Edit ART Information</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.art_no} onChange={(e) => setForm((p) => ({ ...p, art_no: e.target.value }))} placeholder="ART Number" />
          <select className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ArtStatus }))}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Date Confirmed HIV Positive
            </label>
            <input
              type="date"
              className="h-10 w-full rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
              value={form.date_confirmed_hiv_positive}
              onChange={(e) => setForm((p) => ({ ...p, date_confirmed_hiv_positive: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Date Enrolled into HIV Care
            </label>
            <input
              type="date"
              className="h-10 w-full rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800"
              value={form.date_enrolled_into_hiv_care}
              onChange={(e) => setForm((p) => ({ ...p, date_enrolled_into_hiv_care: e.target.value }))}
            />
          </div>
          <select className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.entry_point} onChange={(e) => setForm((p) => ({ ...p, entry_point: e.target.value as CareEntryPoint }))}>
            {ENTRY_POINTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.mode_of_hiv_test} onChange={(e) => setForm((p) => ({ ...p, mode_of_hiv_test: e.target.value }))}>
            <option value="">Mode of HIV Test</option>
            {HIV_TEST_MODES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800 md:col-span-2" value={form.where_test_was_done} onChange={(e) => setForm((p) => ({ ...p, where_test_was_done: e.target.value }))} placeholder="Where test was done" />
          <select className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800 md:col-span-2" value={form.prior_art} onChange={(e) => setForm((p) => ({ ...p, prior_art: e.target.value }))}>
            <option value="">Prior ART</option>
            {PRIOR_ART_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.name_of_next_of_kin} onChange={(e) => setForm((p) => ({ ...p, name_of_next_of_kin: e.target.value }))} placeholder="Next of kin name" />
          <input className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800" value={form.relationship_with_next_of_kin} onChange={(e) => setForm((p) => ({ ...p, relationship_with_next_of_kin: e.target.value }))} placeholder="Relationship" />
          <input className="h-10 rounded-lg border px-3 text-sm bg-white dark:bg-neutral-800 md:col-span-2" value={form.phone_no_of_next_of_kin} onChange={(e) => setForm((p) => ({ ...p, phone_no_of_next_of_kin: e.target.value }))} placeholder="Next of kin phone" />
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/art/${id}`} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-neutral-800">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm font-medium hover:bg-[#4c1d95] disabled:opacity-50 inline-flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
