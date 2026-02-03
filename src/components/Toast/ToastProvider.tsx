import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode, ComponentType } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  loading: (title: string, message?: string) => string
  promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => Promise<T>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const icons: Record<ToastType, ComponentType<{ className?: string; size?: number }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
}

const colors: Record<ToastType, string> = {
  success: 'border-green-200/70 bg-green-50 text-green-800 dark:border-green-400/30 dark:bg-green-900/30 dark:text-green-50',
  error: 'border-red-200/70 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-900/30 dark:text-red-50',
  warning: 'border-yellow-200/70 bg-yellow-50 text-yellow-800 dark:border-yellow-400/30 dark:bg-yellow-900/30 dark:text-yellow-50',
  info: 'border-blue-200/70 bg-blue-50 text-blue-800 dark:border-blue-400/30 dark:bg-blue-900/30 dark:text-blue-50',
  loading: 'border-slate-200/70 bg-white/90 text-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  loading: 'text-slate-500 dark:text-slate-300',
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = generateId()
      const newToast: Toast = { ...toast, id }
      setToasts((prev) => [...prev, newToast])

      if (toast.type !== 'loading' && toast.duration !== 0) {
        const duration = toast.duration ?? 5000
        window.setTimeout(() => removeToast(id), duration)
      }

      return id
    },
    [removeToast]
  )

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)))
  }, [])

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast])
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message, duration: 8000 }), [addToast])
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast])
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast])
  const loading = useCallback((title: string, message?: string) => addToast({ type: 'loading', title, message, duration: 0 }), [addToast])

  const promise = useCallback(
    async <T,>(promiseToResolve: Promise<T>, msgs: { loading: string; success: string; error: string }): Promise<T> => {
      const id = loading(msgs.loading)

      try {
        const result = await promiseToResolve
        updateToast(id, { type: 'success', title: msgs.success })
        window.setTimeout(() => removeToast(id), 3000)
        return result
      } catch (err) {
        updateToast(id, { type: 'error', title: msgs.error })
        window.setTimeout(() => removeToast(id), 5000)
        throw err
      }
    },
    [loading, removeToast, updateToast]
  )

  const value = useMemo<ToastContextType>(
    () => ({
      toasts,
      addToast,
      removeToast,
      updateToast,
      success,
      error,
      warning,
      info,
      loading,
      promise,
    }),
    [addToast, error, info, loading, promise, removeToast, success, toasts, updateToast, warning]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:max-w-md">
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              role="status"
              aria-live="assertive"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl ring-1 ring-black/5 transition-all dark:ring-white/5',
                colors[toast.type]
              )}
            >
              <span className={cn('mt-0.5', iconColors[toast.type])}>
                <Icon className={cn('h-5 w-5', toast.type === 'loading' && 'animate-spin')} />
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.message && <p className="text-sm leading-snug opacity-80">{toast.message}</p>}
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => toast.action?.onClick?.()}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              {toast.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="mt-0.5 text-slate-400 transition hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
                  aria-label="Fechar notificação"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
