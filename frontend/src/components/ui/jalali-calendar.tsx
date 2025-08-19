import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { JalaliUtils } from '../../utils/jalali';
import { useLanguage } from '../../hooks/useLanguage';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { format } from 'date-fns';

export interface JalaliCalendarProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showInput?: boolean;
  inputClassName?: string;
}

const JalaliCalendar: React.FC<JalaliCalendarProps> = ({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  showInput = true,
  inputClassName
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);



  // For now, fallback to regular date input when Persian until we can resolve the Calendar component issues
  if (language === 'fa') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              inputClassName
            )}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              <span className="font-medium">
                {JalaliUtils.formatJalaliDate(value, 'jYYYY/jMM/jDD')}
              </span>
            ) : (
              <span>{placeholder || 'انتخاب تاریخ'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="text-center mb-4">
              <h3 className="text-sm font-medium">انتخاب تاریخ شمسی</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {value ? JalaliUtils.formatJalaliDate(value, 'jDD jMMMM jYYYY') : 'تاریخ را انتخاب کنید'}
              </p>
            </div>
            
            {/* Simple date input with Jalali conversion for now */}
            <div className="space-y-3">
              <input
                type="date"
                value={value ? value.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  onChange?.(newDate);
                  setIsOpen(false);
                }}
                className="w-full p-2 border border-border rounded-md text-sm"
                min={minDate ? minDate.toISOString().split('T')[0] : undefined}
                max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
              />
              
              <div className="text-xs text-muted-foreground text-center">
                تاریخ میلادی را انتخاب کنید، تبدیل شمسی خودکار است
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  لغو
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onChange?.(new Date());
                    setIsOpen(false);
                  }}
                >
                  امروز
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // For English language, use standard HTML date input
  return (
    <input
      type="date"
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
    />
  );
};

export default JalaliCalendar;