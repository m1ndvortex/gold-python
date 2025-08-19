import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { designTokens } from '../../styles/design-tokens';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon: LucideIcon;
  color: 'gold' | 'green' | 'blue' | 'red' | 'purple';
  trend?: number[];
  onClick?: () => void;
  isLoading?: boolean;
  subtitle?: string;
  badge?: string;
  className?: string;
}

const colorVariants = {
  gold: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    value: 'text-amber-900',
    trend: {
      increase: 'text-emerald-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600'
    },
    hover: 'hover:shadow-amber-200/50'
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    value: 'text-emerald-900',
    trend: {
      increase: 'text-emerald-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600'
    },
    hover: 'hover:shadow-emerald-200/50'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
    value: 'text-blue-900',
    trend: {
      increase: 'text-emerald-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600'
    },
    hover: 'hover:shadow-blue-200/50'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    value: 'text-red-900',
    trend: {
      increase: 'text-emerald-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600'
    },
    hover: 'hover:shadow-red-200/50'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    iconBg: 'bg-purple-100',
    value: 'text-purple-900',
    trend: {
      increase: 'text-emerald-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600'
    },
    hover: 'hover:shadow-purple-200/50'
  }
};

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1000 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // For testing environment, skip animation
    if (process.env.NODE_ENV === 'test') {
      setDisplayValue(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const TrendIndicator: React.FC<{ 
  change: MetricCardProps['change'];
  colorVariant: typeof colorVariants[keyof typeof colorVariants];
}> = ({ change, colorVariant }) => {
  if (!change) return null;

  const getTrendIcon = () => {
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="w-3 h-3" />;
      case 'decrease':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${colorVariant.trend[change.type]}`}>
      {getTrendIcon()}
      <span className="text-xs font-medium">
        {Math.abs(change.value).toFixed(1)}%
      </span>
      <span className="text-xs text-gray-500">
        {change.period}
      </span>
    </div>
  );
};

const SparklineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="absolute bottom-2 right-2 opacity-30">
      <svg width="60" height="20" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend,
  onClick,
  isLoading = false,
  subtitle,
  badge,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const colorVariant = colorVariants[color];

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </CardContent>
      </Card>
    );
  }

  const isClickable = !!onClick;
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-300 ease-out
        ${colorVariant.bg} ${colorVariant.border} ${colorVariant.hover}
        ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${isHovered ? 'shadow-lg' : 'shadow-sm'}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      data-testid="metric-card"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>

      {/* Badge */}
      {badge && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-700 shadow-sm">
            {badge}
          </span>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600 leading-none">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`
          p-2 rounded-full transition-all duration-300
          ${colorVariant.iconBg} ${colorVariant.icon}
          ${isHovered ? 'scale-110 shadow-md' : ''}
        `}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${colorVariant.value} leading-none`}>
            {typeof value === 'number' && !isNaN(numericValue) ? (
              <AnimatedCounter value={numericValue} />
            ) : (
              value
            )}
          </div>
          
          {change && (
            <TrendIndicator change={change} colorVariant={colorVariant} />
          )}
        </div>

        {/* Sparkline Chart */}
        {trend && trend.length > 0 && (
          <SparklineChart 
            data={trend} 
            color={colorVariant.icon.replace('text-', '').replace('-600', '')} 
          />
        )}
      </CardContent>

      {/* Hover Effect Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity duration-300
        ${isHovered ? 'opacity-100' : ''}
      `} />
    </Card>
  );
};

export default MetricCard;