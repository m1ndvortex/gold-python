/**
 * Slider Component
 * Range slider component
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className
}) => {
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeThumb, setActiveThumb] = React.useState<number | null>(null);

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return min;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    const rawValue = min + percentage * (max - min);
    
    // Round to nearest step
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  const handleMouseDown = (event: React.MouseEvent, thumbIndex: number) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    setActiveThumb(thumbIndex);
  };

  const handleMouseMove = React.useCallback((event: MouseEvent) => {
    if (!isDragging || activeThumb === null) return;
    
    const newValue = getValueFromPosition(event.clientX);
    const newValues = [...value];
    newValues[activeThumb] = newValue;
    
    // Ensure values don't cross over
    if (value.length === 2) {
      if (activeThumb === 0 && newValue > value[1]) {
        newValues[0] = value[1];
      } else if (activeThumb === 1 && newValue < value[0]) {
        newValues[1] = value[0];
      }
    }
    
    onValueChange(newValues);
  }, [isDragging, activeThumb, value, onValueChange]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
    setActiveThumb(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const trackClick = (event: React.MouseEvent) => {
    if (disabled) return;
    
    const newValue = getValueFromPosition(event.clientX);
    
    if (value.length === 1) {
      onValueChange([newValue]);
    } else if (value.length === 2) {
      // Find closest thumb
      const distanceToFirst = Math.abs(newValue - value[0]);
      const distanceToSecond = Math.abs(newValue - value[1]);
      const closestThumb = distanceToFirst < distanceToSecond ? 0 : 1;
      
      const newValues = [...value];
      newValues[closestThumb] = newValue;
      onValueChange(newValues);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Track */}
      <div
        ref={sliderRef}
        className={cn(
          'relative h-2 w-full rounded-full bg-gray-200 cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={trackClick}
      >
        {/* Active track */}
        {value.length === 2 && (
          <div
            className="absolute h-2 rounded-full bg-primary"
            style={{
              left: `${getPercentage(value[0])}%`,
              width: `${getPercentage(value[1]) - getPercentage(value[0])}%`
            }}
          />
        )}
        
        {/* Thumbs */}
        {value.map((val, index) => (
          <div
            key={index}
            className={cn(
              'absolute h-5 w-5 rounded-full bg-white border-2 border-primary cursor-grab transform -translate-x-1/2 -translate-y-1/2 top-1/2',
              isDragging && activeThumb === index && 'cursor-grabbing scale-110',
              disabled && 'cursor-not-allowed'
            )}
            style={{ left: `${getPercentage(val)}%` }}
            onMouseDown={(e) => handleMouseDown(e, index)}
          />
        ))}
      </div>
      
      {/* Value labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};