import { fetchWithAuth } from './api';
import type { SaleCreateDto, CashSession, PaymentMethod } from '../types/sales';

export const salesService = {
  createSale: async (data: SaleCreateDto): Promise<{ success: boolean; saleId: number }> => {
    return fetchWithAuth('/sales', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // Assuming this endpoint exists or will be added to catalogs
    return fetchWithAuth('/catalogs/payment-methods');
  },

  // Cash Session (Caja)
  getCurrentSession: async (): Promise<{ session: CashSession; live_metrics: any }> => {
    return fetchWithAuth('/cash-sessions/current');
  },

  openSession: async (openingBalance: number, notes?: string): Promise<any> => {
    return fetchWithAuth('/cash-sessions/open', {
      method: 'POST',
      body: JSON.stringify({ opening_balance: openingBalance, notes })
    });
  },

  closeSession: async (actualBalance: number, notes?: string): Promise<any> => {
    return fetchWithAuth('/cash-sessions/close', {
      method: 'POST',
      body: JSON.stringify({ actual_balance: actualBalance, notes })
    });
  },

  getSales: async (filters: any = {}): Promise<any[]> => {
    const query = new URLSearchParams();
    if (filters.search) query.append('search', filters.search);
    if (filters.status) query.append('status', filters.status);
    if (filters.startDate) query.append('startDate', filters.startDate);
    if (filters.endDate) query.append('endDate', filters.endDate);
    
    return fetchWithAuth(`/sales?${query.toString()}`);
  },

  getSaleById: async (id: number): Promise<any> => {
    return fetchWithAuth(`/sales/${id}`);
  },

  voidSale: async (id: number, reason: string): Promise<{ success: boolean; message: string }> => {
    return fetchWithAuth(`/sales/${id}/void`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  processReturn: async (id: number, reason: string, refundMethodId: number, items: { sale_detail_id: number; quantity: number }[]): Promise<{ success: boolean; message: string }> => {
    return fetchWithAuth(`/sales/${id}/returns`, {
      method: 'POST',
      body: JSON.stringify({ reason, refundMethodId, items })
    });
  }
};
