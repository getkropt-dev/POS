import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Search, Loader2, Shield, AlertTriangle, Info } from 'lucide-react';
import UserEditModal from '../components/users/UserEditModal';

interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role_id: number;
  role_name: string;
}

interface RoleData {
  id: number;
  name: string;
  description: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  // Custom Alert/Confirm State for Deletion
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info' | 'warning';
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
    showCancel: true
  });

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'danger' = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
      type,
      showCancel: false
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      type,
      showCancel: true
    });
  };

  const loggedUserStr = localStorage.getItem('user');
  const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;
  const isAdmin = loggedUser?.role?.toLowerCase() === 'administrador' || loggedUser?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    fetchUsers();
    if (isAdmin) {
      fetchRoles();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://backend-pos-2zmm.onrender.com/users?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filtrar para no mostrarse a sí mismo en la lista, ya que ahora se edita desde el header
        setUsers(data.filter((u: UserData) => u.id !== loggedUser.id));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://backend-pos-2zmm.onrender.com/users/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenModal = (user: UserData | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    
    showConfirm(
      '¿Desactivar Usuario?', 
      'El usuario ya no podrá acceder al sistema, pero sus registros históricos se mantendrán.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`https://backend-pos-2zmm.onrender.com/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            fetchUsers();
          } else {
            const errorData = await res.json();
            showAlert('Error', errorData.message || 'Error eliminando usuario', 'danger');
          }
        } catch (error) {
          console.error(error);
        }
      },
      'danger'
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="text-indigo-500" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin 
              ? 'Administra los accesos y roles del sistema.'
              : 'Gestiona tu perfil e información personal.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Search Bar (Admin Only) */}
      {isAdmin && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:max-w-md pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Buscar por nombre o usuario..."
          />
        </div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 flex flex-col relative overflow-hidden ${!user.is_active ? 'opacity-60' : ''}`}>
              {!user.is_active && (
                <div className="absolute top-4 right-4 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold px-2.5 py-1 rounded-md">
                  Inactivo
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{user.full_name}</h3>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Shield size={16} />
                  <span className="capitalize">{user.role_name}</span>
                </div>
                {user.email && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                )}
                {user.phone && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user.phone}</p>
                )}
              </div>
              
              <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-4">
                <button
                  onClick={() => handleOpenModal(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm"
                >
                  <Edit2 size={16} />
                  {isAdmin || loggedUser.id === user.id ? 'Editar' : 'Ver'}
                </button>
                
                {isAdmin && user.id !== loggedUser.id && user.is_active && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors"
                    title="Desactivar"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Reutilizable */}
      <UserEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        roles={roles}
        isAdmin={isAdmin}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Custom Confirm Dialog (solo para borrado en esta página) */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => confirmConfig.showCancel && setConfirmConfig(p => ({ ...p, isOpen: false }))}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' :
                confirmConfig.type === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10'
              }`}>
                {confirmConfig.type === 'danger' || confirmConfig.type === 'warning' ? <AlertTriangle size={32} /> : <Info size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmConfig.message}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              {confirmConfig.showCancel && (
                <button onClick={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} className="flex-1 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm">
                  Cancelar
                </button>
              )}
              <button onClick={confirmConfig.onConfirm} className={`flex-1 py-2.5 rounded-xl text-white transition-all font-semibold text-sm shadow-lg ${
                confirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                confirmConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}>
                {confirmConfig.showCancel ? 'Confirmar' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
