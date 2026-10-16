import { z } from 'zod';

export const createClientSchema = z.object({
  name: z
    .string({ required_error: 'Client name is required' })
    .trim()
    .min(2, 'Client name must be at least 2 characters long')
    .max(150, 'Client name cannot exceed 150 characters'),
  email: z
    .string({ required_error: 'Client email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(191, 'Email cannot exceed 191 characters'),
  phone: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
});

export const updateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Client name must be at least 2 characters long')
    .max(150, 'Client name cannot exceed 150 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(191, 'Email cannot exceed 191 characters')
    .optional(),
  phone: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
});

export const clientQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
};
