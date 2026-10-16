/**
 * Financial Calculation & Monetary Precision Utility
 * Avoids IEEE-754 floating-point drift using safe epsilon rounding and exact decimal scales.
 */

/**
 * Round a number to specified decimal places safely
 * @param {number|string} value - Numerical amount
 * @param {number} [decimals=2] - Decimal precision (default: 2)
 * @returns {number}
 */
export function roundMoney(value, decimals = 2) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate totals for an individual line item
 * @param {Object} item
 * @param {number} item.quantity - Quantity (e.g., 2.5)
 * @param {number} item.unitPrice - Price per unit (e.g., 100.00)
 * @param {number} [item.taxRate=0] - Applicable tax percentage (e.g., 18 for 18%)
 * @returns {{ lineSubtotal: number, lineTax: number, lineTotal: number }}
 */
export function calculateLineItem({ quantity, unitPrice, taxRate = 0 }) {
  const qty = Math.max(0, parseFloat(quantity) || 0);
  const price = Math.max(0, parseFloat(unitPrice) || 0);
  const tax = Math.max(0, Math.min(100, parseFloat(taxRate) || 0));

  const lineSubtotal = roundMoney(qty * price, 2);
  const lineTax = roundMoney(lineSubtotal * (tax / 100), 2);
  const lineTotal = roundMoney(lineSubtotal + lineTax, 2);

  return {
    lineSubtotal,
    lineTax,
    lineTotal,
  };
}

/**
 * Authoritative Server-Side Calculation of Complete Invoice Totals
 * Disregards any totals submitted by the client browser.
 * @param {Array<Object>} items - Array of line items
 * @param {number} [amountPaid=0] - Previously paid amount
 * @returns {{ subtotal: number, taxTotal: number, totalAmount: number, amountPaid: number, amountDue: number, processedItems: Array }}
 */
export function calculateInvoiceTotals(items = [], amountPaid = 0) {
  let subtotalAcc = 0;
  let taxTotalAcc = 0;

  const processedItems = items.map((item) => {
    const calc = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? item.unit_price,
      taxRate: item.taxRate ?? item.tax_rate ?? 0,
    });

    subtotalAcc += calc.lineSubtotal;
    taxTotalAcc += calc.lineTax;

    return {
      description: (item.description || '').trim(),
      quantity: roundMoney(item.quantity, 2),
      unitPrice: roundMoney(item.unitPrice ?? item.unit_price, 2),
      taxRate: roundMoney(item.taxRate ?? item.tax_rate ?? 0, 2),
      lineSubtotal: calc.lineSubtotal,
      lineTax: calc.lineTax,
      lineTotal: calc.lineTotal,
    };
  });

  const subtotal = roundMoney(subtotalAcc, 2);
  const taxTotal = roundMoney(taxTotalAcc, 2);
  const totalAmount = roundMoney(subtotal + taxTotal, 2);
  const paid = roundMoney(amountPaid, 2);
  const amountDue = roundMoney(Math.max(0, totalAmount - paid), 2);

  return {
    subtotal,
    taxTotal,
    totalAmount,
    amountPaid: paid,
    amountDue,
    processedItems,
  };
}

export default {
  roundMoney,
  calculateLineItem,
  calculateInvoiceTotals,
};
