import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

const gradientVariants = {
  green: 'from-green-500 to-teal-600',
  blue: 'from-blue-500 to-indigo-600',
  purple: 'from-purple-500 to-violet-600',
  teal: 'from-teal-500 to-blue-600',
  indigo: 'from-indigo-500 to-purple-600'
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'green',
  size = 'md',
  showLabel = false,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full bg-gradient-to-r transition-all duration-300 ease-out',
            gradientVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Animated progress bar with gradient
interface AnimatedProgressProps extends ProgressProps {
  animated?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  animated = true,
  ...props
}) => {
  return (
    <div className={cn('w-full', props.className)}>
      {props.showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round((props.value / (props.max || 100)) * 100)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[props.size || 'md'])}>
        <div
          className={cn(
            'h-full bg-gradient-to-r transition-all duration-500 ease-out',
            gradientVariants[props.variant || 'green'],
            animated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(Math.max((props.value / (props.max || 100)) * 100, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

// Circular progress indicator
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  variant?: 'green' | 'blue' | 'purple' | 'teal' | 'indigo';
  showLabel?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 80,
  variant = 'green',
  showLabel = false,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const gradientId = `gradient-${variant}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {variant === 'green' && (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0d9488" />
              </>
            )}
            {variant === 'blue' && (
              <>
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#4f46e5" />
              </>
            )}
            {variant === 'purple' && (
              <>
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </>
            )}
            {variant === 'teal' && (
              <>
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </>
            )}
            {variant === 'indigo' && (
              <>
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};