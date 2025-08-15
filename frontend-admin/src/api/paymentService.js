import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for payments
});

// Add request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Payment API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Payment API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Payment API Response Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export const paymentAPI = {
  // Create PayPal payment
  createPayment: async (paymentData) => {
    try {
      console.log('Creating PayPal payment:', paymentData);
      const response = await api.post('/payments/create', paymentData);
      return response.data;
    } catch (error) {
      console.error('createPayment error:', error);
      throw error;
    }
  },

  // Capture PayPal payment
  capturePayment: async (paypalOrderId) => {
    try {
      console.log('Capturing PayPal payment:', paypalOrderId);
      const response = await api.post(`/payments/capture/${paypalOrderId}`);
      return response.data;
    } catch (error) {
      console.error('capturePayment error:', error);
      throw error;
    }
  },

  // Get payment status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('getPaymentStatus error:', error);
      throw error;
    }
  },

  // Cancel payment
  cancelPayment: async (orderId) => {
    try {
      const response = await api.put(`/payments/cancel/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('cancelPayment error:', error);
      throw error;
    }
  }
};