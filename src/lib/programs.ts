import { api } from './api';

export type ProgramItemCategory = 'Condom' | 'Lubricant' | 'SelfTestKit' | 'Other';
export type ProgramTransactionType = 'RECEIVED' | 'DISPENSED' | 'ADJUSTMENT';

export interface ProgramClient {
  id: string;
  client_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramItem {
  id: string;
  item_code: string;
  item_name: string;
  category: ProgramItemCategory;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock_level: number;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramStockTransaction {
  id: string;
  item_id: string;
  transaction_type: ProgramTransactionType;
  quantity: number;
  balance_after: number;
  client_id: string | null;
  transaction_date: string;
  voucher_ref_no: string | null;
  counterparty: string | null;
  batch_no: string | null;
  expiry_date: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface ProgramsStatistics {
  total_clients: number;
  total_items: number;
  low_stock_items: number;
  total_dispensed_this_month: number;
  total_received_this_month: number;
}

export interface ProgramClientSummary {
  id: string;
  client_code: string;
  full_name: string;
  phone: string | null;
  last_item_name: string | null;
  last_quantity: number | null;
  last_dispensed_date: string | null;
}

export interface CreateProgramClientRequest {
  full_name: string;
  phone?: string;
  email?: string;
}

export interface CreateProgramItemRequest {
  item_name: string;
  category: ProgramItemCategory;
  unit_of_measure?: string;
  minimum_stock_level?: number;
  description?: string;
}

export interface ProgramStockRequest {
  item_id: string;
  quantity: number;
  client_id?: string;
  transaction_date?: string;
  voucher_ref_no?: string;
  counterparty?: string;
  batch_no?: string;
  expiry_date?: string;
  notes?: string;
}

export const programsApi = {
  listClients: async (): Promise<ProgramClient[]> => {
    const response = await api.get<ProgramClient[]>('/api/v1/programs/clients');
    return response.data;
  },

  listClientsSummary: async (): Promise<ProgramClientSummary[]> => {
    const response = await api.get<ProgramClientSummary[]>('/api/v1/programs/clients/summary');
    return response.data;
  },

  searchClients: async (q: string): Promise<ProgramClient[]> => {
    const response = await api.get<ProgramClient[]>(
      `/api/v1/programs/clients/search?q=${encodeURIComponent(q)}`
    );
    return response.data;
  },

  createClient: async (data: CreateProgramClientRequest): Promise<ProgramClient> => {
    const response = await api.post<ProgramClient>('/api/v1/programs/clients', data);
    return response.data;
  },

  listItems: async (): Promise<ProgramItem[]> => {
    const response = await api.get<ProgramItem[]>('/api/v1/programs/items');
    return response.data;
  },

  createItem: async (data: CreateProgramItemRequest): Promise<ProgramItem> => {
    const response = await api.post<ProgramItem>('/api/v1/programs/items', data);
    return response.data;
  },

  addStock: async (data: ProgramStockRequest): Promise<ProgramStockTransaction> => {
    const response = await api.post<ProgramStockTransaction>('/api/v1/programs/stock/add', data);
    return response.data;
  },

  dispense: async (data: ProgramStockRequest): Promise<ProgramStockTransaction> => {
    const response = await api.post<ProgramStockTransaction>('/api/v1/programs/stock/dispense', data);
    return response.data;
  },

  adjust: async (data: ProgramStockRequest): Promise<ProgramStockTransaction> => {
    const response = await api.post<ProgramStockTransaction>('/api/v1/programs/stock/adjust', data);
    return response.data;
  },

  getItemTransactions: async (itemId: string): Promise<ProgramStockTransaction[]> => {
    const response = await api.get<ProgramStockTransaction[]>(
      `/api/v1/programs/items/${itemId}/transactions`
    );
    return response.data;
  },

  getStatistics: async (): Promise<ProgramsStatistics> => {
    const response = await api.get<ProgramsStatistics>('/api/v1/programs/statistics');
    return response.data;
  },
};
