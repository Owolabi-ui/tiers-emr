import { api } from './api';

export interface LabInventoryItem {
  id: string;
  product_code: string;
  product_name: string;
  description?: string | null;
  unit_of_measure: string;
  category?: string | null;
  current_balance: string;
  minimum_stock_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string | null;
}

export interface LabInventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'RECEIVED' | 'ISSUED' | 'ADJUSTMENT' | string;
  transaction_date: string;
  voucher_number?: string | null;
  counterparty?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity: string;
  balance_after: string;
  notes?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface LabInventoryTransactionWithItem extends LabInventoryTransaction {
  product_code: string;
  product_name: string;
}

export interface CreateLabInventoryItemRequest {
  product_name: string;
  description?: string | null;
  unit_of_measure: string;
  category?: string | null;
  minimum_stock_level?: number | string | null;
}

export interface UpdateLabInventoryItemRequest {
  product_name?: string;
  description?: string | null;
  unit_of_measure?: string;
  category?: string | null;
  minimum_stock_level?: number | string | null;
  is_active?: boolean;
}

export interface CreateLabInventoryTransactionRequest {
  item_id: string;
  transaction_date: string;
  voucher_number?: string | null;
  counterparty?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity: number | string;
  notes?: string | null;
}

export const labInventoryApi = {
  listItems: async (params?: { search?: string; category?: string; active_only?: boolean }) => {
    const response = await api.get<LabInventoryItem[]>('/api/v1/lab-inventory/items', { params });
    return response.data;
  },
  getItem: async (id: string) => {
    const response = await api.get<LabInventoryItem>(`/api/v1/lab-inventory/items/${id}`);
    return response.data;
  },
  createItem: async (payload: CreateLabInventoryItemRequest) => {
    const response = await api.post<LabInventoryItem>('/api/v1/lab-inventory/items', payload);
    return response.data;
  },
  updateItem: async (id: string, payload: UpdateLabInventoryItemRequest) => {
    const response = await api.put<LabInventoryItem>(`/api/v1/lab-inventory/items/${id}`, payload);
    return response.data;
  },
  deactivateItem: async (id: string) => {
    await api.delete(`/api/v1/lab-inventory/items/${id}`);
  },
  listTransactions: async (params?: {
    item_id?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }) => {
    const response = await api.get<LabInventoryTransactionWithItem[]>('/api/v1/lab-inventory/transactions', { params });
    return response.data;
  },
  getItemTransactions: async (itemId: string) => {
    const response = await api.get<LabInventoryTransactionWithItem[]>(`/api/v1/lab-inventory/transactions/item/${itemId}`);
    return response.data;
  },
  receiveStock: async (payload: CreateLabInventoryTransactionRequest) => {
    const response = await api.post<LabInventoryTransaction>('/api/v1/lab-inventory/transactions/receive', payload);
    return response.data;
  },
  issueStock: async (payload: CreateLabInventoryTransactionRequest) => {
    const response = await api.post<LabInventoryTransaction>('/api/v1/lab-inventory/transactions/issue', payload);
    return response.data;
  },
  adjustStock: async (payload: CreateLabInventoryTransactionRequest) => {
    const response = await api.post<LabInventoryTransaction>('/api/v1/lab-inventory/transactions/adjust', payload);
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get<LabInventoryItem[]>('/api/v1/lab-inventory/reports/low-stock');
    return response.data;
  },
  getExpiringSoon: async (days = 90) => {
    const response = await api.get<LabInventoryTransactionWithItem[]>('/api/v1/lab-inventory/reports/expiring-soon', {
      params: { days },
    });
    return response.data;
  },
};
