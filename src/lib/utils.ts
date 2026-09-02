import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// The single wording for an item whose price the business has not set yet
// (a custom-size neon design awaiting a quote). One constant so the cart,
// checkout, order pages and My Designs never drift into saying it three
// different ways.
export const PRICING_TBD_LABEL = 'Pricing TBD';

// Renders a possibly-unpriced amount. `null` means "not priced yet" and is
// never formatted as $0.00 — showing a quote item as free is the specific
// mistake this exists to prevent.
export function formatCurrencyOrTbd(amount: number | null | undefined): string {
  return amount == null ? PRICING_TBD_LABEL : formatCurrency(amount);
}
