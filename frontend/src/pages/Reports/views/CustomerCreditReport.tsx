import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../services/api';
import { RefreshCw, Search, Calendar, AlertCircle, CreditCard } from 'lucide-react';

export default function CustomerCreditReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      if (startDate) query += `?startDate=${startDate}`;
      if (endDate) query += `${query ? '&' : '?'}endDate=${endDate}`;
      
      const res = await fetchWithAuth(`/reports/customer-credit${query}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el historial crediticio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.customer_name?.toLowerCase().includes(term) ||
      item.tax_id?.toLowerCase().includes(term) ||
      item.payment_method?.toLowerCase().includes(term)
    );
  });

  const totalPayments = filteredData.reduce((acc, item) => acc + Number(item.payment_amount || 0), 0);
  
  // Para obtener la deuda actual única por cliente, filtramos los IDs únicos
  const uniqueCustomers = Array.from(new Map(filteredData.map(item => [item.tax_id || item.customer_name, item])).values());
  const totalDebt = uniqueCustomers.reduce((acc, item) => acc + Number(item.current_balance || 0), 0);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historial Crediticio de Clientes</h2>
          <p className="text-sm text-slate-500">Reporte de abonos y saldos pendientes por cliente.</p>
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
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Abonos Realizados</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₡{totalPayments.toLocaleString('es-CR', {minimumFractionDigits:2})}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Deuda Global Vigente</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">₡{totalDebt.toLocaleString('es-CR', {minimumFractionDigits:2})}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente, cédula o método..." 
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
                <th className="px-6 py-3">Fecha Abono</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Identificación</th>
                <th className="px-6 py-3">Monto Abonado</th>
                <th className="px-6 py-3">Método Pago</th>
                <th className="px-6 py-3">Deuda Actual (Saldo)</th>
                <th className="px-6 py-3">Límite Crédito</th>
                <th className="px-6 py-3">Notas</th>
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
                    <CreditCard size={32} className="mx-auto mb-2 opacity-20" />
                    <p>No se encontraron abonos ni movimientos.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3">{new Date(row.payment_date).toLocaleString('es-CR')}</td>
                    <td className="px-6 py-3 font-medium">{row.customer_name}</td>
                    <td className="px-6 py-3 text-slate-500">{row.tax_id || '-'}</td>
                    <td className="px-6 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      + ₡{Number(row.payment_amount).toLocaleString('es-CR', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md text-xs font-medium">
                        {row.payment_method || 'N/A'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 font-medium ${Number(row.current_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      ₡{Number(row.current_balance || 0).toLocaleString('es-CR', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      ₡{Number(row.credit_limit || 0).toLocaleString('es-CR', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-6 py-3 max-w-[200px] truncate" title={row.notes}>{row.notes || '-'}</td>
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
