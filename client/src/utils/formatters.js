/**
 * QuikInvoice — Shared Formatting Utilities
 * Standardized for Indian Rupees (INR, ₹) and Indian digit grouping conventions.
 */

const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrNumberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a numeric amount as Indian Rupee currency (e.g. ₹1,25,000.00).
 * Handles numbers, strings, null, undefined, and NaN gracefully.
 *
 * @param {number|string} amount
 * @returns {string} Formatted currency string with ₹ symbol and 2 decimals
 */
export const formatINR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) {
    return inrCurrencyFormatter.format(0);
  }
  return inrCurrencyFormatter.format(num);
};

/**
 * Format a numeric amount using Indian grouping without currency symbol (e.g. 1,25,000.00).
 *
 * @param {number|string} amount
 * @returns {string}
 */
export const formatINRAmount = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) {
    return inrNumberFormatter.format(0);
  }
  return inrNumberFormatter.format(num);
};

/**
 * Format date string into readable localized format (e.g. "16 Oct 2026" or "Oct 16, 2026").
 *
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
};
