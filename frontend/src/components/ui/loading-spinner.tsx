import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const variantClasses = {
  green: 'border-green-200 border-t-green-600',
  blue: 'border-blue-200 border-t-blue-600',
  purple: 'border-purple-200 border-t-purple-600',
  teal: 'border-teal-200 border-t-teal-600',
  indigo: 'border-indigo-200 border-t-indigo-600'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'green',
  className
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
};

// Gradient-based loading spinner with enhanced styling
interface GradientSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

const gradientVariants = {
  green: 'from-green-500 to-teal-600',
  blue: 'from-blue-500 to-indigo-600',
  purple: 'from-purple-500 to-violet-600',
  teal: 'from-teal-500 to-blue-600',
  indigo: 'from-indigo-500 to-purple-600'
};

export const GradientSpinner: React.FC<GradientSpinnerProps> = ({
  size = 'md',
  variant = 'green',
  className
}) => {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-r opacity-20',
          gradientVariants[variant]
        )}
      />
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r bg-clip-border animate-spin',
          gradientVariants[variant]
        )}
        style={{
          background: `conic-gradient(from 0deg, transparent, transparent, transparent, var(--tw-gradient-stops))`
        }}
      />
    </div>
  );
};

// Pulsing gradient loader
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 'md',
  variant = 'green',
  className
}) => {
  const pulseSize = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-gradient-to-r animate-pulse',
            pulseSize[size],
            gradientVariants[variant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};