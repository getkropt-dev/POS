import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Calendar, User, DollarSign, 
  RotateCcw, AlertTriangle, CheckCircle, Info, Loader2, X, ShieldAlert,
  CreditCard
} from 'lucide-react';
import { salesService } from '../services/salesService';
import { useUI } from '../context/UIContext';
import type { Sale, PaymentMethod } from '../types/sales';

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useUI();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Modals state
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  // Void State
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Return State
  const [returnReason, setReturnReason] = useState('');
  const [refundMethodId, setRefundMethodId] = useState<number | ''>('');
  const [returnItems, setReturnItems] = useState<{ [key: number]: number }>({});

  const loggedUserStr = localStorage.getItem('user');
  const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;
  const isAdmin = loggedUser?.role?.toLowerCase() === 'administrador' || loggedUser?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (id) {
      fetchSaleDetail();
      fetchPaymentMethods();
    }
  }, [id]);

  const fetchSaleDetail = async () => {
    try {
      setIsLoading(true);
      const data = await salesService.getSaleById(Number(id));
      setSale(data);
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: error.message || 'Error al cargar la venta',
        type: 'danger'
      });
      navigate('/dashboard/sales-history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const methods = await salesService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error(error);
    }
  };

  const handleVoidSale = async () => {
    if (!voidReason.trim()) {
      showAlert({ title: 'Error', message: 'Debe especificar un motivo de anulación.', type: 'warning' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await salesService.voidSale(Number(id), voidReason);
      showAlert({ title: 'Éxito', message: 'Venta anulada correctamente', type: 'success' });
      setIsVoidModalOpen(false);
      fetchSaleDetail();
    } catch (error: any) {
      showAlert({ title: 'Error', message: error.message || 'Error al anular', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!returnReason.trim() || !refundMethodId) {
      showAlert({ title: 'Error', message: 'Motivo y método de reembolso son obligatorios.', type: 'warning' });
      return;
    }

    const itemsToReturn = Object.entries(returnItems)
      .map(([detailId, qty]) => ({
        sale_detail_id: Number(detailId),
        quantity: qty
      }))
      .filter(i => i.quantity > 0);

    if (itemsToReturn.length === 0) {
      showAlert({ title: 'Error', message: 'Debe especificar al menos un producto a devolver.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      await salesService.processReturn(Number(id), returnReason, Number(refundMethodId), itemsToReturn);
      showAlert({ title: 'Éxito', message: 'Devolución procesada correctamente', type: 'success' });
      setIsReturnModalOpen(false);
      setReturnItems({});
      fetchSaleDetail();
    } catch (error: any) {
      showAlert({ title: 'Error', message: error.message || 'Error al procesar devolución', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnQtyChange = (detailId: number, qty: number, max: number) => {
    const validQty = Math.max(0, Math.min(qty, max));
    setReturnItems(prev => ({
      ...prev,
      [detailId]: validQty
    }));
  };

  if (isLoading || !sale) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  const hasReturnableItems = sale.status !== 'VOIDED' && sale.details?.some(d => Number(d.quantity) - Number(d.quantity_returned) > 0);

  return (
    <div className="flex flex-col space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/dashboard/sales-history')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Factura {sale.invoice_number}
            {sale.status === 'COMPLETED' && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Completada</span>}
            {sale.status === 'VOIDED' && <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold">Anulada</span>}
            {sale.status === 'PARTIAL_RETURN' && <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">Devolución Parcial</span>}
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <Calendar size={14} /> {new Date(sale.sale_date).toLocaleString('es-CR')}
          </p>
        </div>
        
        <div className="ml-auto flex gap-3">
          {isAdmin && hasReturnableItems && (
            <button 
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-amber-500/20"
            >
              <RotateCcw size={18} />
              Nueva Devolución
            </button>
          )}
          {isAdmin && sale.status === 'COMPLETED' && (
            <button 
              onClick={() => setIsVoidModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-rose-600/20"
            >
              <ShieldAlert size={18} />
              Anular Venta
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm col-span-1 h-fit">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Detalles de la Operación
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><User size={16} /> Cliente</p>
              <p className="font-medium text-slate-900 dark:text-white">{sale.customer_name || 'Cliente Genérico (De Contado)'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><User size={16} /> Cajero</p>
              <p className="font-medium text-slate-900 dark:text-white">{sale.cashier_name}</p>
            </div>
            {sale.status === 'VOIDED' && (
              <div className="bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-100 dark:border-rose-500/20 mt-4">
                <p className="text-sm text-rose-500 font-bold mb-1">Anulada por: {sale.voided_by_name}</p>
                <p className="text-sm text-rose-600 dark:text-rose-400">{sale.void_reason}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>₡{Number(sale.total_net_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Impuestos</span>
              <span>₡{Number(sale.total_tax_sum).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>TOTAL</span>
              <span>₡{Number(sale.total_final_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Productos Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
              <FileText className="text-indigo-500" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Productos Vendidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-white/5 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="p-3 font-semibold">Producto</th>
                    <th className="p-3 font-semibold text-center">Cant. Original</th>
                    <th className="p-3 font-semibold text-center">Devuelto</th>
                    <th className="p-3 font-semibold text-center">Disponible</th>
                    <th className="p-3 font-semibold text-right">Precio Unit.</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {sale.details?.map(d => {
                    const available = Number(d.quantity) - Number(d.quantity_returned);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-sm font-medium text-slate-900 dark:text-white">{d.product_name}</td>
                        <td className="p-3 text-sm text-center">{Number(d.quantity)}</td>
                        <td className="p-3 text-sm text-center text-rose-500">{Number(d.quantity_returned) > 0 ? Number(d.quantity_returned) : '-'}</td>
                        <td className="p-3 text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">{available}</td>
                        <td className="p-3 text-sm text-right">₡{Number(d.unit_price).toLocaleString()}</td>
                        <td className="p-3 text-sm font-bold text-right text-slate-900 dark:text-white">₡{Number(d.line_total).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Movimientos Financieros */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white">Movimientos de Caja</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-xs border-b border-slate-100 dark:border-white/5 uppercase bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="p-3 font-semibold">Fecha</th>
                    <th className="p-3 font-semibold">Método</th>
                    <th className="p-3 font-semibold">Referencia</th>
                    <th className="p-3 font-semibold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {sale.payments?.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{new Date(p.paid_at).toLocaleString('es-CR')}</td>
                      <td className="p-3 text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400"/>
                        {p.payment_method_name}
                      </td>
                      <td className="p-3 text-sm text-slate-500">{p.reference_code || '-'}</td>
                      <td className={`p-3 text-sm font-bold text-right ${Number(p.amount) < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {Number(p.amount) < 0 ? '' : '+'}₡{Number(p.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial de Devoluciones */}
          {sale.returns && sale.returns.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                <RotateCcw className="text-amber-500" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">Historial de Devoluciones</h3>
              </div>
              <div className="p-4 space-y-4">
                {sale.returns.map(ret => (
                  <div key={ret.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex justify-between items-start mb-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Devolución #{ret.id}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(ret.return_date).toLocaleString('es-CR')} • Por: {ret.created_by_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-rose-500">Reembolso: ₡{Number(ret.total_refund).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Método: {ret.refund_method_name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3"><span className="font-semibold">Motivo:</span> {ret.reason}</p>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <tr>
                            <th className="p-2">Producto</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-right">Reembolso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {ret.details?.map(rd => (
                            <tr key={rd.id}>
                              <td className="p-2 font-medium">{rd.product_name}</td>
                              <td className="p-2 text-center text-rose-500 font-bold">{Number(rd.quantity_returned)}</td>
                              <td className="p-2 text-right">₡{Number(rd.line_refund).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal: Anular Venta */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsVoidModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Anular Venta Completa</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Esta acción revertirá el inventario de todos los productos y registrará movimientos negativos en caja. Es irreversible.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo de Anulación</label>
                  <textarea 
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    rows={3}
                    placeholder="Especifique la razón..."
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              <button 
                onClick={() => setIsVoidModalOpen(false)} 
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleVoidSale} 
                disabled={isSubmitting || !voidReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Devolución Parcial */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsReturnModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="text-amber-500" /> Nueva Devolución Parcial
                </h3>
                <p className="text-sm text-slate-500 mt-1">Seleccione los productos a devolver y el método de reembolso.</p>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Disponible</th>
                      <th className="p-3 text-right">Precio</th>
                      <th className="p-3 text-center">Cant. a Devolver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sale.details?.filter(d => Number(d.quantity) - Number(d.quantity_returned) > 0).map(d => {
                      const max = Number(d.quantity) - Number(d.quantity_returned);
                      const currentVal = returnItems[d.id] || 0;
                      return (
                        <tr key={d.id}>
                          <td className="p-3 font-medium text-slate-900 dark:text-white text-sm">{d.product_name}</td>
                          <td className="p-3 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">{max}</td>
                          <td className="p-3 text-right text-sm">₡{Number(d.unit_price).toLocaleString()}</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              min="0" 
                              max={max}
                              value={currentVal}
                              onChange={(e) => handleReturnQtyChange(d.id, parseInt(e.target.value) || 0, max)}
                              className="w-20 mx-auto block p-2 border border-slate-300 dark:border-slate-600 rounded text-center bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Método de Reembolso</label>
                  <select 
                    value={refundMethodId}
                    onChange={(e) => setRefundMethodId(Number(e.target.value))}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Seleccione un método...</option>
                    {paymentMethods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
                  <input 
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Ej. Producto dañado, cambio de talla..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                Total a Reembolsar: <span className="text-amber-500">
                  ₡{Object.entries(returnItems).reduce((sum, [id, qty]) => {
                    const d = sale.details?.find(x => x.id === Number(id));
                    return sum + (d ? Number(d.unit_price) * qty : 0);
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsReturnModalOpen(false)} 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleProcessReturn} 
                  disabled={isSubmitting || !returnReason.trim() || !refundMethodId || Object.values(returnItems).reduce((a, b) => a + b, 0) === 0}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Procesar Reembolso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
