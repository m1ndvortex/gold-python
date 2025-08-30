/**
 * Direction Adapter Utility for RTL/LTR Layout Management
 * Provides automatic class application and style adaptation based on language direction
 */

import { Language, Direction } from '../types';

export interface DirectionAdapter {
  getLayoutClasses: (baseClasses: string) => string;
  getFlexDirection: (direction: 'row' | 'column') => string;
  getTextAlign: (align: 'left' | 'right' | 'center') => string;
  getMarginPadding: (property: string, value: string) => Record<string, string>;
  adaptChartConfig: (config: any) => any;
  getDirectionalClasses: (componentType: string) => string;
  getIconClasses: (iconPosition?: 'start' | 'end') => string;
}

export class RTLDirectionAdapter implements DirectionAdapter {
  private isRTL: boolean;
  private direction: Direction;

  constructor(language: Language, direction: Direction) {
    this.isRTL = direction === 'rtl';
    this.direction = direction;
  }

  /**
   * Get layout classes with direction-specific adaptations
   */
  getLayoutClasses(baseClasses: string): string {
    const classes = baseClasses.split(' ');
    const adaptedClasses = classes.map(cls => this.adaptClass(cls));
    
    // Add direction-specific classes
    const directionClasses = this.isRTL ? 'rtl' : 'ltr';
    
    return `${adaptedClasses.join(' ')} ${directionClasses}`;
  }

  /**
   * Get flex direction with RTL adaptation
   */
  getFlexDirection(direction: 'row' | 'column'): string {
    if (direction === 'column') return 'flex-col';
    
    return this.isRTL ? 'flex-row-reverse' : 'flex-row';
  }

  /**
   * Get text alignment with direction awareness
   */
  getTextAlign(align: 'left' | 'right' | 'center'): string {
    if (align === 'center') return 'text-center';
    
    if (align === 'left') {
      return this.isRTL ? 'text-end' : 'text-start';
    }
    
    if (align === 'right') {
      return this.isRTL ? 'text-start' : 'text-end';
    }
    
    return 'text-start';
  }

  /**
   * Get margin/padding properties with direction adaptation
   */
  getMarginPadding(property: string, value: string): Record<string, string> {
    const styles: Record<string, string> = {};
    
    // Handle directional properties
    if (property.includes('left') || property.includes('right')) {
      const isLeft = property.includes('left');
      const baseProperty = property.replace(/-(left|right)/, '');
      
      if (isLeft) {
        styles[`${baseProperty}-inline-start`] = this.isRTL ? '0' : value;
        styles[`${baseProperty}-inline-end`] = this.isRTL ? value : '0';
      } else {
        styles[`${baseProperty}-inline-start`] = this.isRTL ? value : '0';
        styles[`${baseProperty}-inline-end`] = this.isRTL ? '0' : value;
      }
    } else {
      styles[property] = value;
    }
    
    return styles;
  }

  /**
   * Adapt chart configuration for RTL layout
   */
  adaptChartConfig(config: any): any {
    if (!config || !this.isRTL) return config;

    const adaptedConfig = { ...config };

    // Adapt chart options for RTL
    if (adaptedConfig.options) {
      // Legend positioning
      if (adaptedConfig.options.plugins?.legend) {
        adaptedConfig.options.plugins.legend = {
          ...adaptedConfig.options.plugins.legend,
          rtl: true,
          align: this.adaptAlignment(adaptedConfig.options.plugins.legend.align)
        };
      }

      // Tooltip positioning
      if (adaptedConfig.options.plugins?.tooltip) {
        adaptedConfig.options.plugins.tooltip = {
          ...adaptedConfig.options.plugins.tooltip,
          rtl: true,
          titleAlign: this.adaptAlignment(adaptedConfig.options.plugins.tooltip.titleAlign),
          bodyAlign: this.adaptAlignment(adaptedConfig.options.plugins.tooltip.bodyAlign)
        };
      }

      // Scale positioning
      if (adaptedConfig.options.scales) {
        Object.keys(adaptedConfig.options.scales).forEach(scaleKey => {
          const scale = adaptedConfig.options.scales[scaleKey];
          if (scale.position) {
            scale.position = this.adaptScalePosition(scale.position);
          }
        });
      }
    }

    return adaptedConfig;
  }

  /**
   * Get component-specific directional classes
   */
  getDirectionalClasses(componentType: string): string {
    const baseClass = this.isRTL ? `${componentType}-rtl` : `${componentType}-ltr`;
    
    switch (componentType) {
      case 'sidebar':
        return `${baseClass} ${this.isRTL ? 'start-0' : 'end-0'}`;
      case 'dropdown':
        return `${baseClass} ${this.isRTL ? 'end-0' : 'start-0'}`;
      case 'modal':
        return `${baseClass} text-${this.isRTL ? 'right' : 'left'}`;
      case 'form':
        return `${baseClass}`;
      case 'table':
        return `${baseClass}`;
      case 'card':
        return `${baseClass}`;
      case 'nav-item':
        return `${baseClass}`;
      default:
        return baseClass;
    }
  }

  /**
   * Get icon classes with position adaptation
   */
  getIconClasses(iconPosition: 'start' | 'end' = 'start'): string {
    const position = iconPosition === 'start' ? 'start' : 'end';
    const directionSuffix = this.isRTL ? 'rtl' : 'ltr';
    
    return `btn-icon-${position}-${directionSuffix}`;
  }

  /**
   * Private method to adapt individual CSS classes
   */
  private adaptClass(className: string): string {
    // Handle margin classes
    if (className.startsWith('ml-')) {
      const value = className.replace('ml-', '');
      return this.isRTL ? `me-${value}` : `ms-${value}`;
    }
    if (className.startsWith('mr-')) {
      const value = className.replace('mr-', '');
      return this.isRTL ? `ms-${value}` : `me-${value}`;
    }

    // Handle padding classes
    if (className.startsWith('pl-')) {
      const value = className.replace('pl-', '');
      return this.isRTL ? `pe-${value}` : `ps-${value}`;
    }
    if (className.startsWith('pr-')) {
      const value = className.replace('pr-', '');
      return this.isRTL ? `ps-${value}` : `pe-${value}`;
    }

    // Handle border classes
    if (className.startsWith('border-l')) {
      return this.isRTL ? className.replace('border-l', 'border-e') : className.replace('border-l', 'border-s');
    }
    if (className.startsWith('border-r')) {
      return this.isRTL ? className.replace('border-r', 'border-s') : className.replace('border-r', 'border-e');
    }

    // Handle positioning classes
    if (className.startsWith('left-')) {
      const value = className.replace('left-', '');
      return this.isRTL ? `end-${value}` : `start-${value}`;
    }
    if (className.startsWith('right-')) {
      const value = className.replace('right-', '');
      return this.isRTL ? `start-${value}` : `end-${value}`;
    }

    // Handle text alignment
    if (className === 'text-left') {
      return this.isRTL ? 'text-end' : 'text-start';
    }
    if (className === 'text-right') {
      return this.isRTL ? 'text-start' : 'text-end';
    }

    // Handle justify content
    if (className === 'justify-start') {
      return this.isRTL ? 'justify-end' : 'justify-start';
    }
    if (className === 'justify-end') {
      return this.isRTL ? 'justify-start' : 'justify-end';
    }

    // Handle rounded corners
    if (className.includes('rounded-l')) {
      return this.isRTL ? className.replace('rounded-l', 'rounded-e') : className.replace('rounded-l', 'rounded-s');
    }
    if (className.includes('rounded-r')) {
      return this.isRTL ? className.replace('rounded-r', 'rounded-s') : className.replace('rounded-r', 'rounded-e');
    }

    return className;
  }

  /**
   * Private method to adapt alignment values
   */
  private adaptAlignment(align?: string): string {
    if (!align) return 'start';
    
    switch (align) {
      case 'left':
      case 'start':
        return this.isRTL ? 'end' : 'start';
      case 'right':
      case 'end':
        return this.isRTL ? 'start' : 'end';
      case 'center':
        return 'center';
      default:
        return align;
    }
  }

  /**
   * Private method to adapt scale positions
   */
  private adaptScalePosition(position: string): string {
    switch (position) {
      case 'left':
        return this.isRTL ? 'right' : 'left';
      case 'right':
        return this.isRTL ? 'left' : 'right';
      default:
        return position;
    }
  }
}

/**
 * Factory function to create direction adapter
 */
export function createDirectionAdapter(language: Language, direction: Direction): DirectionAdapter {
  return new RTLDirectionAdapter(language, direction);
}

/**
 * Hook-like function to get direction adapter
 */
export function useDirectionAdapter(language: Language, direction: Direction): DirectionAdapter {
  return createDirectionAdapter(language, direction);
}

/**
 * Utility functions for common direction operations
 */
export const directionUtils = {
  /**
   * Get CSS direction value
   */
  getDirection: (language: Language): Direction => {
    return ['fa', 'ar', 'he', 'ur'].includes(language) ? 'rtl' : 'ltr';
  },

  /**
   * Check if language is RTL
   */
  isRTL: (language: Language): boolean => {
    return ['fa', 'ar', 'he', 'ur'].includes(language);
  },

  /**
   * Get document direction attribute
   */
  getDocumentDirection: (language: Language): string => {
    return directionUtils.isRTL(language) ? 'rtl' : 'ltr';
  },

  /**
   * Get text alignment for language
   */
  getTextAlignment: (language: Language): 'left' | 'right' => {
    return directionUtils.isRTL(language) ? 'right' : 'left';
  },

  /**
   * Apply direction to document
   */
  applyDocumentDirection: (language: Language): void => {
    const direction = directionUtils.getDirection(language);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
  },

  /**
   * Get CSS class for direction
   */
  getDirectionClass: (language: Language): string => {
    return directionUtils.isRTL(language) ? 'rtl' : 'ltr';
  }
};

export default RTLDirectionAdapter;