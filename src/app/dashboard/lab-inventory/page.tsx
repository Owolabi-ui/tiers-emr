'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { labInventoryApi, LabInventoryItem } from '@/lib/lab-inventory';
import { getErrorMessage } from '@/lib/api';

const parseNum = (v: string | number | null | undefined) => Number(v ?? 0);

export default function LabInventoryPage() {
  const [items, setItems] = useState<LabInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labInventoryApi.listItems({ search, active_only: true });
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.product_code.toLowerCase().includes(q) ||
        i.product_name.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">Laboratory Inventory</h1>
          <p className="text-sm text-gray-500">Track reagent and consumable stock movements</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/lab-inventory/reports/low-stock" className="px-3 py-2 rounded-lg border text-sm">
            Low Stock
          </Link>
          <Link href="/dashboard/lab-inventory/reports/expiring" className="px-3 py-2 rounded-lg border text-sm">
            Expiring
          </Link>
          <Link href="/dashboard/lab-inventory/new" className="px-3 py-2 rounded-lg bg-[#5b21b6] text-white text-sm">
            Add Item
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, category"
            className="w-full h-10 rounded-lg border px-3 text-sm"
          />
          <button onClick={fetchItems} className="px-3 py-2 rounded-lg border text-sm">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      <div className="rounded-xl border overflow-x-auto bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-[#5b21b6] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product Code</th>
              <th className="px-4 py-3 text-left font-medium">Product Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Balance</th>
              <th className="px-4 py-3 text-left font-medium">Min Level</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No inventory items</td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const low = parseNum(item.current_balance) <= parseNum(item.minimum_stock_level);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-mono">{item.product_code}</td>
                    <td className="px-4 py-3">{item.product_name}</td>
                    <td className="px-4 py-3">{item.category || '-'}</td>
                    <td className={`px-4 py-3 font-semibold ${low ? 'text-red-600' : ''}`}>
                      {item.current_balance} {item.unit_of_measure}
                    </td>
                    <td className="px-4 py-3">{item.minimum_stock_level}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/lab-inventory/${item.id}`} className="underline text-[#5b21b6]">
                          View
                        </Link>
                        <Link href={`/dashboard/lab-inventory/${item.id}/transactions/receive`} className="underline">
                          Receive
                        </Link>
                        <Link href={`/dashboard/lab-inventory/${item.id}/transactions/issue`} className="underline">
                          Issue
                        </Link>
                        <Link href={`/dashboard/lab-inventory/${item.id}/transactions/adjust`} className="underline">
                          Adjust
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
