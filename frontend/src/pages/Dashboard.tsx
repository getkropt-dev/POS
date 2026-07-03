import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Package, ShoppingBag, Users, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<any[]>([]);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Hacemos las peticiones en paralelo
        const [salesRes, stockRes, abcRes] = await Promise.all([
          fetchWithAuth('/reports/dashboard/daily-sales').catch(() => []),
          fetchWithAuth('/reports/dashboard/low-stock').catch(() => []),
          fetchWithAuth('/reports/dashboard/abc-analysis').catch(() => [])
        ]);

        // Formatear fechas para el gráfico
        const formattedSales = Array.isArray(salesRes) ? salesRes.map(sale => ({
          ...sale,
          // Dependiendo de cómo devuelva la DB la fecha
          dateLabel: new Date(sale.sale_day || sale.sale_date).toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric' }),
          amount: Number(sale.total_amount || sale.total_collected || 0)
        })).reverse() : []; // Reverse para que empiece de más antiguo a más nuevo

        setDailySales(formattedSales);
        setLowStock(Array.isArray(stockRes) ? stockRes : []);
        setAbcAnalysis(Array.isArray(abcRes) ? abcRes : []);

      } catch (error) {
        console.error("Error al cargar datos del dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calcular totales para los KPIs
  const totalSalesToday = dailySales.length > 0 ? dailySales[dailySales.length - 1]?.amount || 0 : 0;
  const criticalStockCount = lowStock.length;

  const stats = [
    { title: 'Ventas del Último Día', value: `₡${totalSalesToday.toLocaleString('es-CR')}`, icon: <DollarSign size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Productos en Stock Crítico', value: criticalStockCount.toString(), icon: <Package size={24} />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'Productos Clasificación A', value: abcAnalysis.filter((i:any) => i.classification === 'A').length.toString() || '0', icon: <ShoppingBag size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Panel Principal
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Métricas obtenidas en tiempo real de tu base de datos.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Principal */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ingresos de los últimos días</h3>
              <p className="text-sm text-slate-500">Total recaudado por día</p>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-[300px]">
            {dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₡${val}`} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₡${value.toLocaleString('es-CR')}`, 'Ingresos']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <AlertCircle size={40} className="mb-2 opacity-20" />
                <p>No hay datos de ventas registrados todavía.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Crítico Panel */}
        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Stock Crítico</h3>
            <p className="text-sm text-slate-500">Productos por debajo del mínimo</p>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
            {lowStock.length > 0 ? (
              lowStock.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name || item.product_name}</p>
                    <p className="text-xs text-rose-500 font-medium">Quedan {item.current_stock || item.stock} (Mín: {item.minimum_stock || item.min_stock})</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <Package size={32} className="mb-2 opacity-20" />
                <p className="text-center text-sm">Tu inventario está en niveles saludables.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
