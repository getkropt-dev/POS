import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Info, Loader2, User as UserIcon } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role_id: number;
  role_name?: string;
}

interface RoleData {
  id: number;
  name: string;
  description: string;
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  roles: RoleData[];
  isAdmin: boolean;
  onSaveSuccess: () => void;
}

export default function UserEditModal({ isOpen, onClose, user, roles, isAdmin, onSaveSuccess }: UserEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    admin_password: '',
    email: '',
    phone: '',
    role_id: 2,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  const [tempAdminPassword, setTempAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Custom Alert/Confirm State
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

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username,
          full_name: user.full_name,
          password: '',
          admin_password: '',
          email: user.email || '',
          phone: user.phone || '',
          role_id: user.role_id,
        });
        setConfirmPassword('');
        setShowPasswordChange(false);
        setIsPasswordModalOpen(false);
        setIsAuthModalOpen(false);
      } else {
        setFormData({
          username: '',
          full_name: '',
          password: '',
          admin_password: '',
          email: '',
          phone: '',
          role_id: roles.length > 0 ? roles[1]?.id || roles[0]?.id : 2,
        });
        setConfirmPassword('');
        setShowPasswordChange(true);
      }
    }
  }, [isOpen, user, roles]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (showPasswordChange && !user) {
      if (formData.password !== confirmPassword) {
        showAlert('Error de Validación', 'Las contraseñas no coinciden.', 'warning');
        setIsSaving(false);
        return;
      }
      if (!formData.password) {
        showAlert('Campo Obligatorio', 'La contraseña es obligatoria para nuevos usuarios.', 'warning');
        setIsSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const url = user 
        ? `https://backend-pos-2zmm.onrender.com/users/${user.id}`
        : `https://backend-pos-2zmm.onrender.com/users`;
      
      const method = user ? 'PUT' : 'POST';
      
      const payload: any = { ...formData };
      if (user && (!payload.password)) {
        delete payload.password;
        delete payload.admin_password;
      }
      
      if (!isAdmin && user) {
        delete payload.role_id;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error guardando usuario');
      }

      const loggedUserStr = localStorage.getItem('user');
      const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;

      if (user && loggedUser && user.id === loggedUser.id) {
        const updatedUser = { ...loggedUser, full_name: payload.full_name, username: payload.username };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      } else {
        onSaveSuccess();
        onClose();
      }
    } catch (error: any) {
      showAlert('Error', error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSaving && onClose()}></div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 shrink-0 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            {user && !isAdmin && <span className="bg-indigo-500/10 text-indigo-500 text-xs font-bold px-3 py-1 rounded-full">Mi Perfil</span>}
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="user-form" onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usuario</label>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                {user ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seguridad</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPassword('');
                        setTempConfirmPassword('');
                        setIsPasswordModalOpen(true);
                      }}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all font-medium flex items-center justify-center gap-2 group"
                    >
                      <Shield size={18} className="group-hover:scale-110 transition-transform" />
                      {formData.password ? 'Contraseña Preparada' : 'Cambiar Contraseña'}
                      {formData.password && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </button>
                    {formData.password && (
                      <p className="text-[10px] text-emerald-500 text-center font-medium">La contraseña será actualizada al guardar los cambios del usuario.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required={!user}
                          placeholder="Contraseña"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required={!user}
                          placeholder="Confirmar"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                  <select
                    value={formData.role_id}
                    onChange={e => setFormData({...formData, role_id: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none capitalize"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </div>
          
          <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium">
              Cancelar
            </button>
            <button form="user-form" type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium disabled:opacity-70">
              {isSaving && <Loader2 size={18} className="animate-spin" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsPasswordModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transform animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="text-indigo-500" size={20} />
                  Actualizar Contraseña
                </h3>
                <p className="text-xs text-slate-500 mt-1">Estás cambiando la clave de <b>{user?.full_name}</b></p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={tempPassword}
                      onChange={e => setTempPassword(e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all ${
                        tempPassword && tempConfirmPassword 
                          ? (tempPassword === tempConfirmPassword ? 'border-emerald-500 focus:ring-emerald-500/20' : 'border-rose-500 focus:ring-rose-500/20')
                          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={tempConfirmPassword}
                      onChange={e => setTempConfirmPassword(e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all ${
                        tempPassword && tempConfirmPassword 
                          ? (tempPassword === tempConfirmPassword ? 'border-emerald-500 focus:ring-emerald-500/20' : 'border-rose-500 focus:ring-rose-500/20')
                          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              {tempPassword && tempConfirmPassword && (
                <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${tempPassword === tempConfirmPassword ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {tempPassword === tempConfirmPassword ? <><CheckCircle2 size={14} /> ¡Excelente!</> : <><XCircle size={14} /> No coinciden</>}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold">Cancelar</button>
              <button
                type="button"
                disabled={!tempPassword || tempPassword !== tempConfirmPassword}
                onClick={() => {
                  setTempAdminPassword('');
                  setShowAdminPassword(false);
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white py-3 rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/20"
              >
                Actualizar Clave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsAuthModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transform animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 text-center">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield size={28} /></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Autorización</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Ingresa <b>tu contraseña</b> para autorizar.</p>
            </div>
            <div className="p-6">
              <div className="relative">
                <input
                  autoFocus
                  type={showAdminPassword ? "text" : "password"}
                  placeholder="Tu contraseña actual"
                  value={tempAdminPassword}
                  onChange={e => setTempAdminPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              <button type="button" onClick={() => setIsAuthModalOpen(false)} className="flex-1 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm">Cancelar</button>
              <button
                type="button"
                disabled={!tempAdminPassword}
                onClick={() => {
                  showConfirm(
                    '¿Confirmar?',
                    '¿Estás seguro de autorizar?',
                    () => {
                      setFormData({...formData, password: tempPassword, admin_password: tempAdminPassword});
                      setIsAuthModalOpen(false);
                      setIsPasswordModalOpen(false);
                    },
                    'warning'
                  );
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white py-3 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-indigo-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => confirmConfig.showCancel && setConfirmConfig(p => ({ ...p, isOpen: false }))}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : confirmConfig.type === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10'}`}>
                {confirmConfig.type === 'danger' || confirmConfig.type === 'warning' ? <AlertTriangle size={32} /> : <Info size={32} />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmConfig.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmConfig.message}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              {confirmConfig.showCancel && <button onClick={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} className="flex-1 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm">Cancelar</button>}
              <button onClick={confirmConfig.onConfirm} className={`flex-1 py-2.5 rounded-xl text-white transition-all font-semibold text-sm shadow-lg ${confirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : confirmConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}>
                {confirmConfig.showCancel ? 'Confirmar' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
