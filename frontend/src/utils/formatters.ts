// Currency formatting for Persian/Iranian Rial
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '۰ ریال';
  
  // Convert to Persian digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const formatted = new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Number formatting with Persian digits
export const formatNumber = (num: number): string => {
  if (num === 0) return '۰';
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const formatted = new Intl.NumberFormat('fa-IR').format(num);
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 1): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const formatted = value.toFixed(decimals) + '%';
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Weight formatting (grams)
export const formatWeight = (grams: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let formatted: string;
  
  if (grams >= 1000) {
    // Convert to kilograms
    const kg = grams / 1000;
    formatted = kg.toFixed(2) + ' کیلوگرم';
  } else {
    formatted = grams.toFixed(1) + ' گرم';
  }
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Date formatting for Persian calendar
export const formatDate = (date: string | Date): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatted = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Short date formatting
export const formatShortDate = (date: string | Date): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatted = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Time formatting
export const formatTime = (date: string | Date): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatted = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Compact number formatting (e.g., 1.2K, 1.5M)
export const formatCompactNumber = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let formatted: string;
  
  if (num >= 1000000) {
    formatted = (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    formatted = (num / 1000).toFixed(1) + 'K';
  } else {
    formatted = num.toString();
  }
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Iranian phone number
  let formatted: string;
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    // Mobile number: 09XX XXX XXXX
    formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Landline: 0XX XXXX XXXX
    formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  } else {
    formatted = cleaned;
  }
  
  // Replace English digits with Persian digits
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};