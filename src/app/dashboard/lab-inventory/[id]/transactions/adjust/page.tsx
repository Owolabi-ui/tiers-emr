'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import { labInventoryApi } from '@/lib/lab-inventory';

export default function AdjustLabStockPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    voucher_number: '',
    counterparty: '',
    batch_number: '',
    expiry_date: '',
    quantity: '',
    notes: '',
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await labInventoryApi.adjustStock({
        item_id: id,
        transaction_date: form.transaction_date,
        voucher_number: form.voucher_number || null,
        counterparty: form.counterparty || null,
        batch_number: form.batch_number || null,
        expiry_date: form.expiry_date || null,
        quantity: Number(form.quantity),
        notes: form.notes || null,
      });
      router.push(`/dashboard/lab-inventory/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/lab-inventory/${id}`} className="text-sm text-[#5b21b6] underline">
          Back to Item
        </Link>
        <h1 className="text-2xl font-bold text-[#5b21b6] mt-2">Adjust Stock</h1>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="rounded-xl border bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" required className="h-10 rounded-lg border px-3" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
          <input placeholder="Reference No" className="h-10 rounded-lg border px-3" value={form.voucher_number} onChange={(e) => setForm({ ...form, voucher_number: e.target.value })} />
          <input placeholder="Received from / issued to" className="h-10 rounded-lg border px-3" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
          <input placeholder="Batch No" className="h-10 rounded-lg border px-3" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
          <input type="date" className="h-10 rounded-lg border px-3" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          <input type="number" step="0.001" required placeholder="Quantity (+/-)" className="h-10 rounded-lg border px-3" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <textarea placeholder="Reason / Notes" className="w-full rounded-lg border px-3 py-2" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button disabled={loading} className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm disabled:opacity-60">
          {loading ? 'Saving...' : 'Save Adjustment'}
        </button>
      </form>
    </div>
  );
}
