import { fetchWithAuth } from './api';

export interface StockAdjustmentData {
  productId: number;
  adjustmentType: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  transactionId: string;
}

export const inventoryService = {
  adjustStock: async (data: StockAdjustmentData): Promise<{ 
    success: boolean; 
    message: string; 
    productId: number; 
    stockAfter: number 
  }> => {
    return fetchWithAuth('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMovements: async (productId: number): Promise<any[]> => {
    return fetchWithAuth(`/inventory/${productId}/movements`);
  }
};
