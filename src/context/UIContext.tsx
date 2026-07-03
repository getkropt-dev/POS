import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type MessageType = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: MessageType;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface AlertConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: MessageType;
}

interface UIContextType {
  showConfirm: (config: Omit<ConfirmConfig, 'isOpen'>) => void;
  showAlert: (config: Omit<AlertConfig, 'isOpen'>) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirm, setConfirm] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const [alert, setAlert] = useState<AlertConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showConfirm = useCallback((config: Omit<ConfirmConfig, 'isOpen'>) => {
    setConfirm({ ...config, isOpen: true });
  }, []);

  const showAlert = useCallback((config: Omit<AlertConfig, 'isOpen'>) => {
    setAlert({ ...config, isOpen: true });
  }, []);

  const handleConfirm = () => {
    confirm.onConfirm();
    setConfirm(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirm = () => setConfirm(prev => ({ ...prev, isOpen: false }));
  const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));

  const getIcon = (type: MessageType) => {
    switch (type) {
      case 'success': return <CheckCircle size={32} className="text-emerald-500" />;
      case 'danger': return <XCircle size={32} className="text-rose-500" />;
      case 'warning': return <AlertTriangle size={32} className="text-amber-500" />;
      default: return <Info size={32} className="text-indigo-500" />;
    }
  };

  const getBgColor = (type: MessageType) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10';
      case 'danger': return 'bg-rose-50 dark:bg-rose-500/10';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10';
      default: return 'bg-indigo-50 dark:bg-indigo-500/10';
    }
  };

  const getBtnColor = (type: MessageType) => {
    switch (type) {
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      default: return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20';
    }
  };

  return (
    <UIContext.Provider value={{ showConfirm, showAlert }}>
      {children}

      {/* Modal de Confirmación */}
      {confirm.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={closeConfirm}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${getBgColor(confirm.type)}`}>
                {getIcon(confirm.type)}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirm.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirm.message}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              <button onClick={closeConfirm} className="flex-1 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm">
                {confirm.cancelLabel || 'Cancelar'}
              </button>
              <button onClick={handleConfirm} className={`flex-1 py-3 rounded-xl text-white transition-all font-bold text-sm shadow-lg ${getBtnColor(confirm.type)}`}>
                {confirm.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta/Mensaje */}
      {alert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={closeAlert}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform animate-in zoom-in duration-200">
            <div className="absolute top-4 right-4">
              <button onClick={closeAlert} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center pt-8">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${getBgColor(alert.type)}`}>
                {getIcon(alert.type)}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{alert.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{alert.message}</p>
              <button onClick={closeAlert} className={`w-full py-3 rounded-xl text-white transition-all font-bold text-sm shadow-lg ${getBtnColor(alert.type)}`}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};
