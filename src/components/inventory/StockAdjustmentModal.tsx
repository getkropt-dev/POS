import React, { useState } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, AlertCircle, Loader2, CheckCircle, Hash } from 'lucide-react';
import type { Product } from '../../types/sales';
import { inventoryService } from '../../services/inventoryService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjustmentSuccess: (productId: number, newStock: number) => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, product, onAdjustmentSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const transactionId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const res = await inventoryService.adjustStock({
        productId: product.id,
        adjustmentType,
        quantity,
        reason: reason || `Ajuste manual ${adjustmentType === 'IN' ? 'Entrada' : 'Salida'}`,
        transactionId
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onAdjustmentSuccess(product.id, res.stockAfter);
          setSuccess(false);
          setQuantity(0);
          setReason('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el ajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-200">
        
        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Ajuste Aplicado!</h2>
            <p className="text-slate-500">El stock ha sido actualizado correctamente.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash className="text-blue-500" />
                  Ajuste de Stock
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 font-medium">Producto: {product.name}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
                  Stock Actual: {Number(product.stock_quantity)}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Adjustment Type Selector */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('IN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    adjustmentType === 'IN' 
                    ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowUpCircle size={20} />
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('OUT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    adjustmentType === 'OUT' 
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowDownCircle size={20} />
                  Salida (-)
                </button>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cantidad a Ajustar</label>
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  min="1"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-2xl font-bold text-center"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motivo / Notas</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Inventario inicial, daño, devolución proveedor..."
                  rows={2}
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || quantity <= 0}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  adjustmentType === 'IN' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                } ${isSubmitting ? 'opacity-70' : ''}`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <SaveIcon />}
                Procesar Ajuste
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

export default StockAdjustmentModal;
