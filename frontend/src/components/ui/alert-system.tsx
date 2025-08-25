import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'gradient';
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  variant = 'gradient'
}) => {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      gradient: 'from-green-500 to-teal-600',
      bg: variant === 'gradient' ? 'from-green-50 to-teal-50' : 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconBg: 'bg-gradient-to-r from-green-500 to-teal-600'
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-pink-600',
      bg: variant === 'gradient' ? 'from-red-50 to-pink-50' : 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconBg: 'bg-gradient-to-r from-red-500 to-pink-600'
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-600',
      bg: variant === 'gradient' ? 'from-yellow-50 to-orange-50' : 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconBg: 'bg-gradient-to-r from-yellow-500 to-orange-600'
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-indigo-600',
      bg: variant === 'gradient' ? 'from-blue-50 to-indigo-50' : 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconBg: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border shadow-lg',
        variant === 'gradient' ? `bg-gradient-to-r ${config.bg}` : config.bg,
        config.border,
        'animate-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            config.iconBg
          )}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-sm font-medium mb-1', config.text)}>
              {title}
            </h4>
          )}
          <p className={cn('text-sm', config.text)}>
            {message}
          </p>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition-colors',
              config.text
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Banner alert for top of page
interface BannerAlertProps extends Omit<AlertProps, 'className'> {
  className?: string;
}

export const BannerAlert: React.FC<BannerAlertProps> = (props) => {
  return (
    <Alert
      {...props}
      className={cn('rounded-none border-x-0 border-t-0', props.className)}
    />
  );
};

// Inline alert for forms
interface InlineAlertProps extends Omit<AlertProps, 'title' | 'dismissible'> {
  size?: 'sm' | 'md';
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  size = 'sm',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm'
  };

  return (
    <Alert
      {...props}
      className={cn(sizeClasses[size], className)}
    />
  );
};

// Status indicator with gradient
interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  variant = 'gradient',
  className
}) => {
  const statusConfig = {
    success: {
      gradient: 'from-green-500 to-teal-600',
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500'
    },
    error: {
      gradient: 'from-red-500 to-pink-600',
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-500'
    },
    warning: {
      gradient: 'from-yellow-500 to-orange-600',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500'
    },
    info: {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-500'
    },
    pending: {
      gradient: 'from-gray-500 to-slate-600',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-500'
    }
  };

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      dot: 'w-2 h-2'
    },
    md: {
      container: 'px-3 py-1 text-sm',
      dot: 'w-2.5 h-2.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      dot: 'w-3 h-3'
    }
  };

  const config = statusConfig[status];
  const sizeConfig = sizeClasses[size];

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 rounded-full font-medium',
        variant === 'gradient' ? `bg-gradient-to-r ${config.gradient} text-white` : `${config.bg} ${config.text}`,
        sizeConfig.container,
        className
      )}
    >
      <div
        className={cn(
          'rounded-full',
          sizeConfig.dot,
          variant === 'gradient' ? 'bg-white/30' : config.dot,
          status === 'pending' && 'animate-pulse'
        )}
      />
      <span>{label}</span>
    </div>
  );
};

// Progress alert with steps
interface ProgressAlertProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

export const ProgressAlert: React.FC<ProgressAlertProps> = ({
  title,
  currentStep,
  totalSteps,
  stepName,
  variant = 'green',
  className
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  const variantConfig = {
    green: {
      bg: 'from-green-50 to-teal-50',
      border: 'border-green-200',
      text: 'text-green-800',
      progress: 'from-green-500 to-teal-600'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      progress: 'from-blue-500 to-indigo-600'
    },
    purple: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      progress: 'from-purple-500 to-violet-600'
    },
    teal: {
      bg: 'from-teal-50 to-blue-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      progress: 'from-teal-500 to-blue-600'
    },
    indigo: {
      bg: 'from-indigo-50 to-purple-50',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      progress: 'from-indigo-500 to-purple-600'
    }
  };

  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border shadow-lg bg-gradient-to-r',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className={cn('text-sm font-medium', config.text)}>
            {title}
          </h4>
          <span className={cn('text-xs', config.text)}>
            {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className={cn('h-full bg-gradient-to-r transition-all duration-500', config.progress)}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className={cn('text-xs', config.text)}>
            {stepName}
          </p>
        </div>
      </div>
    </div>
  );
};

// Floating action feedback
interface ActionFeedbackProps {
  type: 'success' | 'error' | 'loading';
  message: string;
  isVisible: boolean;
  className?: string;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  type,
  message,
  isVisible,
  className
}) => {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      gradient: 'from-green-500 to-teal-600',
      text: 'text-white'
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-pink-600',
      text: 'text-white'
    },
    loading: {
      icon: null,
      gradient: 'from-blue-500 to-indigo-600',
      text: 'text-white'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 p-4 rounded-lg shadow-xl bg-gradient-to-r backdrop-blur-sm z-50',
        config.gradient,
        'animate-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        {type === 'loading' ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          Icon && <Icon className="w-5 h-5 text-white" />
        )}
        <span className={cn('text-sm font-medium', config.text)}>
          {message}
        </span>
      </div>
    </div>
  );
};