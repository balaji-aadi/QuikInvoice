import {
  roundMoney,
  toCents,
  fromCents,
  calculateLineItem,
  calculateInvoiceTotals,
  validatePaymentAmount,
} from '../src/utils/money.js';

describe('QuikInvoice Phase 3 — Financial Data Integrity & Arithmetic Test Suite', () => {
  describe('Basic Rounding & Cent Conversions', () => {
    it('should convert dollars to integer cents accurately without IEEE-754 drift', () => {
      expect(toCents(0.1 + 0.2)).toBe(30); // in JS 0.1+0.2 is 0.30000000000000004
      expect(toCents('19.99')).toBe(1999);
      expect(toCents(1234.56)).toBe(123456);
      expect(fromCents(1999)).toBe(19.99);
      expect(fromCents(30)).toBe(0.3);
    });

    it('should round half-up commercially on fractional amounts', () => {
      expect(roundMoney(10.005, 2)).toBe(10.01);
      expect(roundMoney(10.004, 2)).toBe(10.00);
      expect(roundMoney('45.555', 2)).toBe(45.56);
    });

    it('should handle zero, invalid, and NaN gracefully', () => {
      expect(roundMoney(null)).toBe(0);
      expect(roundMoney(undefined)).toBe(0);
      expect(roundMoney('invalid')).toBe(0);
      expect(toCents('abc')).toBe(0);
    });
  });

  describe('Line Item Calculations with Fractional Quantities & Precision', () => {
    it('should handle fractional quantities (e.g. consulting hours or weights)', () => {
      // 2.5 hours @ $150.00/hr, 10% tax
      // subtotal = 375.00, tax = 37.50, total = 412.50
      const calc = calculateLineItem({ quantity: 2.5, unitPrice: 150.0, taxRate: 10 });
      expect(calc.lineSubtotal).toBe(375.0);
      expect(calc.lineTax).toBe(37.5);
      expect(calc.lineTotal).toBe(412.5);
    });

    it('should handle fractional unit prices beyond 2 decimal places with proper commercial rounding', () => {
      // 100 units @ $0.3333/unit = $33.33 subtotal
      const calc = calculateLineItem({ quantity: 100, unitPrice: 0.3333, taxRate: 5 });
      expect(calc.lineSubtotal).toBe(33.33);
      // 5% of 33.33 = 1.6665 -> rounds to 1.67
      expect(calc.lineTax).toBe(1.67);
      expect(calc.lineTotal).toBe(35.0);
    });

    it('should handle zero-value lines without NaN or negative values', () => {
      const calcZeroQty = calculateLineItem({ quantity: 0, unitPrice: 100, taxRate: 15 });
      expect(calcZeroQty.lineSubtotal).toBe(0);
      expect(calcZeroQty.lineTax).toBe(0);
      expect(calcZeroQty.lineTotal).toBe(0);

      const calcZeroPrice = calculateLineItem({ quantity: 10, unitPrice: 0, taxRate: 15 });
      expect(calcZeroPrice.lineSubtotal).toBe(0);
      expect(calcZeroPrice.lineTotal).toBe(0);
    });

    it('should clamp invalid negative quantities or unit prices to zero', () => {
      const calcNegative = calculateLineItem({ quantity: -5, unitPrice: -50, taxRate: -10 });
      expect(calcNegative.lineSubtotal).toBe(0);
      expect(calcNegative.lineTax).toBe(0);
      expect(calcNegative.lineTotal).toBe(0);
    });
  });

  describe('Invoice Aggregation & Line vs Invoice Level Tax Rounding', () => {
    it('should support mixed tax rates across multiple lines without precision leakage', () => {
      const items = [
        { description: 'Tax Exempt Service', quantity: 1, unitPrice: 100.0, taxRate: 0 },
        { description: 'Standard Product', quantity: 2, unitPrice: 50.25, taxRate: 20 },
        { description: 'Reduced Rate Item', quantity: 3, unitPrice: 33.33, taxRate: 5 },
      ];

      // Line 1: subtotal 100.00, tax 0.00, total 100.00
      // Line 2: subtotal 100.50, tax 20.10, total 120.60
      // Line 3: subtotal 99.99, tax 5.00 (99.99 * 0.05 = 4.9995 -> 5.00), total 104.99
      // Total Subtotal: 100.00 + 100.50 + 99.99 = 300.49
      // Total Tax: 0.00 + 20.10 + 5.00 = 25.10
      // Total Amount: 325.59
      const totals = calculateInvoiceTotals(items, 0);

      expect(totals.subtotal).toBe(300.49);
      expect(totals.taxTotal).toBe(25.10);
      expect(totals.totalAmount).toBe(325.59);
      expect(totals.amountDue).toBe(325.59);
      expect(totals.amountPaid).toBe(0);
    });

    it('should accurately handle large numeric limits without integer overflow', () => {
      const largeItems = [
        { description: 'Enterprise Megaproject', quantity: 1, unitPrice: 9_999_999.99, taxRate: 10 },
      ];
      const totals = calculateInvoiceTotals(largeItems, 0);

      expect(totals.subtotal).toBe(9999999.99);
      expect(totals.taxTotal).toBe(1000000.0);
      expect(totals.totalAmount).toBe(10999999.99);
    });

    it('should accurately compute amountDue with prior partial payments', () => {
      const items = [
        { description: 'Hardware Server', quantity: 1, unitPrice: 1000.0, taxRate: 10 },
      ];
      // Total = 1100.00, Prior paid = 450.00, Due = 650.00
      const totals = calculateInvoiceTotals(items, 450.0);
      expect(totals.totalAmount).toBe(1100.0);
      expect(totals.amountPaid).toBe(450.0);
      expect(totals.amountDue).toBe(650.0);
    });
  });

  describe('Payment Validation & Overpayment Prevention', () => {
    it('should accept valid partial payments', () => {
      const check = validatePaymentAmount(250.0, 1000.0);
      expect(check.valid).toBe(true);
      expect(check.paymentCents).toBe(25000);
      expect(check.remainingCents).toBe(75000);
    });

    it('should accept exact-balance settlement payments', () => {
      const check = validatePaymentAmount(1000.0, 1000.0);
      expect(check.valid).toBe(true);
      expect(check.remainingCents).toBe(0);
    });

    it('should reject payment amounts that exceed the outstanding balance due', () => {
      const check = validatePaymentAmount(1000.01, 1000.0);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('exceeds remaining balance');
    });

    it('should reject non-positive payment amounts', () => {
      const checkZero = validatePaymentAmount(0, 500);
      expect(checkZero.valid).toBe(false);
      expect(checkZero.error).toContain('greater than zero');

      const checkNegative = validatePaymentAmount(-50, 500);
      expect(checkNegative.valid).toBe(false);
      expect(checkNegative.error).toContain('greater than zero');
    });

    it('should reject payment attempts on invoices with 0 balance due', () => {
      const check = validatePaymentAmount(100, 0);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('already fully paid');
    });
  });
});
