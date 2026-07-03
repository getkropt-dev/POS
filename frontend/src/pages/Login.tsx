import React, { useState } from 'react';
import { Store, User, Lock, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://backend-pos-2zmm.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans">

      {/* Sección Izquierda - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 lg:p-24 relative z-10">

        {/* Blob de fondo decorativo para modo claro */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 dark:hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-3xl mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/50 blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/40 dark:border-white/5 relative">

          {/* Logo animado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-6 relative group cursor-default">
              <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <Store size={32} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Meybrasu - Punto de Venta
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              {/* Campo Usuario */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <User size={18} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm shadow-sm"
                    placeholder="admin123"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Manejo de Errores */}
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 p-3 rounded-xl flex items-center gap-3 border border-rose-100 dark:border-rose-500/20 animate-in fade-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                {error}
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-2xl text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-white/70" size={20} />
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar al Panel
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-70 group-hover:opacity-100" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sección Derecha - Decorativa (Glassmorphism + Neon) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        {/* Fondo animado abstracto (Esferas de luz) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 blur-[100px] opacity-40 mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 blur-[120px] opacity-30 mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
        </div>

        {/* Tarjeta de Cristal (Features) */}
        <div className="relative z-10 w-full max-w-lg p-10 bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-start text-white">
          <div className="mb-8 p-4 bg-white/5 rounded-2xl inline-block border border-white/10 shadow-inner">
            <BarChart3 size={40} strokeWidth={1.5} className="text-emerald-400" />
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-[1.1] tracking-tight">
            Inteligencia para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              tu Punto de Venta.
            </span>
          </h2>

          <p className="text-lg text-slate-400 mb-10 font-light leading-relaxed">
            Gestión de inventario en tiempo real, facturación electrónica y reportes del régimen simplificado en un solo lugar.
          </p>

          {/* Avatar Stack Deco */}
          <div className="flex items-center gap-4 w-full pt-8 border-t border-white/10">
            <div className="flex -space-x-3">
              {[
                "bg-indigo-500",
                "bg-emerald-500",
                "bg-purple-500"
              ].map((color, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-md ${color}`}>
                  <User size={16} className="text-white/80" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Kropt Company</p>
              <p className="text-xs text-slate-400">Puntarenas, Costa Rica 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
