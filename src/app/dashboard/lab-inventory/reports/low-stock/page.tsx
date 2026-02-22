'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import { labInventoryApi, LabInventoryItem } from '@/lib/lab-inventory';

export default function LabLowStockReportPage() {
  const [items, setItems] = useState<LabInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await labInventoryApi.getLowStock();
        setItems(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/lab-inventory" className="text-sm text-[#5b21b6] underline">Back to Lab Inventory</Link>
        <h1 className="text-2xl font-bold text-[#5b21b6] mt-2">Low Stock Report</h1>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border overflow-x-auto bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-[#5b21b6] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Balance</th>
              <th className="px-4 py-3 text-left font-medium">Min</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No low-stock items</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-mono">{item.product_code}</td>
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3 text-red-600 font-semibold">{item.current_balance}</td>
                <td className="px-4 py-3">{item.minimum_stock_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
