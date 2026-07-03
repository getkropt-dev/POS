import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../../../services/api';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Tags, 
  Printer, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function ExecutiveSalesReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  
  const [data, setData] = useState<any>({
    summary: { totalSales: 0, totalProfit: 0 },
    paymentMethods: [],
    categories: []
  });

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = `?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetchWithAuth(`/reports/executive-sales${query}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const { summary, paymentMethods, categories } = data;

  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20 min-h-full font-sans print:bg-white print:p-0">
      
      {/* Header and Filters (Not visible when printing) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reporte Ejecutivo de Ventas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Análisis financiero consolidado y desglose operativo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-transparent text-slate-700 dark:text-slate-200 text-sm outline-none w-[140px] focus:ring-2 focus:ring-indigo-500/50 rounded-xl transition-all"
            />
          </div>
          <span className="text-slate-300 dark:text-slate-600 font-medium">-</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-transparent text-slate-700 dark:text-slate-200 text-sm outline-none w-[140px] focus:ring-2 focus:ring-indigo-500/50 rounded-xl transition-all"
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <button 
            onClick={loadReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 transition-all disabled:opacity-70 font-medium text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Generar
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-all font-medium text-sm"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center gap-3 print:hidden">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Reporte Ejecutivo de Ventas</h1>
        <div className="flex justify-between mt-2 text-slate-600">
          <p><strong>Período Analizado:</strong> {new Date(startDate).toLocaleDateString('es-CR')} al {new Date(endDate).toLocaleDateString('es-CR')}</p>
          <p><strong>Fecha de Generación:</strong> {new Date().toLocaleString('es-CR')}</p>
        </div>
      </div>

      {loading && !summary.totalSales ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* General Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KPI: Total Sales */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none">
                <DollarSign size={100} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <DollarSign size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Venta Total del Período</h3>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₡{Number(summary.totalSales).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-1">
                  Monto bruto ingresado por ventas completadas.
                </p>
              </div>
            </div>

            {/* KPI: Total Profit */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 p-6 rounded-3xl border border-emerald-200/60 dark:border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 text-emerald-600 pointer-events-none">
                <TrendingUp size={100} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Ganancia Neta Obtenida</h3>
              </div>
              <div>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  ₡{Number(summary.totalProfit).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-500 mt-2 flex items-center gap-1">
                  Basado en la estructura de costos registrados.
                </p>
              </div>
            </div>
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Breakdown by Payment Method */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Composición por Método de Pago
                </h3>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No hay pagos registrados en el período.</div>
              ) : (
                <div className="space-y-5">
                  {paymentMethods.map((pm: any, idx: number) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{pm.name}</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            ₡{Number(pm.totalAmount).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {Number(pm.percentage).toFixed(1)}% del total
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-400"
                          style={{ width: `${Math.max(pm.percentage, 1)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Breakdown by Category */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="p-2 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Tags size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Rendimiento por Categoría
                </h3>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No hay ventas registradas en el período.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50">
                        <th className="pb-3 font-semibold">Categoría</th>
                        <th className="pb-3 font-semibold text-center">Ventas</th>
                        <th className="pb-3 font-semibold text-right">Total Vendido</th>
                        <th className="pb-3 font-semibold text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                      {categories.map((cat: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {cat.name}
                          </td>
                          <td className="py-4 text-sm text-center text-slate-500 dark:text-slate-400">
                            {Number(cat.quantity).toLocaleString()} unds.
                          </td>
                          <td className="py-4 text-sm text-right font-semibold text-slate-900 dark:text-white">
                            ₡{Number(cat.totalAmount).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 text-sm text-right">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                              {Number(cat.percentage).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}
