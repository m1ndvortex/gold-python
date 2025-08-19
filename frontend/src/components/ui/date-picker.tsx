import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import JalaliCalendar from './jalali-calendar';
import { cn } from '../../lib/utils';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  name?: string;
  id?: string;
  required?: boolean;
}

/**
 * Universal date picker that automatically switches between Jalali and Gregorian
 * based on the current language setting
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  className,
  inputClassName,
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  name,
  id,
  required = false
}) => {
  const { language } = useLanguage();

  // For Persian language, use Jalali calendar
  if (language === 'fa') {
    return (
      <JalaliCalendar
        value={value}
        onChange={onChange}
        className={className}
        inputClassName={inputClassName}
        placeholder={placeholder || 'انتخاب تاریخ'}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showInput={true}
      />
    );
  }

  // For English language, use standard HTML date input
  return (
    <input
      type="date"
      id={id}
      name={name}
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        onChange?.(newDate);
      }}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary/50 transition-colors",
        inputClassName
      )}
      disabled={disabled}
      placeholder={placeholder || 'Select date'}
      min={minDate ? minDate.toISOString().split('T')[0] : undefined}
      max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
      required={required}
    />
  );
};

export default DatePicker;


