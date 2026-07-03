import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Users,
  LogOut,
  Menu,
  Bell,
  Store,
  ChevronRight,
  TrendingUp,
  CreditCard,
  User,
  Settings,
  ChevronDown,
  Info
} from 'lucide-react';
import UserEditModal from '../users/UserEditModal';
import { useUI } from '../../context/UIContext';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm } = useUI();
  
  // Cerrar sidebar automáticamente al cambiar de ruta (especialmente en móviles)
  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Obtener usuario del localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [roles, setRoles] = useState([]);

  const handleLogout = () => {
    showConfirm({
      title: '¿Cerrar Sesión?',
      message: '¿Estás seguro de que deseas salir del sistema? Tendrás que ingresar tus credenciales nuevamente.',
      type: 'danger',
      confirmLabel: 'Cerrar Sesión',
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    });
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/users/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleOpenProfile = () => {
    fetchRoles();
    setIsProfileModalOpen(true);
  };

  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Panel Principal' },
    { 
      path: '/dashboard/sales', 
      icon: <ShoppingCart size={20} />, 
      label: 'Ventas y Cajas',
      subItems: [
        { path: '/dashboard/sales', label: 'Terminal de Caja' },
        { path: '/dashboard/sales-history', label: 'Historial de Ventas' },
      ]
    },
    { 
      path: '/dashboard/inventory', 
      icon: <PackageSearch size={20} />, 
      label: 'Inventario',
      subItems: [
        { path: '/dashboard/inventory', label: 'Productos' },
        { path: '/dashboard/inventory/categories', label: 'Categorías' },
      ]
    },
    { path: '/dashboard/customers', icon: <Users size={20} />, label: 'Clientes y Créditos' },
    { path: '/dashboard/purchases', icon: <TrendingUp size={20} />, label: 'Compras' },
    { path: '/dashboard/reports', icon: <CreditCard size={20} />, label: 'Tributación' },
    { path: '/dashboard/users', icon: <User size={20} />, label: 'Usuarios' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans relative">

      {/* Fondo Decorativo General */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Overlay Móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-30 h-full flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200 dark:border-white/5 shadow-2xl lg:shadow-none
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className={`h-20 flex items-center border-b border-slate-200 dark:border-white/5 transition-all duration-300 ${sidebarOpen ? 'justify-between px-6' : 'justify-center px-0'}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Store size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">Meybrasu POS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-3'}`}>
          {menuItems.map((item) => {
            const isParentActive = location.pathname.startsWith(item.path);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.path} className="space-y-1">
                <NavLink
                  to={item.path}
                  end={!hasSubItems}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 group relative
                    ${isActive || (hasSubItems && isParentActive)
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className={`${sidebarOpen ? '' : 'mx-auto'} shrink-0`}>
                    {item.icon}
                  </div>
                  <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden'}`}>
                    {item.label}
                  </span>

                  {hasSubItems && sidebarOpen && (
                    <ChevronDown size={14} className={`ml-auto transition-transform duration-300 ${isParentActive ? 'rotate-180' : ''}`} />
                  )}

                  {!sidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      {item.label}
                    </div>
                  )}
                </NavLink>

                {/* Sub-menu items */}
                {hasSubItems && sidebarOpen && isParentActive && (
                  <div className="ml-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        end
                        className={({ isActive }) => `
                          block px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${isActive 
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' 
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                          }
                        `}
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout removed - now in header dropdown */}
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden"
        onClick={() => {
          if (sidebarOpen) setSidebarOpen(false);
        }}
      >
        {/* Top Header */}
        <header className="h-20 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0">

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Meybrasu POS</span>
              <ChevronRight size={14} className="opacity-50 hidden sm:block" />
              <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Módulo'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#0B0F19]"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>
            
            <div className="relative">
              <div 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-3 cursor-pointer group p-1.5 pr-3 rounded-full transition-all border ${
                  isUserMenuOpen 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 border-transparent dark:hover:border-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 p-[2px] shrink-0">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 border-2 border-transparent flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-slate-400" />
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                    {user?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium leading-none capitalize flex items-center gap-1">
                    {user?.role || 'Vendedor'}
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </p>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[30]" onClick={() => setIsUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-[40] animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 sm:hidden">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role}</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleOpenProfile();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                    >
                      <Settings size={18} />
                      Ajustes de Usuario
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Profile Edit Modal */}
        <UserEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          roles={roles}
          isAdmin={user?.role?.toLowerCase() === 'administrador' || user?.role?.toLowerCase() === 'admin'}
          onSaveSuccess={() => {
            // El modal ya recarga la página si el usuario editado es el actual
          }}
        />

        {/* Page Content Rendered Here */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
