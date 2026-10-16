import ClientModel from '../models/clientModel.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class ClientService {
  /**
   * List clients for the authenticated user
   */
  static async listClients(userId, options) {
    return ClientModel.findAll(userId, options);
  }

  /**
   * Get single client by ID with ownership verification
   */
  static async getClientById(clientId, userId) {
    const client = await ClientModel.findById(clientId, userId);
    if (!client) {
      throw new NotFoundError(`Client #${clientId} not found`);
    }
    return client;
  }

  /**
   * Create new client record
   */
  static async createClient(userId, clientData) {
    return ClientModel.create(userId, clientData);
  }

  /**
   * Update existing client record
   */
  static async updateClient(clientId, userId, updateData) {
    // 1. Verify existence and ownership
    await this.getClientById(clientId, userId);

    // 2. Perform update
    return ClientModel.update(clientId, userId, updateData);
  }

  /**
   * Delete client record safely
   */
  static async deleteClient(clientId, userId) {
    // 1. Verify existence and ownership
    await this.getClientById(clientId, userId);

    // 2. Check referential integrity: reject if client has invoices
    const invoiceCount = await ClientModel.countInvoices(clientId, userId);
    if (invoiceCount > 0) {
      throw new ConflictError(
        `Cannot delete client with ${invoiceCount} existing invoice(s). Client records with billing history must be preserved for audit and accounting integrity.`
      );
    }

    // 3. Delete client
    return ClientModel.delete(clientId, userId);
  }
}

export default ClientService;
