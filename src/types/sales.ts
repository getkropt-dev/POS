export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id?: number;
  unit_price: number;
  unit_cost: number;
  tax_rate: number;
  stock_quantity: number;
  manages_inventory: boolean;
  min_stock?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  movement_type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SALE' | 'SALE_VOID' | 'PURCHASE' | 'RETURN';
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_cost: number;
  reference_type: string;
  reference_id?: number;
  transaction_id?: string;
  notes?: string;
  created_by: number;
  created_at: string;
}

export interface SaleDetail {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_subtotal: number;
  tax_rate_applied: number;
  line_tax: number;
  line_discount: number;
  line_total: number;
  line_profit: number;
}

export interface SalePayment {
  payment_method_id: number;
  payment_method_name: string;
  amount: number;
  reference_number?: string;
}

export interface SaleCreateDto {
  invoice_number?: string;
  customer_id?: number;
  total_subtotal: number;
  total_tax: number;
  total_discount: number;
  total_final_amount: number;
  total_paid: number;
  details: SaleDetail[];
  payments: SalePayment[];
}

export interface CashSession {
  id: number;
  user_id: number;
  opening_balance: number;
  expected_balance?: number;
  actual_balance?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
}

export interface SaleDetailDb {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  quantity_returned: number;
  unit_price: number;
  unit_cost: number;
  tax_rate_applied: number;
  tax_amount_applied: number;
  line_subtotal: number;
  line_tax: number;
  line_total: number;
  line_profit: number;
}

export interface SalePaymentDb {
  id: number;
  sale_id: number;
  payment_method_id: number;
  payment_method_name: string;
  amount: number;
  reference_code?: string;
  paid_at: string;
}

export interface SaleReturnDetail {
  id: number;
  sale_return_id: number;
  sale_detail_id: number;
  product_id: number;
  product_name: string;
  quantity_returned: number;
  unit_price: number;
  line_refund: number;
  restock: boolean;
}

export interface SaleReturn {
  id: number;
  original_sale_id: number;
  return_date: string;
  reason: string;
  status: string;
  total_refund: number;
  refund_method_id: number;
  refund_method_name: string;
  created_by: number;
  created_by_name: string;
  details?: SaleReturnDetail[];
}

export interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  customer_id?: number;
  customer_name?: string;
  created_by: number;
  cashier_name: string;
  status: 'COMPLETED' | 'VOIDED' | 'PARTIAL_RETURN';
  voided_at?: string;
  voided_by?: number;
  voided_by_name?: string;
  void_reason?: string;
  cash_session_id?: number;
  total_cost_sum: number;
  total_tax_sum: number;
  total_net_amount: number;
  total_final_amount: number;
  total_paid: number;
  change_given: number;
  notes?: string;
  created_at: string;
  
  details?: SaleDetailDb[];
  payments?: SalePaymentDb[];
  returns?: SaleReturn[];
}
