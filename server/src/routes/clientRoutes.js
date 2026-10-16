import { Router } from 'express';
import ClientController from '../controllers/clientController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
} from '../validations/clientValidation.js';

const router = Router();

// All client endpoints require an active, authenticated session
router.use(requireAuth);

router.get('/', validate(clientQuerySchema, 'query'), ClientController.listClients);
router.get('/:id', ClientController.getClientById);
router.post('/', validate(createClientSchema, 'body'), ClientController.createClient);
router.put('/:id', validate(updateClientSchema, 'body'), ClientController.updateClient);
router.delete('/:id', ClientController.deleteClient);

export default router;
