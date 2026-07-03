import React, { useState, useEffect } from 'react';
import { X, History, Loader2, ArrowUpRight, ArrowDownRight, User, Calendar, Tag } from 'lucide-react';
import type { Product } from '../../types/sales';
import { inventoryService } from '../../services/inventoryService';

interface KardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const KardexModal: React.FC<KardexModalProps> = ({ isOpen, onClose, product }) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadMovements();
    }
  }, [isOpen, product]);

  const loadMovements = async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      const data = await inventoryService.getMovements(product.id);
      setMovements(data);
    } catch (err) {
      console.error('Error loading movements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const getMovementIcon = (type: string) => {
    if (type.includes('IN') || type === 'PURCHASE' || type === 'RETURN') {
      return <ArrowUpRight className="text-emerald-500" size={18} />;
    }
    return <ArrowDownRight className="text-rose-500" size={18} />;
  };

  const formatMovementType = (type: string) => {
    const types: Record<string, string> = {
      'ADJUSTMENT_IN': 'Ajuste Entrada',
      'ADJUSTMENT_OUT': 'Ajuste Salida',
      'SALE': 'Venta',
      'SALE_VOID': 'Anulación Venta',
      'PURCHASE': 'Compra',
      'RETURN': 'Devolución'
    };
    return types[type] || type;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-500/5 to-indigo-500/5">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="text-indigo-500" />
              Historial de Movimientos (Kardex)
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium">Producto: {product.name} ({product.sku})</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500 mb-2" />
              <p className="text-sm text-slate-500">Cargando movimientos...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-20 text-center">
              <History size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-slate-500">No hay movimientos registrados para este producto.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {movements.map((move) => (
                <div key={move.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                        {getMovementIcon(move.movement_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{formatMovementType(move.movement_type)}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            move.quantity > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Tag size={12} /> {move.notes || 'Sin notas'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            <Calendar size={12} /> {new Date(move.created_at).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            <User size={12} /> {move.created_by_name || 'Sistema'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Stock Final</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{move.stock_after}</div>
                      <div className="text-[10px] text-slate-500">Anterior: {move.stock_before}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default KardexModal;
