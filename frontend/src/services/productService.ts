import { fetchWithAuth } from './api';
import type { Product } from '../types/sales';

export const productService = {
  getProducts: async (search?: string): Promise<Product[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchWithAuth(`/products${query}`);
  },

  getProductBySku: async (sku: string): Promise<Product> => {
    return fetchWithAuth(`/products/sku/${sku}`);
  },

  createProduct: async (data: Partial<Product>): Promise<{ success: boolean; product: Product }> => {
    return fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProduct: async (id: number, data: Partial<Product>): Promise<{ success: boolean; product: Product }> => {
    return fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  suggestPrice: async (id: number, margin: number): Promise<{ success: boolean; suggested_selling_price: number }> => {
    return fetchWithAuth(`/products/${id}/suggest-price?margin=${margin}`);
  },

  deleteProduct: async (id: number): Promise<{ success: boolean; message: string }> => {
    return fetchWithAuth(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};
