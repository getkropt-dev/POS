import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../services/api';
import { RefreshCw, Search, Calendar, AlertCircle, Receipt } from 'lucide-react';

export default function PurchasesTaxReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('');
  const [includeInDeclaration, setIncludeInDeclaration] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (period) params.append('period', period);
      if (includeInDeclaration !== '') params.append('includeInDeclaration', includeInDeclaration);
      
      const queryString = params.toString();
      if (queryString) query = `?${queryString}`;
      
      const res = await fetchWithAuth(`/reports/purchases-billing${query}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el reporte de compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, period, includeInDeclaration]);

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.invoice_number?.toLowerCase().includes(term) ||
      item.supplier_name?.toLowerCase().includes(term) ||
      item.assigned_tax_period?.toLowerCase().includes(term)
    );
  });

  const totalInvoices = filteredData.length;
  const deductibleInvoices = filteredData.filter(i => i.is_deductible).length;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compras y Facturación Fiscal</h2>
          <p className="text-sm text-slate-500">Listado de compras para declaraciones y control tributario.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
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
            <button 
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input 
              type="text" 
              placeholder="Periodo (ej. 2026-06)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <select
              value={includeInDeclaration}
              onChange={(e) => setIncludeInDeclaration(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">¿Declarado? (Todos)</option>
              <option value="true">Sí (Incluido)</option>
              <option value="false">No (Excluido)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <p className="text-sm font-medium text-slate-500">Facturas en Pantalla</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalInvoices}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Facturas Deducibles</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{deductibleInvoices}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por factura o proveedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
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
                <th className="px-6 py-3">Proveedor</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3 text-center">Deducible</th>
                <th className="px-6 py-3">Periodo</th>
                <th className="px-6 py-3 text-center">Declarada</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading && filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-20" />
                    <p>No se encontraron compras.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3">{new Date(row.purchase_date).toLocaleDateString('es-CR')}</td>
                    <td className="px-6 py-3 font-medium">{row.invoice_number}</td>
                    <td className="px-6 py-3">{row.supplier_name || '-'}</td>
                    <td className="px-6 py-3">{row.invoice_type}</td>
                    <td className="px-6 py-3 text-center">
                      {row.is_deductible ? 
                        <span className="text-emerald-500 font-bold">✓</span> : 
                        <span className="text-slate-300">-</span>
                      }
                    </td>
                    <td className="px-6 py-3 font-medium text-indigo-600 dark:text-indigo-400">{row.assigned_tax_period || '-'}</td>
                    <td className="px-6 py-3 text-center">
                      {row.include_in_declaration ? 
                        <span className="text-emerald-500 font-bold">✓</span> : 
                        <span className="text-slate-300">-</span>
                      }
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
