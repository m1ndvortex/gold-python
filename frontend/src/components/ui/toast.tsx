import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  message?: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 1000); // Shorter duration for testing
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast } = useToast();

  const typeConfig = {
    success: {
      icon: CheckCircle,
      gradient: 'from-green-500 to-teal-600',
      bg: 'from-green-50 to-teal-50',
      border: 'border-green-200',
      text: 'text-green-800'
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-pink-600',
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-200',
      text: 'text-red-800'
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-600',
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    }
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'min-w-80 max-w-md p-4 rounded-lg shadow-lg border backdrop-blur-sm',
        'bg-gradient-to-r',
        config.bg,
        config.border,
        'animate-in slide-in-from-right-full duration-300'
      )}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center',
            config.gradient
          )}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className={cn('text-sm font-medium', config.text)}>
              {toast.title}
            </h4>
          )}
          <p className={cn('text-sm', config.text, toast.title ? 'mt-1' : '')}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className={cn(
            'flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition-colors',
            config.text
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Export the missing components that toaster.tsx expects
export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

export interface ToastActionElement {
  altText: string;
}

export const Toast: React.FC<ToastProps & { children: React.ReactNode }> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const ToastClose: React.FC = () => {
  return <button>×</button>;
};

export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h4>{children}</h4>;
};

export const ToastViewport: React.FC = () => {
  return <div />;
};

// Toast notification functions
export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    // This will be used with the hook
  },
  error: (message: string, title?: string, duration?: number) => {
    // This will be used with the hook
  },
  warning: (message: string, title?: string, duration?: number) => {
    // This will be used with the hook
  },
  info: (message: string, title?: string, duration?: number) => {
    // This will be used with the hook
  }
};