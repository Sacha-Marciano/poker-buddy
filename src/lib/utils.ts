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
  if (amount > 0) return 'text-[#27ae60]';
  if (amount < 0) return 'text-[#c0392b]';
  return 'text-[#9a9088]';
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
    case 'GREEN': return 'text-[#27ae60] bg-[#27ae60]/10';
    case 'YELLOW': return 'text-[#d4a03c] bg-[#d4a03c]/10';
    case 'RED': return 'text-[#c0392b] bg-[#c0392b]/10';
  }
}
