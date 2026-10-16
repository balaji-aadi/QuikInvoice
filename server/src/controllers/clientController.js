import ClientService from '../services/clientService.js';

export class ClientController {
  /**
   * List clients for logged in user
   */
  static async listClients(req, res, next) {
    try {
      const result = await ClientService.listClients(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        data: result.clients,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single client by ID
   */
  static async getClientById(req, res, next) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const client = await ClientService.getClientById(clientId, req.user.id);
      return res.status(200).json({
        success: true,
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new client
   */
  static async createClient(req, res, next) {
    try {
      const client = await ClientService.createClient(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update client details
   */
  static async updateClient(req, res, next) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const client = await ClientService.updateClient(clientId, req.user.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Client updated successfully',
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete client
   */
  static async deleteClient(req, res, next) {
    try {
      const clientId = parseInt(req.params.id, 10);
      await ClientService.deleteClient(clientId, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ClientController;
