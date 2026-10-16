import { Router } from 'express';
import InvoiceController from '../controllers/invoiceController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  invoiceQuerySchema,
} from '../validations/invoiceValidation.js';

const router = Router();

// All invoice endpoints require an active, authenticated tenant session
router.use(requireAuth);

router.get('/', validate(invoiceQuerySchema, 'query'), InvoiceController.listInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.get('/:id/pdf', InvoiceController.downloadInvoicePdf);
router.post('/', validate(createInvoiceSchema, 'body'), InvoiceController.createInvoice);
router.put('/:id', validate(updateInvoiceSchema, 'body'), InvoiceController.updateInvoice);
router.patch('/:id/status', validate(updateInvoiceStatusSchema, 'body'), InvoiceController.updateInvoiceStatus);
router.delete('/:id', InvoiceController.deleteInvoice);

export default router;
