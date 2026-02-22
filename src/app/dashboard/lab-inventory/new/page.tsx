'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import { labInventoryApi } from '@/lib/lab-inventory';
import { useToast } from '@/components/toast-provider';

export default function NewLabInventoryItemPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_name: '',
    description: '',
    unit_of_measure: 'Kit',
    category: '',
    minimum_stock_level: '0',
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const created = await labInventoryApi.createItem({
        product_name: form.product_name,
        description: form.description || null,
        unit_of_measure: form.unit_of_measure,
        category: form.category || null,
        minimum_stock_level: Number(form.minimum_stock_level) || 0,
      });
      showSuccess('Item created', `Generated code: ${created.product_code}`);
      router.push(`/dashboard/lab-inventory/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/lab-inventory" className="text-sm text-[#5b21b6] underline">
          Back to Lab Inventory
        </Link>
        <h1 className="text-2xl font-bold text-[#5b21b6] mt-2">Create Inventory Item</h1>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={onSubmit} className="rounded-xl border bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>Product Code:</strong> Auto-generated from category (e.g. `LAB-REG-001`)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Product Name *</label>
            <input className="w-full h-10 rounded-lg border px-3" required value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit of Measure *</label>
            <input className="w-full h-10 rounded-lg border px-3" required value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Category * <span className="text-xs text-gray-500">(affects code prefix)</span>
            </label>
            <select
              required
              className="w-full h-10 rounded-lg border px-3"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select category</option>
              <option value="Reagents">Reagents (LAB-REG-XXX)</option>
              <option value="Consumables">Consumables (LAB-CON-XXX)</option>
              <option value="Equipment">Equipment (LAB-EQP-XXX)</option>
              <option value="Other">Other (LAB-GEN-XXX)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Minimum Stock Level</label>
            <input type="number" step="0.001" className="w-full h-10 rounded-lg border px-3" value={form.minimum_stock_level} onChange={(e) => setForm({ ...form, minimum_stock_level: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full rounded-lg border px-3 py-2" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <button disabled={loading} className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Item'}
          </button>
          <Link href="/dashboard/lab-inventory" className="px-4 py-2 rounded-lg border text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
