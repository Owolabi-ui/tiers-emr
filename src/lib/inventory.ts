// Inventory API Client
// TypeScript interfaces and API functions for inventory management module

import { api } from './api';

// ============================================================================
// ENUMS
// ============================================================================

export type ItemCategory = 'Medication' | 'Supply' | 'Equipment' | 'Other';

export type MovementType =
  | 'Receipt'
  | 'Dispensing'
  | 'Adjustment'
  | 'Transfer'
  | 'Wastage'
  | 'Expiry';

export type AlertType = 'LowStock' | 'OutOfStock' | 'NearExpiry' | 'Expired';

export type AlertSeverity = 'Info' | 'Warning' | 'Critical';

// ============================================================================
// INTERFACES - INVENTORY ITEMS
// ============================================================================

export interface InventoryItem {
  id: number;
  clinic_id: string;
  item_code: string;
  name: string;
  category: ItemCategory;
  unit_of_measure: string;
  current_stock: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateInventoryItemRequest {
  item_code: string;
  name: string;
  category: ItemCategory;
  unit_of_measure: string;
  reorder_level?: number;
  reorder_quantity?: number;
  unit_cost?: number;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  unit_of_measure?: string;
  reorder_level?: number;
  reorder_quantity?: number;
  unit_cost?: number;
  is_active?: boolean;
}

export interface InventoryItemListResponse {
  items: InventoryItem[];
  total: number;
}

// ============================================================================
// INTERFACES - INVENTORY BATCHES
// ============================================================================

export interface InventoryBatch {
  id: number;
  item_id: number;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string | null;
  quantity: number;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatchResponse {
  id: number;
  item_id: number;
  item_name: string;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string | null;
  quantity: number;
  is_expired: boolean;
  created_at: string;
}

export interface CreateBatchRequest {
  item_id: number;
  batch_number: string;
  manufacture_date?: string;
  expiry_date?: string;
  quantity: number;
}

export interface BatchListResponse {
  batches: BatchResponse[];
  total: number;
}

// ============================================================================
// INTERFACES - STOCK MOVEMENTS
// ============================================================================

export interface StockMovement {
  id: number;
  item_id: number;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number | null;
  reference_no: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  notes: string | null;
  batch_id: number | null;
  performed_at: string;
  performed_by: string;
}

export interface StockMovementResponse {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number | null;
  reference_no: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  notes: string | null;
  batch_id: number | null;
  batch_number: string | null;
  performed_at: string;
  performed_by: string;
  performed_by_name: string | null;
}

export interface RecordStockMovementRequest {
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  reference_no?: string;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  notes?: string;
  batch_id?: number;
}

export interface StockMovementListResponse {
  movements: StockMovementResponse[];
  total: number;
}

// ============================================================================
// INTERFACES - STOCK OPERATIONS
// ============================================================================

export interface ReceiveStockRequest {
  batch_number?: string;
  manufacture_date?: string;
  expiry_date?: string;
  quantity: number;
  unit_cost?: number;
  reference_no?: string;
  notes?: string;
}

export interface DispenseStockRequest {
  quantity: number;
  reason?: string;
  batch_id?: number;
  prescription_id?: string;
}

export interface AdjustStockRequest {
  quantity: number;
  reason?: string;
  reference_no?: string;
}

// ============================================================================
// INTERFACES - STOCK ALERTS
// ============================================================================

export interface StockAlert {
  id: number;
  item_id: number | null;
  drug_id: number | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold_value: number | null;
  current_value: number | null;
  is_active: boolean;
  is_dismissed: boolean;
  dismissed_at: string | null;
  dismissed_by: string | null;
  dismiss_reason: string | null;
  first_triggered_at: string;
  last_triggered_at: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface StockAlertResponse {
  id: number;
  item_id: number | null;
  drug_id: number | null;
  item_code: string | null;
  item_name: string | null;
  source_type: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold_value: number | null;
  current_value: number | null;
  is_active: boolean;
  is_dismissed: boolean;
  dismissed_at: string | null;
  dismissed_by: string | null;
  dismissed_by_name: string | null;
  dismiss_reason: string | null;
  first_triggered_at: string;
  last_triggered_at: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlertListResponse {
  alerts: StockAlertResponse[];
  total: number;
}

export interface AlertSummary {
  total_active: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  near_expiry_count: number;
  expired_count: number;
}

export interface DismissAlertRequest {
  reason?: string;
}

// ============================================================================
// API FUNCTIONS - INVENTORY ITEMS
// ============================================================================

export const inventoryApi = {
  // ============================================================================
  // Inventory Items
  // ============================================================================

  /**
   * Get all inventory items
   */
  async getItems(params?: {
    clinic_id?: number;
    category?: ItemCategory;
    active_only?: boolean;
  }): Promise<InventoryItemListResponse> {
    const response = await api.get('/api/v1/inventory/items', { params });
    return response.data;
  },

  /**
   * Get a single inventory item by ID
   */
  async getItem(itemId: number): Promise<InventoryItem> {
    const response = await api.get(`/api/v1/inventory/items/${itemId}`);
    return response.data;
  },

  /**
   * Create a new inventory item
   */
  async createItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
    const response = await api.post('/api/v1/inventory/items', data);
    return response.data;
  },

  /**
   * Update an existing inventory item
   */
  async updateItem(
    itemId: number,
    data: UpdateInventoryItemRequest
  ): Promise<InventoryItem> {
    const response = await api.put(`/api/v1/inventory/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Get low stock items
   */
  async getLowStockItems(clinicId?: number): Promise<InventoryItemListResponse> {
    const params = clinicId ? { clinic_id: clinicId } : undefined;
    const response = await api.get('/api/v1/inventory/items/low-stock', { params });
    return response.data;
  },

  // ============================================================================
  // Inventory Batches
  // ============================================================================

  /**
   * Get batches for a specific item
   */
  async getItemBatches(itemId: number): Promise<BatchListResponse> {
    const response = await api.get(`/api/v1/inventory/items/${itemId}/batches`);
    return response.data;
  },

  /**
   * Create a new batch for an item
   */
  async createBatch(data: CreateBatchRequest): Promise<BatchResponse> {
    const response = await api.post('/api/v1/inventory/batches', data);
    return response.data;
  },

  /**
   * Get expiring batches
   */
  async getExpiringBatches(params?: {
    days?: number;
    item_id?: number;
  }): Promise<BatchListResponse> {
    const response = await api.get('/api/v1/inventory/batches/expiring', { params });
    return response.data;
  },

  // ============================================================================
  // Stock Movements
  // ============================================================================

  /**
   * Get all stock movements (optionally filtered by item)
   */
  async getMovements(itemId?: number): Promise<StockMovementListResponse> {
    const params = itemId ? { item_id: itemId } : undefined;
    const response = await api.get('/api/v1/inventory/movements', { params });
    return response.data;
  },

  /**
   * Get stock movements for a specific item
   */
  async getItemMovements(itemId: number): Promise<StockMovementListResponse> {
    const response = await api.get(`/api/v1/inventory/items/${itemId}/movements`);
    return response.data;
  },

  /**
   * Record a stock movement (manual adjustment, receipt, etc.)
   */
  async recordMovement(
    itemId: number,
    data: RecordStockMovementRequest
  ): Promise<StockMovementResponse> {
    const response = await api.post(
      `/api/v1/inventory/items/${itemId}/movements`,
      data
    );
    return response.data;
  },

  // ============================================================================
  // Stock Operations
  // ============================================================================

  /**
   * Receive stock for an item
   */
  async receiveStock(
    itemId: number,
    data: ReceiveStockRequest
  ): Promise<InventoryItem> {
    const response = await api.post(
      `/api/v1/inventory/items/${itemId}/receive`,
      data
    );
    return response.data;
  },

  /**
   * Dispense stock for an item
   */
  async dispenseStock(
    itemId: number,
    data: DispenseStockRequest
  ): Promise<InventoryItem> {
    const response = await api.post(
      `/api/v1/inventory/items/${itemId}/dispense`,
      data
    );
    return response.data;
  },

  /**
   * Adjust stock for an item
   */
  async adjustStock(
    itemId: number,
    data: AdjustStockRequest
  ): Promise<InventoryItem> {
    const response = await api.post(
      `/api/v1/inventory/items/${itemId}/adjust`,
      data
    );
    return response.data;
  },

  // ============================================================================
  // Stock Alerts
  // ============================================================================

  /**
   * Get active stock alerts (optionally filtered)
   */
  async getAlerts(params?: {
    severity?: AlertSeverity;
    alert_type?: AlertType;
  }): Promise<AlertListResponse> {
    const response = await api.get('/api/v1/inventory/alerts', { params });
    return response.data;
  },

  /**
   * Get alert summary statistics
   */
  async getAlertSummary(): Promise<AlertSummary> {
    const response = await api.get('/api/v1/inventory/alerts/summary');
    return response.data;
  },

  /**
   * Check and update all stock alerts
   */
  async checkAlerts(): Promise<{ alerts_created: number; message: string }> {
    const response = await api.post('/api/v1/inventory/alerts/check');
    return response.data;
  },

  /**
   * Get alert by ID
   */
  async getAlert(alertId: number): Promise<StockAlertResponse> {
    const response = await api.get(`/api/v1/inventory/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Dismiss an alert
   */
  async dismissAlert(
    alertId: number,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(
      `/api/v1/inventory/alerts/${alertId}/dismiss`,
      { reason }
    );
    return response.data;
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format movement type for display
 */
export function formatMovementType(type: MovementType): string {
  return type;
}

/**
 * Get movement type badge color for UI
 */
export function getMovementTypeBadgeColor(type: MovementType): string {
  switch (type) {
    case 'Receipt':
      return 'bg-green-100 text-green-800';
    case 'Dispensing':
      return 'bg-blue-100 text-blue-800';
    case 'Adjustment':
      return 'bg-yellow-100 text-yellow-800';
    case 'Transfer':
      return 'bg-purple-100 text-purple-800';
    case 'Wastage':
      return 'bg-red-100 text-red-800';
    case 'Expiry':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Check if item stock is low
 */
export function isLowStock(item: InventoryItem): boolean {
  return item.current_stock <= item.reorder_level;
}

/**
 * Format stock quantity with unit
 */
export function formatStockQuantity(item: InventoryItem): string {
  return `${item.current_stock} ${item.unit_of_measure}`;
}

/**
 * Calculate stock value
 */
export function calculateStockValue(item: InventoryItem): number {
  return item.current_stock * (item.unit_cost || 0);
}

/**
 * Get alert severity badge color
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'Critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get alert icon color
 */
export function getAlertIconColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'Critical':
      return 'text-red-600';
    case 'Warning':
      return 'text-yellow-600';
    case 'Info':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Format alert type for display
 */
export function formatAlertType(type: AlertType): string {
  switch (type) {
    case 'LowStock':
      return 'Low Stock';
    case 'OutOfStock':
      return 'Out of Stock';
    case 'NearExpiry':
      return 'Near Expiry';
    case 'Expired':
      return 'Expired';
    default:
      return type;
  }
}
