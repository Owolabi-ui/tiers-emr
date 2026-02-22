'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import { labInventoryApi, LabInventoryTransactionWithItem } from '@/lib/lab-inventory';

export default function LabExpiringReportPage() {
  const [records, setRecords] = useState<LabInventoryTransactionWithItem[]>([]);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (d = days) => {
    try {
      setLoading(true);
      setError(null);
      const data = await labInventoryApi.getExpiringSoon(d);
      setRecords(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(90);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/dashboard/lab-inventory" className="text-sm text-[#5b21b6] underline">Back to Lab Inventory</Link>
          <h1 className="text-2xl font-bold text-[#5b21b6] mt-2">Expiring Items Report</h1>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-10 rounded-lg border px-3 text-sm">
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
            <option value={90}>Next 90 days</option>
          </select>
          <button onClick={() => fetchData(days)} className="px-3 py-2 rounded-lg border text-sm">Apply</button>
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="rounded-xl border overflow-x-auto bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-[#5b21b6] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-left font-medium">Batch</th>
              <th className="px-4 py-3 text-left font-medium">Expiry Date</th>
              <th className="px-4 py-3 text-left font-medium">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No expiring records found</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-mono">{row.product_code}</td>
                <td className="px-4 py-3">{row.product_name}</td>
                <td className="px-4 py-3">{row.batch_number || '-'}</td>
                <td className="px-4 py-3">{row.expiry_date || '-'}</td>
                <td className="px-4 py-3">{row.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
