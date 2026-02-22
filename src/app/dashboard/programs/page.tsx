'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, PackageOpen, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import {
  CreateProgramClientRequest,
  CreateProgramItemRequest,
  ProgramClient,
  ProgramClientSummary,
  ProgramItem,
  programsApi,
  ProgramStockRequest,
} from '@/lib/programs';

type TabKey = 'overview' | 'clients' | 'stock' | 'dispense';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'clients', label: 'Clients' },
  { key: 'stock', label: 'Stock' },
  { key: 'dispense', label: 'Dispense' },
];

export default function ProgramsPage() {
  const today = new Date().toISOString().split('T')[0];
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [error, setError] = useState<string | null>(null);

  const [clientForm, setClientForm] = useState<CreateProgramClientRequest>({
    full_name: '',
    phone: '',
    email: '',
  });

  const [itemForm, setItemForm] = useState<Omit<CreateProgramItemRequest, 'item_name'> & { other_specify?: string }>({
    category: 'Condom',
    unit_of_measure: 'pieces',
    minimum_stock_level: 0,
    description: '',
    other_specify: '',
  });

  const [addStockForm, setAddStockForm] = useState<ProgramStockRequest>({
    item_id: '',
    quantity: 1,
    transaction_date: today,
    voucher_ref_no: '',
    counterparty: '',
    batch_no: '',
    expiry_date: '',
    notes: '',
  });

  const [dispenseForm, setDispenseForm] = useState<ProgramStockRequest>({
    item_id: '',
    quantity: 1,
    client_id: '',
    transaction_date: today,
    notes: '',
  });
  const [addStockQtyStr, setAddStockQtyStr] = useState('1');
  const [dispenseQtyStr, setDispenseQtyStr] = useState('1');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['programs-stats'],
    queryFn: programsApi.getStatistics,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['program-clients'],
    queryFn: programsApi.listClients,
  });
  const { data: clientSummaries = [] } = useQuery({
    queryKey: ['program-client-summaries'],
    queryFn: programsApi.listClientsSummary,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['program-items'],
    queryFn: programsApi.listItems,
  });

  const createClientMutation = useMutation({
    mutationFn: programsApi.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-clients'] });
      queryClient.invalidateQueries({ queryKey: ['programs-stats'] });
      setClientForm({ full_name: '', phone: '', email: '' });
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const createItemMutation = useMutation({
    mutationFn: programsApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-items'] });
      queryClient.invalidateQueries({ queryKey: ['programs-stats'] });
      setItemForm({
        category: 'Condom',
        unit_of_measure: 'pieces',
        minimum_stock_level: 0,
        description: '',
        other_specify: '',
      });
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const addStockMutation = useMutation({
    mutationFn: programsApi.addStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-items'] });
      queryClient.invalidateQueries({ queryKey: ['programs-stats'] });
      setAddStockForm({
        item_id: '',
        quantity: 1,
        transaction_date: today,
        voucher_ref_no: '',
        counterparty: '',
        batch_no: '',
        expiry_date: '',
        notes: '',
      });
      setAddStockQtyStr('1');
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const dispenseMutation = useMutation({
    mutationFn: programsApi.dispense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-items'] });
      queryClient.invalidateQueries({ queryKey: ['programs-stats'] });
      queryClient.invalidateQueries({ queryKey: ['program-client-summaries'] });
      setDispenseForm({
        item_id: '',
        quantity: 1,
        client_id: '',
        transaction_date: today,
        notes: '',
      });
      setDispenseQtyStr('1');
      setClientSearchQuery('');
      setClientSearchOpen(false);
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const selectedDispenseItem = useMemo(
    () => items.find((item) => item.id === dispenseForm.item_id),
    [items, dispenseForm.item_id]
  );
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === dispenseForm.client_id),
    [clients, dispenseForm.client_id]
  );
  const filteredClients = useMemo(
    () =>
      clients.filter((c) => {
        const query = clientSearchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          c.full_name.toLowerCase().includes(query) ||
          c.client_code.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(clientSearchQuery.trim()))
        );
      }),
    [clients, clientSearchQuery]
  );

  const handleCreateClient = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createClientMutation.mutate({
      full_name: clientForm.full_name.trim(),
      phone: clientForm.phone?.trim() || undefined,
      email: clientForm.email?.trim() || undefined,
    });
  };

  const handleCreateItem = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (itemForm.category === 'Other' && !itemForm.other_specify?.trim()) {
      setError('Please specify the item type');
      return;
    }

    const description =
      itemForm.category === 'Other' && itemForm.other_specify?.trim()
        ? `Type: ${itemForm.other_specify.trim()}${
            itemForm.description?.trim() ? ' -- ' + itemForm.description.trim() : ''
          }`
        : itemForm.description?.trim() || undefined;

    const categoryNameMap: Record<string, string> = {
      Condom: 'Condom',
      Lubricant: 'Lubricant',
      SelfTestKit: 'Self Test Kit',
      Other: itemForm.other_specify?.trim() || 'Other',
    };
    const item_name = categoryNameMap[itemForm.category];

    createItemMutation.mutate({
      item_name,
      category: itemForm.category,
      unit_of_measure: itemForm.unit_of_measure?.trim() || 'pieces',
      description,
      minimum_stock_level: Number(itemForm.minimum_stock_level || 0),
    });
  };

  const handleAddStock = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addStockMutation.mutate({
      ...addStockForm,
      quantity: parseInt(addStockQtyStr, 10) || 1,
      transaction_date: addStockForm.transaction_date || today,
      voucher_ref_no: addStockForm.voucher_ref_no?.trim() || undefined,
      counterparty: addStockForm.counterparty?.trim() || undefined,
      batch_no: addStockForm.batch_no?.trim() || undefined,
      expiry_date: addStockForm.expiry_date?.trim() || undefined,
      notes: addStockForm.notes?.trim() || undefined,
    });
  };

  const handleDispense = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispenseMutation.mutate({
      ...dispenseForm,
      quantity: parseInt(dispenseQtyStr, 10) || 1,
      client_id: dispenseForm.client_id?.trim() || undefined,
      transaction_date: dispenseForm.transaction_date || today,
      notes: dispenseForm.notes?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#5b21b6]">Programs</h1>
        <p className="text-sm text-gray-500">
          Manage outreach clients, stock items, and dispensing records.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              activeTab === tab.key
                ? 'bg-[#5b21b6] text-white border-[#5b21b6]'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard title="Total Clients" value={stats?.total_clients ?? 0} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Items" value={stats?.total_items ?? 0} icon={<PackageOpen className="h-5 w-5" />} />
            <StatCard
              title="Dispensed This Month"
              value={stats?.total_dispensed_this_month ?? 0}
              icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
              title="Low Stock Items"
              value={stats?.low_stock_items ?? 0}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <StatCard
              title="Received This Month"
              value={stats?.total_received_this_month ?? 0}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-900">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Current Inventory</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#5b21b6] text-white">
                <tr>
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Current Stock</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      No inventory items
                    </td>
                  </tr>
                ) : (
                  items.map((item: ProgramItem) => {
                    const outOfStock = item.current_stock === 0;
                    const lowStock =
                      !outOfStock &&
                      item.minimum_stock_level > 0 &&
                      item.current_stock <= item.minimum_stock_level;

                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{item.item_name}</td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">
                          {item.current_stock} {item.unit_of_measure}
                        </td>
                        <td className="px-3 py-2">
                          {outOfStock ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                              Out of Stock
                            </span>
                          ) : lowStock ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-900">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Clients & Last Dispensation</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#5b21b6] text-white">
                <tr>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Phone</th>
                  <th className="text-left px-3 py-2">Last Item</th>
                  <th className="text-left px-3 py-2">Qty</th>
                  <th className="text-left px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {clientSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      No clients yet
                    </td>
                  </tr>
                ) : (
                  clientSummaries.map((c: ProgramClientSummary) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 font-mono">{c.client_code}</td>
                      <td className="px-3 py-2">{c.full_name}</td>
                      <td className="px-3 py-2">{c.phone || '-'}</td>
                      <td className="px-3 py-2">{c.last_item_name || <span className="text-gray-400">Never</span>}</td>
                      <td className="px-3 py-2">{c.last_quantity ?? '-'}</td>
                      <td className="px-3 py-2">
                        {c.last_dispensed_date
                          ? new Date(c.last_dispensed_date).toLocaleDateString()
                          : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
            <h2 className="font-semibold mb-4">Add Program Client</h2>
            <form className="space-y-3" onSubmit={handleCreateClient}>
              <input
                required
                value={clientForm.full_name}
                onChange={(e) => setClientForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Full name"
                className="w-full h-10 rounded-lg border px-3 text-sm"
              />
              <input
                value={clientForm.phone || ''}
                onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone (optional)"
                className="w-full h-10 rounded-lg border px-3 text-sm"
              />
              <input
                type="email"
                value={clientForm.email || ''}
                onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email (optional)"
                className="w-full h-10 rounded-lg border px-3 text-sm"
              />
              <button
                type="submit"
                disabled={createClientMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm"
              >
                {createClientMutation.isPending ? 'Saving...' : 'Add Client'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-[#5b21b6] text-white">
                <tr>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                      No clients yet
                    </td>
                  </tr>
                ) : (
                  clients.map((client: ProgramClient) => (
                    <tr key={client.id} className="border-t">
                      <td className="px-3 py-2 font-mono">{client.client_code}</td>
                      <td className="px-3 py-2">{client.full_name}</td>
                      <td className="px-3 py-2">{client.phone || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
              <h2 className="font-semibold mb-4">Add Program Item</h2>
              <form className="space-y-3" onSubmit={handleCreateItem}>
                <select
                  value={itemForm.category}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      category: e.target.value as CreateProgramItemRequest['category'],
                    }))
                  }
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                >
                  <option value="Condom">Condom</option>
                  <option value="Lubricant">Lubricant</option>
                  <option value="SelfTestKit">Self Test Kit</option>
                  <option value="Other">Other</option>
                </select>
                {itemForm.category === 'Other' && (
                  <input
                    required
                    value={itemForm.other_specify || ''}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, other_specify: e.target.value }))}
                    placeholder="Specify item type (e.g. Pregnancy Test Kit)"
                    className="w-full h-10 rounded-lg border px-3 text-sm"
                  />
                )}
                <input
                  value={itemForm.unit_of_measure || ''}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, unit_of_measure: e.target.value }))}
                  placeholder="Unit of measure"
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={itemForm.minimum_stock_level ?? 0}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, minimum_stock_level: Number(e.target.value) }))
                  }
                  placeholder="Minimum stock level"
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                />
                <textarea
                  value={itemForm.description || ''}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={createItemMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm"
                >
                  {createItemMutation.isPending ? 'Saving...' : 'Add Item'}
                </button>
              </form>
            </div>

            <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
              <h2 className="font-semibold mb-4">Add Stock</h2>
              <form className="space-y-3" onSubmit={handleAddStock}>
                <select
                  required
                  value={addStockForm.item_id}
                  onChange={(e) => setAddStockForm((prev) => ({ ...prev, item_id: e.target.value }))}
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                >
                  <option value="">Select item</option>
                  {items.map((item: ProgramItem) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.item_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={addStockQtyStr}
                  onChange={(e) => setAddStockQtyStr(e.target.value)}
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                  placeholder="Quantity"
                />
                <input
                  type="date"
                  value={addStockForm.transaction_date || today}
                  onChange={(e) =>
                    setAddStockForm((prev) => ({ ...prev, transaction_date: e.target.value }))
                  }
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                />
                <input
                  value={addStockForm.voucher_ref_no || ''}
                  onChange={(e) => setAddStockForm((prev) => ({ ...prev, voucher_ref_no: e.target.value }))}
                  placeholder="Voucher / Ref No"
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                />
                <input
                  value={addStockForm.counterparty || ''}
                  onChange={(e) => setAddStockForm((prev) => ({ ...prev, counterparty: e.target.value }))}
                  placeholder="Received from"
                  className="w-full h-10 rounded-lg border px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={addStockMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm"
                >
                  {addStockMutation.isPending ? 'Saving...' : 'Add Stock'}
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="bg-[#5b21b6] text-white">
                <tr>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-left px-3 py-2">Stock</th>
                  <th className="text-left px-3 py-2">Min</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  items.map((item: ProgramItem) => {
                    const lowStock =
                      item.minimum_stock_level > 0 && item.current_stock <= item.minimum_stock_level;
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 font-mono">{item.item_code}</td>
                        <td className="px-3 py-2">{item.item_name}</td>
                        <td className={`px-3 py-2 font-semibold ${lowStock ? 'text-red-600' : ''}`}>
                          {item.current_stock} {item.unit_of_measure}
                        </td>
                        <td className="px-3 py-2">{item.minimum_stock_level}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dispense' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
            <h2 className="font-semibold mb-4">Dispense Item</h2>
            <form className="space-y-3" onSubmit={handleDispense}>
              <select
                required
                value={dispenseForm.item_id}
                onChange={(e) => setDispenseForm((prev) => ({ ...prev, item_id: e.target.value }))}
                className="w-full h-10 rounded-lg border px-3 text-sm"
              >
                <option value="">Select item</option>
                {items.map((item: ProgramItem) => (
                  <option key={item.id} value={item.id}>
                    {item.item_code} - {item.item_name} ({item.current_stock} {item.unit_of_measure})
                  </option>
                ))}
              </select>
              {selectedDispenseItem && (
                <p className="text-xs text-gray-600">
                  Available stock: {selectedDispenseItem.current_stock} {selectedDispenseItem.unit_of_measure}
                </p>
              )}
              <input
                type="number"
                min={1}
                max={selectedDispenseItem?.current_stock ?? undefined}
                value={dispenseQtyStr}
                onChange={(e) => setDispenseQtyStr(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm"
                placeholder="Quantity"
              />
              <div className="relative">
                <input
                  value={selectedClient ? selectedClient.full_name : clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setDispenseForm((prev) => ({ ...prev, client_id: '' }));
                    setClientSearchOpen(true);
                  }}
                  onFocus={() => setClientSearchOpen(true)}
                  onBlur={() => setTimeout(() => setClientSearchOpen(false), 150)}
                  placeholder="Search client (optional)"
                  className="w-full h-10 rounded-lg border px-3 pr-8 text-sm"
                />
                {selectedClient && (
                  <button
                    type="button"
                    onClick={() => {
                      setDispenseForm((prev) => ({ ...prev, client_id: '' }));
                      setClientSearchQuery('');
                    }}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 text-base leading-none"
                  >
                    ×
                  </button>
                )}
                {clientSearchOpen && !selectedClient && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                    <div
                      onMouseDown={() => {
                        setDispenseForm((prev) => ({ ...prev, client_id: '' }));
                        setClientSearchQuery('');
                        setClientSearchOpen(false);
                      }}
                      className="px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 border-b"
                    >
                      No client (anonymous)
                    </div>
                    {filteredClients.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">No clients found</div>
                    ) : (
                      filteredClients.map((c: ProgramClient) => (
                        <div
                          key={c.id}
                          onMouseDown={() => {
                            setDispenseForm((prev) => ({ ...prev, client_id: c.id }));
                            setClientSearchQuery('');
                            setClientSearchOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-purple-50"
                        >
                          <span className="font-mono text-xs text-gray-500">{c.client_code}</span> {c.full_name}
                          {c.phone && <span className="text-gray-400 ml-1">. {c.phone}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <input
                type="date"
                value={dispenseForm.transaction_date || today}
                onChange={(e) =>
                  setDispenseForm((prev) => ({ ...prev, transaction_date: e.target.value }))
                }
                className="w-full h-10 rounded-lg border px-3 text-sm"
              />
              <textarea
                value={dispenseForm.notes || ''}
                onChange={(e) => setDispenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
              />
              <button
                type="submit"
                disabled={dispenseMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[#5b21b6] text-white text-sm"
              >
                {dispenseMutation.isPending ? 'Saving...' : 'Dispense'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
            <h2 className="font-semibold mb-4">Quick Guidance</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>Item stock is decremented automatically after dispense.</li>
              <li>Client selection is optional for walk-in anonymous distribution.</li>
              <li>Use notes for audit context (event, outreach location, team).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{title}</p>
        <div className="text-[#5b21b6]">{icon}</div>
      </div>
      <p className="text-2xl font-bold mt-2">{value.toLocaleString()}</p>
    </div>
  );
}
