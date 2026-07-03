import React, { useState } from 'react';
import { DollarSign, Archive, LineChart, Receipt, CreditCard, BarChart3 } from 'lucide-react';
import SalesProfitReport from './views/SalesProfitReport';
import CashSessionsReport from './views/CashSessionsReport';
import InventoryMovementsReport from './views/InventoryMovementsReport';
import PurchasesTaxReport from './views/PurchasesTaxReport';
import CustomerCreditReport from './views/CustomerCreditReport';
import ExecutiveSalesReport from './views/ExecutiveSalesReport';

type ReportTab = 'executive-sales' | 'sales' | 'cash' | 'inventory' | 'purchases' | 'credit';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('executive-sales');

  const tabs = [
    { id: 'executive-sales', label: 'Reporte de Ventas', icon: <BarChart3 size={18} /> },
    { id: 'sales', label: 'Ventas y Utilidades', icon: <DollarSign size={18} /> },
    { id: 'cash', label: 'Control de Cajas', icon: <Archive size={18} /> },
    { id: 'inventory', label: 'Movimientos de Inventario', icon: <LineChart size={18} /> },
    { id: 'purchases', label: 'Compras y Facturación', icon: <Receipt size={18} /> },
    { id: 'credit', label: 'Historial Crediticio', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reportería y Analítica
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Explora los reportes consolidados para análisis de ventas, control de inventario y cierres.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-2 rounded-2xl border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[500px]">
        {activeTab === 'executive-sales' && <ExecutiveSalesReport />}
        {activeTab === 'sales' && <SalesProfitReport />}
        {activeTab === 'cash' && <CashSessionsReport />}
        {activeTab === 'inventory' && <InventoryMovementsReport />}
        {activeTab === 'purchases' && <PurchasesTaxReport />}
        {activeTab === 'credit' && <CustomerCreditReport />}
      </div>
    </div>
  );
}
