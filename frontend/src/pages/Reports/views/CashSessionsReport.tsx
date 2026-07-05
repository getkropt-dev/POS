import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../services/api';
import { RefreshCw, Search, Calendar, AlertCircle, Archive } from 'lucide-react';

export default function CashSessionsReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      
      const res = await fetchWithAuth(`/reports/cash-sessions${query}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el reporte de arqueos de caja.');
    } finally {
      setLoading(false);
      setHasGenerated(true);
    }
  };

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.user_name?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term)
    );
  });

  const totalDifference = filteredData.reduce((acc, item) => acc + Number(item.difference || 0), 0);
  const openSessionsCount = filteredData.filter(item => item.status === 'OPEN').length;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Control de Cajas (Arqueos)</h2>
          <p className="text-sm text-slate-500">Historial de aperturas, cierres y diferencias de caja.</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Generar Reporte</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <p className="text-sm font-medium text-slate-500">Diferencia Neta Global</p>
          <p className={`text-2xl font-bold ${totalDifference < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            ₡{totalDifference.toLocaleString('es-CR', {minimumFractionDigits:2})}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/20">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Cajas Abiertas Actualmente</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{openSessionsCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cajero o estado..." 
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
                <th className="px-6 py-3">Apertura</th>
                <th className="px-6 py-3">Cierre</th>
                <th className="px-6 py-3">Cajero</th>
                <th className="px-6 py-3">Monto Apertura</th>
                <th className="px-6 py-3">Monto Esperado</th>
                <th className="px-6 py-3">Monto Físico</th>
                <th className="px-6 py-3">Diferencia</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading && filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Archive size={32} className="mx-auto mb-2 opacity-20" />
                    <p>{!hasGenerated ? "Seleccione los filtros y haga clic en Generar Reporte." : "No se encontraron registros de arqueos."}</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3">{new Date(row.open_date).toLocaleString('es-CR')}</td>
                    <td className="px-6 py-3">{row.close_date ? new Date(row.close_date).toLocaleString('es-CR') : '-'}</td>
                    <td className="px-6 py-3 font-medium">{row.user_name}</td>
                    <td className="px-6 py-3">₡{Number(row.opening_balance).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">₡{Number(row.expected_balance || 0).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className="px-6 py-3">₡{Number(row.actual_balance || 0).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                    <td className={`px-6 py-3 font-bold ${Number(row.difference) < 0 ? 'text-rose-500' : Number(row.difference) > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      ₡{Number(row.difference || 0).toLocaleString('es-CR', {minimumFractionDigits:2})}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        row.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {row.status}
                      </span>
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
