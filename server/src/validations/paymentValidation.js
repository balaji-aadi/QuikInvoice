import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const recordPaymentSchema = z.object({
  amount: z.coerce
    .number({ required_error: 'Payment amount is required' })
    .positive('Payment amount must be greater than zero')
    .max(100_000_000, 'Payment amount is too large'),
  paymentDate: z
    .string({ required_error: 'Payment date is required' })
    .regex(dateRegex, 'Payment date must be in YYYY-MM-DD format'),
  paymentMethod: z.enum(
    ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER'],
    {
      required_error: 'Payment method is required (CREDIT_CARD, BANK_TRANSFER, CASH, CHECK, OTHER)',
    }
  ),
  reference: z
    .string()
    .trim()
    .max(100, 'Reference identifier cannot exceed 100 characters')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, 'Payment notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

export default {
  recordPaymentSchema,
};
