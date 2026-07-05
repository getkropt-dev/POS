import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../services/api';
import { RefreshCw, Search, Calendar, AlertCircle, FileText } from 'lucide-react';

export default function SalesProfitReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchWithAuth('/catalogs/categories');
        setCategories(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      if (startDate) {
        const startIso = new Date(`${startDate}T00:00:00`).toISOString();
        query += `?startDate=${startIso}`;
      }
      if (endDate) {
        const endIso = new Date(`${endDate}T23:59:59.999`).toISOString();
        query += `${query ? '&' : '?'}endDate=${endIso}`;
      }
      if (categoryId) query += `${query ? '&' : '?'}categoryId=${categoryId}`;
      
      const res = await fetchWithAuth(`/reports/sales-profits${query}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el reporte de ventas y utilidades.');
    } finally {
      setLoading(false);
      setHasGenerated(true);
    }
  };

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.invoice_number?.toLowerCase().includes(term) ||
      item.product_name?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term)
    );
  });

  // Totales
  const totalRevenue = filteredData.reduce((acc, item) => acc + Number(item.line_total || 0), 0);
  const totalCost = filteredData.reduce((acc, item) => acc + (Number(item.unit_cost || 0) * Number(item.quantity || 0)), 0);
  const totalProfit = filteredData.reduce((acc, item) => acc + Number(item.line_profit || 0), 0);

  // Agrupar por categoría para el Top
  const categoryStats = filteredData.reduce((acc: any, item) => {
    const cat = item.category_name || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = { name: cat, profit: 0, revenue: 0 };
    acc[cat].profit += Number(item.line_profit || 0);
    acc[cat].revenue += Number(item.line_total || 0);
    return acc;
  }, {});

  const topCategories = Object.values(categoryStats)
    .sort((a: any, b: any) => b.profit - a.profit)
    .slice(0, 4);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ventas y Utilidades</h2>
          <p className="text-sm text-slate-500">Desglose de ingresos, costos y ganancias por producto.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <span className="text-slate-400">-</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="pl-4 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Generar Reporte</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₡{totalRevenue.toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <p className="text-sm font-medium text-slate-500">Costo Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₡{totalCost.toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Utilidad Neta</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₡{totalProfit.toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
      </div>

      {/* Top Categorías */}
      {topCategories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Top Categorías por Utilidad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map((cat: any, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate" title={cat.name}>{cat.name}</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₡{cat.profit.toLocaleString('es-CR', {minimumFractionDigits:2})}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ingresos: ₡{cat.revenue.toLocaleString('es-CR', {minimumFractionDigits:2})}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por factura, producto o estado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredData.length} registros
          </span>
        </div>

        {error && (
          <div className="p-6">
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Factura</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3">Cant.</th>
                <th className="px-6 py-3">Costo Unit.</th>
                <th className="px-6 py-3">Precio Unit.</th>
                <th className="px-6 py-3">Subtotal</th>
                <th className="px-6 py-3">Impuestos</th>
                <th className="px-6 py-3">Total Venta</th>
                <th className="px-6 py-3">Utilidad</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading && filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-20" />
                    <p>{!hasGenerated ? "Seleccione los filtros y haga clic en Generar Reporte." : "No se encontraron registros de ventas."}</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3">{new Date(row.sale_date).toLocaleString('es-CR')}</td>
                    <td className="px-6 py-3 font-medium">{row.invoice_number}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{row.category_name || 'Sin Categoría'}</td>
                    <td className="px-6 py-3">{row.product_name || 'Producto Desconocido'}</td>
                    <td className="px-6 py-3">{Number(row.quantity).toLocaleString('es-CR')}</td>
                    <td className="px-6 py-3">₡{Number(row.unit_cost).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">₡{Number(row.unit_price).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">₡{Number(row.line_subtotal).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">₡{Number(row.line_tax).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3 font-medium">₡{Number(row.line_total).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3 font-medium text-emerald-600 dark:text-emerald-400">₡{Number(row.line_profit).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        row.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                        row.status === 'VOIDED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
