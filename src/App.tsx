import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Reports from './pages/Reports/index';

import PosSalesDashboard from './pages/PosSalesDashboard';
import SalesHistory from './pages/SalesHistory';
import SaleDetail from './pages/SaleDetail';
import { UIProvider } from './context/UIContext';

function App() {
  return (
    <UIProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas dentro del Layout */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="sales" element={<PosSalesDashboard />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="sales/:id" element={<SaleDetail />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/categories" element={<Categories />} />
          <Route path="customers" element={<div className="flex items-center justify-center h-full text-slate-400">Módulo de Clientes en construcción...</div>} />
          <Route path="purchases" element={<div className="flex items-center justify-center h-full text-slate-400">Módulo de Compras en construcción...</div>} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Router>
    </UIProvider>
  );
}

export default App;
