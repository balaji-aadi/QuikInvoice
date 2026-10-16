/**
 * QuikInvoice — Financial Calculation & Monetary Precision Utility
 * 
 * DESIGN PRINCIPLE:
 * JavaScript's IEEE-754 double precision binary floating point produces precision errors 
 * (e.g. 0.1 + 0.2 === 0.30000000000000004). In a commercial billing system, this drift 
 * can cause ledger discrepancies, failed payment reconciliations, and audit violations.
 * 
 * ROUNDING POLICY:
 * - Half-Up (Commercial Rounding): Fractional cents of 0.5 or higher round away from zero.
 * - Integer-Cent Arithmetic: All monetary totals accumulate as 64-bit integer cents.
 * - Line-Level Rounding: Each line item calculates `lineSubtotal` and `lineTax` rounded to 
 *   2 decimal places (integer cents) before summing into the invoice totals.
 * - Precision: Quantities support fractional units (e.g. hours, kilograms) with arbitrary 
 *   fractional precision, and unit prices support fractional cents before line rounding.
 */

/**
 * Safely round a numeric value to specified decimal places using Half-Up rounding
 * @param {number|string} value - Numerical amount
 * @param {number} [decimals=2] - Decimal precision (default: 2)
 * @returns {number}
 */
export function roundMoney(value, decimals = 2) {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  // Add Number.EPSILON to guarantee correct half-up rounding on floating-point edge cases
  const sign = num < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(num) * factor + Number.EPSILON)) / factor;
}

/**
 * Convert a dollar amount to integer cents
 * @param {number|string} dollars
 * @returns {number} Integer cents
 */
export function toCents(dollars) {
  const num = typeof dollars === 'string' ? parseFloat(dollars) : Number(dollars);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  const sign = num < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(num) * 100 + Number.EPSILON);
}

/**
 * Convert integer cents back to a fixed 2-decimal dollar number
 * @param {number} cents
 * @returns {number}
 */
export function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

/**
 * Calculate line item subtotal, tax amount, and total
 * @param {Object} item
 * @param {number|string} item.quantity - Quantity (e.g. 2.5 hours, 10 units)
 * @param {number|string} item.unitPrice - Unit price in dollars
 * @param {number|string} [item.taxRate=0] - Percentage (e.g. 18 for 18%)
 * @returns {{ lineSubtotal: number, lineTax: number, lineTotal: number, subtotalCents: number, taxCents: number, totalCents: number }}
 */
export function calculateLineItem({ quantity, unitPrice, taxRate = 0 }) {
  const qty = Math.max(0, parseFloat(quantity) || 0);
  const price = Math.max(0, parseFloat(unitPrice) || 0);
  const tax = Math.max(0, Math.min(100, parseFloat(taxRate) || 0));

  // Compute subtotal in cents with commercial rounding
  const subtotalCents = Math.round(qty * price * 100 + Number.EPSILON);
  
  // Compute tax in cents from the rounded subtotal
  const taxCents = Math.round(subtotalCents * (tax / 100) + Number.EPSILON);
  
  // Total in cents is strictly the sum of subtotal and tax
  const totalCents = subtotalCents + taxCents;

  return {
    lineSubtotal: fromCents(subtotalCents),
    lineTax: fromCents(taxCents),
    lineTotal: fromCents(totalCents),
    subtotalCents,
    taxCents,
    totalCents,
  };
}

/**
 * Authoritative Server-Side Calculation of Complete Invoice Totals
 * Disregards any totals submitted by the client browser.
 * @param {Array<Object>} items - Array of line items
 * @param {number|string} [amountPaid=0] - Previously paid amount
 * @returns {{ subtotal: number, taxTotal: number, totalAmount: number, amountPaid: number, amountDue: number, processedItems: Array }}
 */
export function calculateInvoiceTotals(items = [], amountPaid = 0) {
  let subtotalCentsAcc = 0;
  let taxCentsAcc = 0;

  const processedItems = items.map((item) => {
    const calc = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? item.unit_price,
      taxRate: item.taxRate ?? item.tax_rate ?? 0,
    });

    subtotalCentsAcc += calc.subtotalCents;
    taxCentsAcc += calc.taxCents;

    return {
      description: (item.description || '').trim(),
      quantity: roundMoney(item.quantity, 4), // preserve fractional units up to 4 decimals
      unitPrice: roundMoney(item.unitPrice ?? item.unit_price, 2),
      taxRate: roundMoney(item.taxRate ?? item.tax_rate ?? 0, 2),
      lineSubtotal: calc.lineSubtotal,
      lineTax: calc.lineTax,
      lineTotal: calc.lineTotal,
    };
  });

  const totalCentsAcc = subtotalCentsAcc + taxCentsAcc;
  const paidCents = toCents(amountPaid);
  const dueCents = Math.max(0, totalCentsAcc - paidCents);

  return {
    subtotal: fromCents(subtotalCentsAcc),
    taxTotal: fromCents(taxCentsAcc),
    totalAmount: fromCents(totalCentsAcc),
    amountPaid: fromCents(paidCents),
    amountDue: fromCents(dueCents),
    processedItems,
  };
}

/**
 * Validate payment amount against outstanding balance
 * @param {number|string} paymentAmount - Attempted payment
 * @param {number|string} currentBalanceDue - Current balance due on invoice
 * @returns {{ valid: boolean, error?: string, paymentCents: number, remainingCents: number }}
 */
export function validatePaymentAmount(paymentAmount, currentBalanceDue) {
  const payCents = toCents(paymentAmount);
  const balanceCents = toCents(currentBalanceDue);

  if (payCents <= 0) {
    return {
      valid: false,
      error: 'Payment amount must be greater than zero',
      paymentCents: payCents,
      remainingCents: balanceCents,
    };
  }

  if (balanceCents <= 0) {
    return {
      valid: false,
      error: 'Invoice is already fully paid',
      paymentCents: payCents,
      remainingCents: 0,
    };
  }

  if (payCents > balanceCents) {
    return {
      valid: false,
      error: `Payment amount of $${fromCents(payCents).toFixed(2)} exceeds remaining balance of $${fromCents(balanceCents).toFixed(2)}`,
      paymentCents: payCents,
      remainingCents: balanceCents,
    };
  }

  return {
    valid: true,
    paymentCents: payCents,
    remainingCents: balanceCents - payCents,
  };
}

export default {
  roundMoney,
  toCents,
  fromCents,
  calculateLineItem,
  calculateInvoiceTotals,
  validatePaymentAmount,
};
