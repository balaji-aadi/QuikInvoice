import axiosClient from './axiosClient';

export const clientApi = {
  /**
   * List clients with search and pagination
   * @param {{ search?: string, page?: number, limit?: number }} params
   */
  async listClients(params = {}) {
    const res = await axiosClient.get('/clients', { params });
    return res.data;
  },

  /**
   * Get single client by ID
   */
  async getClient(id) {
    const res = await axiosClient.get(`/clients/${id}`);
    return res.data.data.client;
  },

  /**
   * Create new client
   */
  async createClient(clientData) {
    const res = await axiosClient.post('/clients', clientData);
    return res.data.data.client;
  },

  /**
   * Update client details
   */
  async updateClient(id, clientData) {
    const res = await axiosClient.put(`/clients/${id}`, clientData);
    return res.data.data.client;
  },

  /**
   * Delete client
   */
  async deleteClient(id) {
    const res = await axiosClient.delete(`/clients/${id}`);
    return res.data;
  },
};

export default clientApi;
