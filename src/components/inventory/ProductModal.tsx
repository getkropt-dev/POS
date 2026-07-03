import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2, DollarSign, Barcode, Tag, Info, TrendingUp } from 'lucide-react';
import type { Product } from '../../types/sales';
import { productService } from '../../services/productService';
import { fetchWithAuth } from '../../services/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSaveSuccess: () => void;
}

interface Category {
  id: number;
  name: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSaveSuccess }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: undefined,
    unit_price: 0,
    unit_cost: 0,
    tax_rate: 0,
    stock_quantity: 0,
    manages_inventory: true,
    min_stock: 0
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [margin, setMargin] = useState<number>(30);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (product) {
        setFormData({
          ...product,
          unit_price: Number(product.unit_price),
          unit_cost: Number(product.unit_cost),
          tax_rate: Number(product.tax_rate),
          stock_quantity: Number(product.stock_quantity),
          min_stock: Number(product.min_stock || 0)
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          barcode: '',
          description: '',
          category_id: undefined,
          unit_price: 0,
          unit_cost: 0,
          tax_rate: 13, // Default 13% IVA
          stock_quantity: 0,
          manages_inventory: true,
          min_stock: 5
        });
      }
      setError(null);
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    try {
      const data = await fetchWithAuth('/catalogs/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.type === 'number') {
      e.target.select();
    }
  };

  const calculateCurrentMargin = () => {
    const cost = Number(formData.unit_cost) || 0;
    const price = Number(formData.unit_price) || 0;
    if (price <= 0 || cost <= 0) return 0;
    
    // Profit / Price = Margin
    const marginPercent = ((price - cost) / price) * 100;
    return Math.round(marginPercent);
  };

  const currentMargin = calculateCurrentMargin();

  const handleSuggestPrice = async () => {
    if (!product?.id) return;
    try {
      setIsSuggesting(true);
      const res = await productService.suggestPrice(product.id, margin);
      if (res.success) {
        setFormData(prev => ({ ...prev, unit_price: res.suggested_selling_price }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al sugerir precio');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (product) {
        await productService.updateProduct(product.id, formData);
      } else {
        await productService.createProduct(formData);
      }
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {product ? <Tag className="text-indigo-500" /> : <Save className="text-indigo-500" />}
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-sm text-slate-500">
              {product ? `Editando: ${product.name}` : 'Completa los datos para el catálogo'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Informacion Basica */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> Información General
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Ej: Coca Cola 600ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU / Código</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Autogenerado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barras</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="744123..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>

            {/* Precios e Inventario */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={14} /> Precios e Inventario
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 whitespace-nowrap">Costo (Unitario)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₡</span>
                    <input
                      type="number"
                      name="unit_cost"
                      value={formData.unit_cost}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      required
                      step="any"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 whitespace-nowrap">Precio Venta</label>
                  {currentMargin > 0 && (
                    <span className="absolute -top-3.5 right-0 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-tighter">
                      {currentMargin}% Margen
                    </span>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₡</span>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      required
                      step="any"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sugerencia de Precio (Solo si existe el producto) */}
              {product && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Sugerir Precio (% Margen)</span>
                    <TrendingUp size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={margin} 
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-20 px-3 py-1 text-sm rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSuggestPrice}
                      disabled={isSuggesting}
                      className="flex-1 py-1 px-3 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : 'Sugerir'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Impuesto (IVA %)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    required
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="manages_inventory"
                      checked={formData.manages_inventory}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors">Maneja Inventario</span>
                  </label>
                </div>
              </div>

              {formData.manages_inventory && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Actual</label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      disabled={!!product} // El stock solo se pone al crear, luego se ajusta manualmente
                      step="any"
                      title={product ? "El stock se debe ajustar mediante movimientos de inventario" : ""}
                      className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${product ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Mínimo</label>
                    <input
                      type="number"
                      name="min_stock"
                      value={formData.min_stock}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      step="any"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 px-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {product ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
