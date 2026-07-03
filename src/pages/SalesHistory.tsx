import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2, Calendar, Filter, ChevronRight } from 'lucide-react';
import { salesService } from '../services/salesService';
import type { Sale } from '../types/sales';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSales();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const data = await salesService.getSales({ search: searchTerm, status: statusFilter });
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Completada</span>;
      case 'VOIDED':
        return <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold">Anulada</span>;
      case 'PARTIAL_RETURN':
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">Devolución Parcial</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-indigo-500" />
            Historial de Ventas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulta y gestiona todas las ventas y devoluciones.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Buscar por número de factura..."
          />
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Filter size={20} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
          >
            <option value="">Todos los Estados</option>
            <option value="COMPLETED">Completada</option>
            <option value="PARTIAL_RETURN">Devolución Parcial</option>
            <option value="VOIDED">Anulada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-white/5">
                <th className="p-4 font-semibold">Factura</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Cajero</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/dashboard/sales/${sale.id}`)}
                  >
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {sale.invoice_number}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(sale.sale_date).toLocaleString('es-CR')}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {sale.customer_name || 'Cliente Genérico'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {sale.cashier_name}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                      ₡{Number(sale.total_final_amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="p-4 text-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <ChevronRight className="mx-auto" size={20} />
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
