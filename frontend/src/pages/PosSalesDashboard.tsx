import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Maximize2,
  Store
} from 'lucide-react';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { fetchWithAuth } from '../services/api';
import { useUI } from '../context/UIContext';
import type { Product, SaleDetail, PaymentMethod, SaleCreateDto } from '../types/sales';
import './sales.css';

const PosSalesDashboard: React.FC = () => {
  const { showAlert } = useUI();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [processingSale, setProcessingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [cashSession, setCashSession] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Totals calculation
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.line_subtotal, 0);
    const tax = cart.reduce((acc, item) => acc + item.line_tax, 0);
    const total = cart.reduce((acc, item) => acc + item.line_total, 0);
    return { subtotal, tax, total };
  }, [cart]);

  const change = Math.max(0, amountPaid - totals.total);

  const cartRef = useRef(cart);
  const showPaymentModalRef = useRef(showPaymentModal);

  useEffect(() => {
    cartRef.current = cart;
    showPaymentModalRef.current = showPaymentModal;
  }, [cart, showPaymentModal]);

  useEffect(() => {
    loadInitialData();
    // Focus search on mount
    searchInputRef.current?.focus();

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (cartRef.current.length > 0) setShowPaymentModal(true);
      }
      if (e.key === 'Escape') {
        if (showPaymentModalRef.current) {
          setShowPaymentModal(false);
        } else {
          setSearchTerm('');
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [prods, methods, sessionData, catsData] = await Promise.allSettled([
        productService.getProducts(),
        salesService.getPaymentMethods(),
        salesService.getCurrentSession(),
        fetchWithAuth('/catalogs/categories')
      ]);

      if (prods.status === 'fulfilled') setProducts(prods.value);
      if (methods.status === 'fulfilled') {
        const activeMethods = methods.value.filter(m => m.is_active);
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0) setSelectedPaymentMethod(activeMethods[0].id);
      }
      if (sessionData.status === 'fulfilled') {
        setCashSession(sessionData.value.session);
      }
      if (catsData.status === 'fulfilled') {
        setCategories(catsData.value);
      }
    } catch (error) {
      console.error('Error loading POS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async () => {
    try {
      setIsOpeningSession(true);
      const res = await salesService.openSession(openingBalance);
      setCashSession(res.session);
      searchInputRef.current?.focus();
    } catch (error: any) {
      showAlert({
        title: 'Error de Apertura',
        message: error.message || 'Error al abrir caja',
        type: 'danger'
      });
    } finally {
      setIsOpeningSession(false);
    }
  };

  const formatCurrency = (val: number) => {
    // Format number with spaces as thousands separators
    const formatted = new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val).replace(/\./g, ' '); // Replace dots (if any) with spaces
    
    return `₡${formatted}`;
  };

  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    setter(numValue);
  };

  // Search state observer with debounce
  useEffect(() => {
    if (!searchTerm) {
      productService.getProducts().then(setProducts).catch(console.error);
      return;
    }

    if (searchTerm.length >= 8 && /^\d+$/.test(searchTerm)) {
      const product = products.find(p => p.sku === searchTerm || p.barcode === searchTerm);
      if (product) {
        addToCart(product);
        setSearchTerm('');
        return;
      }
    }

    const delaySearch = setTimeout(async () => {
      try {
        const results = await productService.getProducts(searchTerm);
        setProducts(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const calculateLineItem = (
    basePrice: number, 
    baseCost: number, 
    taxRate: number, 
    quantity: number, 
    existingData: Partial<SaleDetail>
  ): SaleDetail => {
    const subtotal = basePrice * quantity;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      ...existingData,
      quantity,
      line_subtotal: subtotal,
      line_tax: tax,
      line_total: total,
      line_profit: total - (baseCost * quantity)
    } as SaleDetail;
  };

  const addToCart = (product: Product) => {
    if (product.manages_inventory) {
      const existingItem = cart.find(item => item.product_id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const newQty = currentQty + 1;
      if (newQty > product.stock_quantity) {
        showAlert({
          title: 'Aviso de Inventario',
          message: `El producto "${product.name}" no cuenta con suficiente inventario (Disponible: ${product.stock_quantity}, Solicitado: ${newQty}). La venta generará un saldo negativo en el inventario.`,
          type: 'warning'
        });
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? calculateLineItem(item.unit_price, item.unit_cost, item.tax_rate_applied, item.quantity + 1, item)
            : item
        );
      }
      
      const newBase = {
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.unit_price),
        unit_cost: Number(product.unit_cost),
        tax_rate_applied: Number(product.tax_rate || 0),
        line_discount: 0
      };
      
      return [...prev, calculateLineItem(newBase.unit_price, newBase.unit_cost, newBase.tax_rate_applied, 1, newBase)];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        
        // Find product only to check stock if possible
        const product = products.find(p => p.id === productId);
        if (product && product.manages_inventory && delta > 0 && newQty > product.stock_quantity) {
          showAlert({
            title: 'Aviso de Inventario',
            message: `El producto "${product.name}" no cuenta con suficiente inventario (Disponible: ${product.stock_quantity}, Solicitado: ${newQty}). La venta generará un saldo negativo en el inventario.`,
            type: 'warning'
          });
        }
        
        return calculateLineItem(
          item.unit_price, 
          item.unit_cost, 
          item.tax_rate_applied, 
          newQty, 
          item
        );
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (!selectedPaymentMethod || amountPaid < totals.total) return;

    try {
      setProcessingSale(true);
      const saleData: SaleCreateDto = {
        total_subtotal: totals.subtotal,
        total_tax: totals.tax,
        total_discount: 0,
        total_final_amount: totals.total,
        total_paid: amountPaid,
        details: cart,
        payments: [
          {
            payment_method_id: selectedPaymentMethod,
            payment_method_name: paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || '',
            amount: totals.total,
            reference_number: referenceNumber.trim() || undefined
          }
        ]
      };

      await salesService.createSale(saleData);
      setSaleSuccess(true);
      setTimeout(() => {
        setCart([]);
        setShowPaymentModal(false);
        setSaleSuccess(false);
        setAmountPaid(0);
        setReferenceNumber('');
        setSearchTerm('');
        searchInputRef.current?.focus();
      }, 2000);
    } catch (error: any) {
      console.error('Checkout error:', error);
      let errorMessage = error.message || '';
      if (errorMessage.includes(' - ')) {
        errorMessage = errorMessage.split(' - ')[1];
      }
      if (!errorMessage) {
        errorMessage = 'No se pudo procesar la venta. Verifique la conexión o el estado de la caja.';
      }

      const isStockError = errorMessage.toLowerCase().includes('stock') || errorMessage.toLowerCase().includes('insuficiente');
      const title = isStockError ? 'Problema de Inventario' : 'Error en Pago';
      const alertType: 'warning' | 'danger' = isStockError ? 'warning' : 'danger';

      showAlert({
        title,
        message: errorMessage,
        type: alertType
      });
    } finally {
      setProcessingSale(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter(p => p.category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  return (
    <div className="pos-container">
      {/* Left Panel: Product Selection */}
      <div className="pos-products-panel">
        <div className="pos-search-wrapper">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            className="pos-search-input pl-10"
            placeholder="Buscar por nombre o escanear código... (Enter para agregar)"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && products.length > 0) {
                addToCart(products[0]);
                setSearchTerm('');
              }
            }}
          />
        </div>

        <div className="pos-categories scrollbar-hide">
          <button 
            className={`pos-category-btn ${!selectedCategoryId ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={`pos-category-btn ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="animate-spin mb-2" size={48} />
            <p>Cargando productos...</p>
          </div>
        ) : (
          <div className="pos-product-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="pos-product-card"
                onClick={() => addToCart(product)}
              >
                <div className="pos-product-name">{product.name}</div>
                <div className="pos-product-price">₡{Number(product.unit_price).toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-2">{product.sku}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Cart */}
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <span className="font-bold">Carrito ({cart.length})</span>
          </div>
          <button 
            className="text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => setCart([])}
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={64} className="mb-4 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="pos-cart-item">
                <div className="pos-item-info">
                  <div className="font-semibold text-sm truncate">{item.product_name}</div>
                  <div className="text-xs text-gray-500">₡{item.unit_price.toLocaleString()} c/u</div>
                </div>
                <div className="pos-item-qty-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}><Minus size={14} /></button>
                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}><Plus size={14} /></button>
                </div>
                <div className="font-bold text-sm min-w-[80px] text-right">
                  ₡{item.line_total.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="pos-summary-row">
            <span>Subtotal</span>
            <span>₡{totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="pos-summary-row">
            <span>Impuestos (IVA)</span>
            <span>₡{totals.tax.toLocaleString()}</span>
          </div>
          <div className="pos-total-row">
            <span className="pos-total-label">TOTAL</span>
            <span className="pos-total-value">₡{totals.total.toLocaleString()}</span>
          </div>

          <div className="pos-actions">
            <button className="pos-btn pos-btn-cancel" onClick={() => setCart([])}>
              <X size={20} />
              <span>Cancelar</span>
              <span className="pos-shortcut-hint">ESC</span>
            </button>
            <button 
              className={`pos-btn pos-btn-pay ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={cart.length === 0}
              onClick={() => {
                setAmountPaid(totals.total); // Default to exact amount
                setShowPaymentModal(true);
              }}
            >
              <Banknote size={24} />
              <span>COBRAR</span>
              <span className="pos-shortcut-hint">F1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Apertura de Caja */}
      {!cashSession && !loading && (
        <div className="pos-modal-overlay">
          <div className="pos-modal">
            <div className="text-center mb-6">
              <Store className="mx-auto text-indigo-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold">Apertura de Caja</h2>
              <p className="text-gray-500">Para comenzar a vender, primero debes abrir el turno de caja.</p>
            </div>

            <div className="payment-input-group">
              <label className="payment-label">Monto Inicial (Base):</label>
              <input
                type="text"
                className="payment-input"
                value={formatCurrency(openingBalance)}
                onChange={(e) => handleCurrencyInputChange(e, setOpeningBalance)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenSession();
                }}
              />
            </div>

            <button 
              className={`w-full p-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 ${isOpeningSession ? 'opacity-70' : ''}`}
              disabled={isOpeningSession}
              onClick={handleOpenSession}
            >
              {isOpeningSession ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              ABRIR TURNO DE CAJA
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal">
            {saleSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={80} />
                <h2 className="text-2xl font-bold">¡Venta Completada!</h2>
                <p className="opacity-70 mt-2">Imprimiendo ticket...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="pos-modal-title mb-0">Completar Venta</h2>
                  <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* COLUMNA IZQUIERDA (Datos del Pago) */}
                    <div className="flex flex-col gap-4">
                      {cart.some(item => {
                        const p = products.find(prod => prod.id === item.product_id);
                        return p && p.manages_inventory && item.quantity > p.stock_quantity;
                      }) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center gap-2 border border-amber-200/50">
                          <AlertCircle size={20} className="shrink-0" />
                          <span className="text-xs font-semibold text-left">
                            Esta venta generará inventario negativo en algunos productos.
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="payment-label block mb-2 text-sm font-semibold text-[var(--pos-text-secondary)]">Método de Pago:</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {paymentMethods.map(method => (
                            <button
                              key={method.id}
                              className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl border font-bold transition-all ${
                                selectedPaymentMethod === method.id 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-[var(--pos-surface-muted)] text-[var(--pos-text)] border-[var(--pos-border)] hover:border-indigo-400'
                              }`}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                            >
                              {method.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name.toLowerCase() !== 'efectivo' && (
                        <div className="payment-input-group !mb-0">
                          <label className="payment-label">Referencia (Opcional):</label>
                          <input
                            type="text"
                            className="payment-input text-lg"
                            placeholder="Ej. # de comprobante"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="payment-input-group !mb-0">
                        <label className="payment-label">Dinero Recibido:</label>
                        <input
                          type="text"
                          className="payment-input"
                          value={formatCurrency(amountPaid)}
                          onChange={(e) => handleCurrencyInputChange(e, setAmountPaid)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCheckout();
                          }}
                        />
                      </div>
                    </div>

                    {/* COLUMNA DERECHA (Cálculos y Denominaciones) */}
                    <div className="flex flex-col gap-4 h-full">
                      <div className="bg-[var(--pos-surface-muted)] p-4 rounded-xl flex justify-between items-center border border-[var(--pos-border)]">
                        <span className="opacity-70 font-medium">Total a Pagar:</span>
                        <span className="text-3xl font-extrabold">₡{totals.total.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[500, 1000, 2000, 5000, 10000, 20000].map(val => (
                          <button 
                            key={val}
                            className="p-3 border border-[var(--pos-border)] rounded-lg hover:bg-[var(--pos-surface-muted)] font-semibold transition-colors text-sm sm:text-base"
                            onClick={() => setAmountPaid(prev => (prev || 0) + val)}
                          >
                            +₡{val.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      <div className="change-display !mb-0 mt-auto">
                        <div className="change-label">Cambio (Vuelto):</div>
                        <div className="change-value">₡{change.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 shrink-0">
                  <button 
                    className="flex-1 p-4 rounded-xl bg-[var(--pos-surface-muted)] font-bold hover:opacity-80 transition-all border border-[var(--pos-border)]"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Regresar
                  </button>
                  <button 
                    className={`flex-1 p-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 flex items-center justify-center gap-2 ${processingSale ? 'opacity-70' : ''}`}
                    disabled={processingSale || amountPaid < totals.total}
                    onClick={handleCheckout}
                  >
                    {processingSale ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                    CONFIRMAR (ENTER)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosSalesDashboard;
