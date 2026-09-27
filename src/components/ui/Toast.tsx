'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Icon } from '@/components/ui/Icon';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((previous) => [...previous, { id, tone, message }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <Icon
              name={toast.tone === 'error' ? 'warning' : toast.tone === 'success' ? 'check' : 'info'}
              size={17}
              style={{
                color:
                  toast.tone === 'error'
                    ? 'var(--negative)'
                    : toast.tone === 'success'
                      ? 'var(--positive)'
                      : 'var(--info)',
              }}
            />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
