import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send and receive cookies across origins
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Anti-CSRF defense header
  },
});

// Response interceptor for centralized error response handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract standardized API error message
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    const status = error.response?.status;

    return Promise.reject({
      status,
      code,
      message,
      details: error.response?.data?.error?.details || null,
      raw: error,
    });
  }
);

export default axiosClient;
