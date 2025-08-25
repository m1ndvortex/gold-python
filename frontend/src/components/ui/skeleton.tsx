import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'gradient';
  animation?: 'pulse' | 'wave' | 'shimmer';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'gradient',
  animation = 'shimmer'
}) => {
  const baseClasses = 'rounded-md';
  
  const variantClasses = {
    default: 'bg-gray-200',
    gradient: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    shimmer: 'animate-pulse bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]'
  };

  return (
    <div
      className={cn(
        baseClasses,
        animation === 'shimmer' ? animationClasses.shimmer : variantClasses[variant],
        animation !== 'shimmer' && animationClasses[animation],
        className
      )}
    />
  );
};

// Predefined skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4 animate-pulse',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 border rounded-lg shadow-lg bg-white', className)}>
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3 animate-pulse" />
      <SkeletonText lines={2} />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20 animate-pulse" />
        <Skeleton className="h-8 w-16 animate-pulse" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-6 flex-1 animate-pulse" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 border rounded-lg shadow-lg bg-white', className)}>
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/4" />
      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Gradient skeleton variants
export const GradientSkeleton: React.FC<{
  className?: string;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
}> = ({ className, variant = 'green' }) => {
  const gradientVariants = {
    green: 'from-green-100 via-green-50 to-green-100',
    blue: 'from-blue-100 via-blue-50 to-blue-100',
    purple: 'from-purple-100 via-purple-50 to-purple-100',
    teal: 'from-teal-100 via-teal-50 to-teal-100',
    indigo: 'from-indigo-100 via-indigo-50 to-indigo-100'
  };

  return (
    <div
      className={cn(
        'rounded-md bg-gradient-to-r animate-pulse bg-[length:200%_100%]',
        gradientVariants[variant],
        className
      )}
    />
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => (
  <GradientSkeleton className={cn('h-10 w-24', className)} />
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <GradientSkeleton
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  );
};