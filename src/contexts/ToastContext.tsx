// ============================================
// TOAST NOTIFICATIONS CONTEXT
// Sistema de Gestão Urbana Parnamirim
// ============================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  loading: (title: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, toast: Partial<Omit<Toast, 'id'>>) => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  loading: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  loading: 'text-slate-500 animate-spin',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 5000): string => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (type !== 'loading' && duration > 0) {
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
      }
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const update = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (updates.type && updates.type !== 'loading') {
      setTimeout(() => dismiss(id), 3000);
    }
  }, [dismiss]);

  const promiseFn = useCallback(
    async <T,>(
      promise: Promise<T>,
      msgs: { loading: string; success: string; error: string }
    ): Promise<T> => {
      const id = addToast('loading', msgs.loading);
      try {
        const result = await promise;
        update(id, { type: 'success', title: msgs.success });
        return result;
      } catch (err) {
        update(id, { type: 'error', title: msgs.error });
        throw err;
      }
    },
    [addToast, update]
  );

  const value: ToastContextType = {
    toasts,
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message, 8000),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
    loading: (title) => addToast('loading', title, undefined, 0),
    dismiss,
    dismissAll,
    update,
    promise: promiseFn,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg',
                'animate-slide-in-right',
                styles[toast.type]
              )}
            >
              <Icon className={cn('flex-shrink-0 h-5 w-5', iconStyles[toast.type])} />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                )}
              </div>
              {toast.type !== 'loading' && (
                <button
                  onClick={() => dismiss(toast.id)}
                  className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
