import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, GradientSpinner, PulseLoader } from './loading-spinner';
import { Progress, AnimatedProgress, CircularProgress } from './progress';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonChart, GradientSkeleton } from './skeleton';

// Full page loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  variant = 'green',
  children
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <GradientSpinner size="lg" variant={variant} className="mx-auto mb-4" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Button loading state
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  variant = 'green',
  className,
  onClick,
  disabled
}) => {
  const variantClasses = {
    green: 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700',
    blue: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    purple: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
    teal: 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700',
    indigo: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'px-4 py-2 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-center justify-center space-x-2">
        {isLoading && <LoadingSpinner size="sm" variant={variant} />}
        <span>{children}</span>
      </div>
    </button>
  );
};

// Card loading state
interface LoadingCardProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  isLoading,
  children,
  variant = 'green',
  className
}) => {
  if (isLoading) {
    return <SkeletonCard className={className} />;
  }

  return (
    <div className={cn('bg-white border rounded-lg shadow-lg', className)}>
      {children}
    </div>
  );
};

// Table loading state
interface LoadingTableProps {
  isLoading: boolean;
  children: React.ReactNode;
  rows?: number;
  columns?: number;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  isLoading,
  children,
  rows = 5,
  columns = 4,
  className
}) => {
  if (isLoading) {
    return <SkeletonTable rows={rows} columns={columns} className={className} />;
  }

  return <div className={className}>{children}</div>;
};

// Chart loading state
interface LoadingChartProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LoadingChart: React.FC<LoadingChartProps> = ({
  isLoading,
  children,
  className
}) => {
  if (isLoading) {
    return <SkeletonChart className={className} />;
  }

  return <div className={className}>{children}</div>;
};

// Form loading state
interface LoadingFormProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LoadingForm: React.FC<LoadingFormProps> = ({
  isLoading,
  children,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 animate-pulse" />
          <Skeleton className="h-10 w-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 animate-pulse" />
          <Skeleton className="h-10 w-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 animate-pulse" />
          <Skeleton className="h-20 w-full animate-pulse" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-20 animate-pulse" />
          <Skeleton className="h-10 w-16 animate-pulse" />
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// List loading state
interface LoadingListProps {
  isLoading: boolean;
  children: React.ReactNode;
  items?: number;
  className?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({
  isLoading,
  children,
  items = 5,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Progress loading with steps
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  variant = 'green',
  className
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <Progress value={currentStep} max={totalSteps} variant={variant} />
      <div className="space-y-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-2 text-sm',
                stepNumber < currentStep ? 'text-green-600' : 
                stepNumber === currentStep ? 'text-blue-600 font-medium' : 
                'text-gray-400'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  stepNumber < currentStep ? 'bg-green-500' :
                  stepNumber === currentStep ? 'bg-blue-500' :
                  'bg-gray-300'
                )}
              />
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Inline loading text
interface LoadingTextProps {
  isLoading: boolean;
  children: React.ReactNode;
  lines?: number;
  className?: string;
}

export const LoadingText: React.FC<LoadingTextProps> = ({
  isLoading,
  children,
  lines = 1,
  className
}) => {
  if (isLoading) {
    return <SkeletonText lines={lines} className={className} />;
  }

  return <div className={className}>{children}</div>;
};

// Export all loading components
export {
  LoadingSpinner,
  GradientSpinner,
  PulseLoader,
  Progress,
  AnimatedProgress,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  GradientSkeleton
};