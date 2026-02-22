'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import {
  labInventoryApi,
  LabInventoryItem,
  LabInventoryTransactionWithItem,
} from '@/lib/lab-inventory';

const parseNum = (v: string | number | null | undefined) => Number(v ?? 0);

export default function LabInventoryItemDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<LabInventoryItem | null>(null);
  const [transactions, setTransactions] = useState<LabInventoryTransactionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itemData, txData] = await Promise.all([
          labInventoryApi.getItem(id),
          labInventoryApi.getItemTransactions(id),
        ]);
        setItem(itemData);
        setTransactions(txData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (error || !item) return <div className="text-sm text-red-600">{error || 'Item not found'}</div>;

  const low = parseNum(item.current_balance) <= parseNum(item.minimum_stock_level);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/lab-inventory" className="text-sm text-[#5b21b6] underline">
            Back to Lab Inventory
          </Link>
          <h1 className="text-2xl font-bold text-[#5b21b6] mt-2">{item.product_name}</h1>
          <p className="text-sm text-gray-500 font-mono">{item.product_code}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/lab-inventory/${id}/transactions/receive`} className="px-3 py-2 rounded-lg border text-sm">Receive</Link>
          <Link href={`/dashboard/lab-inventory/${id}/transactions/issue`} className="px-3 py-2 rounded-lg border text-sm">Issue</Link>
          <Link href={`/dashboard/lab-inventory/${id}/transactions/adjust`} className="px-3 py-2 rounded-lg border text-sm">Adjust</Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-neutral-900 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Balance</p>
          <p className={`text-xl font-semibold ${low ? 'text-red-600' : ''}`}>
            {item.current_balance} {item.unit_of_measure}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Minimum Stock Level</p>
          <p className="font-semibold">{item.minimum_stock_level}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="font-semibold">{item.category || '-'}</p>
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-[#5b21b6] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Voucher/Ref</th>
              <th className="px-4 py-3 text-left font-medium">From / To</th>
              <th className="px-4 py-3 text-left font-medium">Batch</th>
              <th className="px-4 py-3 text-left font-medium">Expiry</th>
              <th className="px-4 py-3 text-left font-medium">Quantity</th>
              <th className="px-4 py-3 text-left font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No transactions yet</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-t">
                  <td className="px-4 py-3">{tx.transaction_date}</td>
                  <td className="px-4 py-3">{tx.transaction_type}</td>
                  <td className="px-4 py-3">{tx.voucher_number || '-'}</td>
                  <td className="px-4 py-3">{tx.counterparty || '-'}</td>
                  <td className="px-4 py-3">{tx.batch_number || '-'}</td>
                  <td className="px-4 py-3">{tx.expiry_date || '-'}</td>
                  <td className={`px-4 py-3 font-semibold ${parseNum(tx.quantity) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {tx.quantity}
                  </td>
                  <td className="px-4 py-3 font-semibold">{tx.balance_after}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
