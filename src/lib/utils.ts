import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format amount as Israeli Shekel currency
 * @param amount - Number to format
 * @returns Formatted string (e.g., "1,500 ₪")
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} ₪`;
}

/**
 * Format amount with sign for P/L display
 * @param amount - Number to format (can be negative)
 * @returns Formatted string with sign (e.g., "+1,500 ₪" or "-500 ₪")
 */
export function formatProfitLoss(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatCurrency(amount)}`;
}

/**
 * Get CSS class for profit/loss color
 * @param amount - P/L amount
 * @returns Tailwind color class
 */
export function getProfitLossColor(amount: number): string {
  if (amount > 0) return 'text-green-600';
  if (amount < 0) return 'text-red-600';
  return 'text-zinc-600';
}

/**
 * Get balance status from discrepancy
 * @param discrepancy - totalCashouts - totalBuyIns
 * @returns Status string
 */
export function getBalanceStatus(discrepancy: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (discrepancy === 0) return 'GREEN';
  if (discrepancy < 0) return 'YELLOW'; // Extra chips (more in than out)
  return 'RED'; // Missing chips (more out than in)
}

/**
 * Get balance status color class
 */
export function getBalanceStatusColor(status: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (status) {
    case 'GREEN': return 'text-green-600 bg-green-100';
    case 'YELLOW': return 'text-yellow-600 bg-yellow-100';
    case 'RED': return 'text-red-600 bg-red-100';
  }
}
