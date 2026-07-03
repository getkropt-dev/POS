import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Package, 
  Edit2, 
  History, 
  AlertTriangle, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronRight,
  LayoutGrid,
  Trash2,
  List as ListIcon
} from 'lucide-react';
import { productService } from '../services/productService';
import type { Product } from '../types/sales';
import ProductModal from '../components/inventory/ProductModal';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import KardexModal from '../components/inventory/KardexModal';
import { useUI } from '../context/UIContext';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { showConfirm, showAlert } = useUI();
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (term: string = '') => {
    try {
      setIsLoading(true);
      const data = await productService.getProducts(term);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    showConfirm({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          setIsDeleting(product.id);
          await productService.deleteProduct(product.id);
          setProducts(prev => prev.filter(p => p.id !== product.id));
          showAlert({
            title: 'Producto Eliminado',
            message: 'El producto ha sido borrado correctamente del sistema.',
            type: 'success'
          });
        } catch (error: any) {
          showAlert({
            title: 'Error al Eliminar',
            message: 'No se pudo eliminar el producto. Es posible que tenga registros asociados como ventas o movimientos de inventario.',
            type: 'danger'
          });
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(search);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product);
    setIsKardexModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsProductModalOpen(false);
    fetchProducts(search);
  };

  const handleAdjustmentSuccess = (productId: number, newStock: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock_quantity: newStock } : p
    ));
  };

  const formatCurrency = (val: number) => {
    return `₡${Number(val).toLocaleString('es-CR')}`;
  };

  const getStockStatus = (stock: number, minStock: number = 0) => {
    if (stock <= 0) return { label: 'Sin Stock', color: 'text-rose-500 bg-rose-500/10' };
    if (stock <= minStock) return { label: 'Stock Bajo', color: 'text-amber-500 bg-amber-500/10' };
    return { label: 'En Stock', color: 'text-emerald-500 bg-emerald-500/10' };
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="text-indigo-500" />
            Control de Inventario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona tu catálogo de productos y niveles de existencias.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleAddProduct}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
            placeholder="Buscar por nombre, SKU o código de barras..."
          />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Cargando inventario...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Package size={64} className="text-slate-200 dark:text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron productos</h3>
          <p className="text-slate-500">Intenta con otra búsqueda o crea un producto nuevo.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
            const status = getStockStatus(Number(product.stock_quantity), product.min_stock);
            return (
              <div key={product.id} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${status.color}`}>
                      {status.label}
                    </div>
                    <div className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {product.sku}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[40px]">
                    {product.description || 'Sin descripción disponible.'}
                  </p>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Precio Venta</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(product.unit_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Existencias</p>
                      <p className={`text-xl font-black ${Number(product.stock_quantity) <= (product.min_stock || 0) ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {Number(product.stock_quantity)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    disabled={isDeleting === product.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all border border-slate-200 dark:border-white/5 disabled:opacity-50"
                    title="Eliminar Producto"
                  >
                    {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                  <button
                    onClick={() => handleViewHistory(product)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-500 transition-all border border-slate-200 dark:border-white/5"
                    title="Ver Historial"
                  >
                    <History size={16} />
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-white/5"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleAdjustStock(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Plus size={14} />
                    Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {products.map(product => {
                  const status = getStockStatus(Number(product.stock_quantity), product.min_stock);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{product.name}</span>
                          <span className="text-xs text-slate-500">{product.barcode || 'Sin barras'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-lg ${Number(product.stock_quantity) <= (product.min_stock || 0) ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                            {Number(product.stock_quantity)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(product.unit_cost)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(product.unit_price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAdjustStock(product)}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                            title="Ajustar Stock"
                          >
                            <History size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isDeleting === product.id}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-50"
                            title="Eliminar"
                          >
                            {isDeleting === product.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSaveSuccess={handleSaveSuccess}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        product={selectedProduct}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />

      <KardexModal
        isOpen={isKardexModalOpen}
        onClose={() => setIsKardexModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
