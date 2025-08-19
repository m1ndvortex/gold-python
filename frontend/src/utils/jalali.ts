import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Jalali date utilities for professional Persian calendar support
 */
export class JalaliUtils {
  /**
   * Convert Gregorian date to Jalali
   */
  static gregorianToJalali(gregorianDate: Date): JalaliDate {
    const jMoment = moment(gregorianDate);
    return {
      year: jMoment.jYear(),
      month: jMoment.jMonth() + 1, // moment uses 0-based months
      day: jMoment.jDate()
    };
  }

  /**
   * Convert Jalali date to Gregorian
   */
  static jalaliToGregorian(jalaliDate: JalaliDate): Date {
    const jMoment = moment()
      .jYear(jalaliDate.year)
      .jMonth(jalaliDate.month - 1) // moment uses 0-based months
      .jDate(jalaliDate.day);
    return jMoment.toDate();
  }

  /**
   * Format Jalali date for display
   */
  static formatJalaliDate(date: Date | JalaliDate, format: string = 'jYYYY/jMM/jDD'): string {
    if (date instanceof Date) {
      return moment(date).format(format);
    } else {
      return moment()
        .jYear(date.year)
        .jMonth(date.month - 1)
        .jDate(date.day)
        .format(format);
    }
  }

  /**
   * Get Jalali month names
   */
  static getJalaliMonthNames(): string[] {
    return [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
  }

  /**
   * Get Jalali weekday names (starting from Saturday)
   */
  static getJalaliWeekDayNames(): string[] {
    return ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  }

  /**
   * Get Jalali weekday abbreviations
   */
  static getJalaliWeekDayAbbr(): string[] {
    return ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  }

  /**
   * Get current Jalali date
   */
  static getCurrentJalaliDate(): JalaliDate {
    const now = moment();
    return {
      year: now.jYear(),
      month: now.jMonth() + 1,
      day: now.jDate()
    };
  }

  /**
   * Check if a Jalali year is leap
   */
  static isJalaliLeapYear(year: number): boolean {
    return moment.jIsLeapYear(year);
  }

  /**
   * Get days in Jalali month
   */
  static getDaysInJalaliMonth(year: number, month: number): number {
    return moment().jYear(year).jMonth(month - 1).daysInMonth();
  }

  /**
   * Convert Persian digits to English
   */
  static persianToEnglishDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    
    return str.replace(/[۰-۹]/g, (digit) => {
      const index = persianDigits.indexOf(digit);
      return englishDigits[index];
    });
  }

  /**
   * Convert English digits to Persian
   */
  static englishToPersianDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    
    return str.replace(/[0-9]/g, (digit) => {
      const index = englishDigits.indexOf(digit);
      return persianDigits[index];
    });
  }

  /**
   * Parse Jalali date string
   */
  static parseJalaliDate(dateString: string): JalaliDate | null {
    // Handle various formats: 1403/05/15, 1403-05-15, etc.
    const cleanedString = this.persianToEnglishDigits(dateString.trim());
    const parts = cleanedString.split(/[/\-.]/);
    
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }
    
    return null;
  }

  /**
   * Get Jalali date range for a month
   */
  static getJalaliMonthRange(year: number, month: number): { start: Date; end: Date } {
    const start = moment().jYear(year).jMonth(month - 1).jDate(1);
    const end = moment().jYear(year).jMonth(month - 1).jDate(this.getDaysInJalaliMonth(year, month));
    
    return {
      start: start.toDate(),
      end: end.toDate()
    };
  }

  /**
   * Get relative time in Persian
   */
  static getRelativeTime(date: Date): string {
    return moment(date).fromNow();
  }

  /**
   * Validate Jalali date
   */
  static isValidJalaliDate(year: number, month: number, day: number): boolean {
    if (year < 1 || month < 1 || month > 12 || day < 1) {
      return false;
    }
    
    const daysInMonth = this.getDaysInJalaliMonth(year, month);
    return day <= daysInMonth;
  }
}

export default JalaliUtils;
