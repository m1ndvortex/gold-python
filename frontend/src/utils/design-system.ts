import { designTokens } from '../styles/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Design System Utilities for Gold Shop Management System
 */

// Color utilities
export const colors = {
  primary: designTokens.colors.primary,
  neutral: designTokens.colors.neutral,
  semantic: designTokens.colors.semantic,
  background: designTokens.colors.background,
  border: designTokens.colors.border,
} as const;

// Typography utilities
export const typography = {
  fontFamily: designTokens.typography.fontFamily,
  fontSize: designTokens.typography.fontSize,
  fontWeight: designTokens.typography.fontWeight,
  lineHeight: designTokens.typography.lineHeight,
  letterSpacing: designTokens.typography.letterSpacing,
} as const;

// Spacing utilities
export const spacing = designTokens.spacing;

// Animation utilities
export const animation = designTokens.animation;

// Breakpoint utilities
export const breakpoints = designTokens.breakpoints;

/**
 * Professional button variants for consistent styling
 */
export const buttonVariants = {
  primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold transition-all duration-200 hover:shadow-gold-md',
  secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200',
  ghost: 'text-primary hover:bg-primary/10 transition-all duration-200',
  destructive: 'bg-error hover:bg-error/90 text-error-foreground',
  success: 'bg-success hover:bg-success/90 text-success-foreground',
  warning: 'bg-warning hover:bg-warning/90 text-warning-foreground',
} as const;

/**
 * Professional card variants
 */
export const cardVariants = {
  default: 'bg-card border border-border rounded-lg shadow-professional',
  elevated: 'bg-card border border-border rounded-lg shadow-elegant',
  gold: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg shadow-gold',
  interactive: 'bg-card border border-border rounded-lg shadow-professional hover:shadow-elegant transition-shadow duration-300 cursor-pointer',
} as const;

/**
 * Professional input variants
 */
export const inputVariants = {
  default: 'border border-border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200',
  error: 'border border-error rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-colors duration-200',
  success: 'border border-success rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-colors duration-200',
} as const;

/**
 * Status indicator variants
 */
export const statusVariants = {
  success: 'bg-success/10 text-success border border-success/20 rounded-full px-2 py-1 text-xs font-medium',
  warning: 'bg-warning/10 text-warning border border-warning/20 rounded-full px-2 py-1 text-xs font-medium',
  error: 'bg-error/10 text-error border border-error/20 rounded-full px-2 py-1 text-xs font-medium',
  info: 'bg-info/10 text-info border border-info/20 rounded-full px-2 py-1 text-xs font-medium',
  neutral: 'bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-full px-2 py-1 text-xs font-medium',
} as const;

/**
 * Professional table variants
 */
export const tableVariants = {
  default: 'w-full border-collapse',
  striped: 'w-full border-collapse [&_tbody_tr:nth-child(even)]:bg-neutral-50/50',
  bordered: 'w-full border-collapse border border-border',
} as const;

/**
 * Animation presets for common UI patterns
 */
export const animationPresets = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInRight: 'animate-slide-in-right',
  slideOutRight: 'animate-slide-out-right',
  bounceIn: 'animate-bounce-in',
  shimmer: 'animate-shimmer',
  scaleIn: 'animate-scale-in',
} as const;

/**
 * Responsive text utilities
 */
export const responsiveText = {
  sm: 'text-sm md:text-base',
  base: 'text-base md:text-lg',
  lg: 'text-lg md:text-xl',
  xl: 'text-xl md:text-2xl',
  '2xl': 'text-2xl md:text-3xl',
  '3xl': 'text-3xl md:text-4xl',
} as const;

/**
 * Professional spacing utilities
 */
export const spacingVariants = {
  tight: 'space-y-2',
  normal: 'space-y-4',
  relaxed: 'space-y-6',
  loose: 'space-y-8',
} as const;

/**
 * Helper functions for dynamic styling
 */

/**
 * Get button classes based on variant and size
 */
export function getButtonClasses(
  variant: keyof typeof buttonVariants = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  disabled = false
) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg',
  };

  return cn(
    baseClasses,
    buttonVariants[variant],
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed'
  );
}

/**
 * Get card classes based on variant
 */
export function getCardClasses(variant: keyof typeof cardVariants = 'default') {
  return cn('p-6', cardVariants[variant]);
}

/**
 * Get input classes based on variant and state
 */
export function getInputClasses(
  variant: keyof typeof inputVariants = 'default',
  fullWidth = true
) {
  return cn(
    inputVariants[variant],
    fullWidth && 'w-full'
  );
}

/**
 * Get status indicator classes
 */
export function getStatusClasses(status: keyof typeof statusVariants) {
  return statusVariants[status];
}

/**
 * Get responsive text classes
 */
export function getResponsiveTextClasses(size: keyof typeof responsiveText) {
  return responsiveText[size];
}

/**
 * Color palette helper for dynamic theming
 */
export function getColorValue(colorPath: string): string {
  const keys = colorPath.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found in design tokens`);
      return '#000000';
    }
  }
  
  return value;
}

/**
 * Spacing helper for dynamic spacing
 */
export function getSpacingValue(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Typography helper for dynamic typography
 */
export function getFontSizeValue(key: keyof typeof typography.fontSize): string {
  return typography.fontSize[key];
}

/**
 * Professional shadow utilities
 */
export const shadowVariants = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  professional: 'shadow-professional',
  elegant: 'shadow-elegant',
  gold: 'shadow-gold',
  goldMd: 'shadow-gold-md',
  goldLg: 'shadow-gold-lg',
} as const;

/**
 * Get shadow classes
 */
export function getShadowClasses(variant: keyof typeof shadowVariants = 'default') {
  return shadowVariants[variant];
}

/**
 * Professional border utilities
 */
export const borderVariants = {
  none: 'border-0',
  default: 'border border-border',
  thick: 'border-2 border-border',
  gold: 'border border-primary/30',
  goldThick: 'border-2 border-primary/30',
  success: 'border border-success/30',
  warning: 'border border-warning/30',
  error: 'border border-error/30',
  info: 'border border-info/30',
} as const;

/**
 * Get border classes
 */
export function getBorderClasses(variant: keyof typeof borderVariants = 'default') {
  return borderVariants[variant];
}