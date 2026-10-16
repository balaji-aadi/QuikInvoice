import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const lineItemSchema = z.object({
  description: z
    .string({ required_error: 'Item description is required' })
    .trim()
    .min(1, 'Item description cannot be empty')
    .max(255, 'Item description cannot exceed 255 characters'),
  quantity: z.coerce
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than zero')
    .max(1_000_000, 'Quantity is too large'),
  unitPrice: z.coerce
    .number({ required_error: 'Unit price is required' })
    .min(0, 'Unit price cannot be negative')
    .max(100_000_000, 'Unit price is too large'),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
});

export const createInvoiceSchema = z
  .object({
    clientId: z.coerce
      .number({ required_error: 'Client ID is required' })
      .int()
      .positive('Invalid Client ID'),
    invoiceNumber: z
      .string({ required_error: 'Invoice number is required' })
      .trim()
      .min(1, 'Invoice number cannot be empty')
      .max(50, 'Invoice number cannot exceed 50 characters'),
    issueDate: z
      .string({ required_error: 'Issue date is required' })
      .regex(dateRegex, 'Issue date must be in YYYY-MM-DD format'),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .regex(dateRegex, 'Due date must be in YYYY-MM-DD format'),
    notes: z.string().trim().max(2000).optional().nullable(),
    items: z
      .array(lineItemSchema, { required_error: 'At least one line item is required' })
      .min(1, 'An invoice must contain at least one line item'),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: 'Due date cannot be earlier than issue date',
    path: ['dueDate'],
  });

export const updateInvoiceSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  invoiceNumber: z.string().trim().min(1).max(50).optional(),
  issueDate: z.string().regex(dateRegex).optional(),
  dueDate: z.string().regex(dateRegex).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(lineItemSchema).min(1).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'VOID'], {
    required_error: 'Status is required (DRAFT, ISSUED, or VOID)',
  }),
});

export const invoiceQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID']).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  invoiceQuerySchema,
};
