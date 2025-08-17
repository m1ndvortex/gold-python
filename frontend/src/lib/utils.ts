import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "IRR"): string {
  return new Intl.NumberFormat("fa-IR", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(3)} گرم`
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat("fa-IR").format(dateObj)
}

export function isRTL(text: string): boolean {
  const rtlChars = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg
  return rtlChars.test(text)
}