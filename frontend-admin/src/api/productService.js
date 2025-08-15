// ============= api/productService.js (FINAL VERSION) =============

import axios from 'axios';
import { paymentAPI } from './paymentService';
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout - Server tidak merespons'));
    }
    
    // ======= NEW: Handle 401 Unauthorized =======
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Data tidak ditemukan'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error - Silakan coba lagi nanti'));
    }
    
  // Return the actual error message from the server if available
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

// Tambahkan fungsi utility untuk check authentication
export const checkAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

// Update semua fungsi API untuk menggunakan checkAuthToken untuk admin functions
const adminAPICall = async (apiFunction) => {
  try {
    checkAuthToken();
    return await apiFunction();
  } catch (error) {
    if (error.message === 'No authentication token found') {
      window.location.href = '/login';
      throw error;
    }
    throw error;
  }
};

export const productAPI = {
  // ============= PRODUCT ENDPOINTS =============
  
  // Get all products (for user dashboard)
  getAllProducts: async (searchQuery = '', category = '') => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (category) params.category = category;
      
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('getAllProducts error:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    try {
      const response = await api.get(`/products/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('getProductsByCategory error:', error);
      throw error;
    }
  },

  // Get available categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('getCategories error:', error);
      throw error;
    }
  },

  // Get product by ID (for product detail page)
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('getProductById error:', error);
      throw error;
    }
  },

  // Create product (for admin only)
    // Admin functions with auth check
  createProduct: async (productData) => {
    return adminAPICall(async () => {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('category', productData.category);
      
      if (productData.image) {
        formData.append('image', productData.image);
      }

      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    });
  },

  // Update product (for admin only)
  updateProduct: async (id, productData) => {
    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      
      if (productData.category) {
        formData.append('category', productData.category);
      }
      if (productData.image) {
        formData.append('image', productData.image);
      }

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('updateProduct error:', error);
      throw error;
    }
  },

  // Delete product (for admin only)
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('deleteProduct error:', error);
      throw error;
    }
  },

  // ======= NEW: Payment Functions =======
  createPayment: paymentAPI.createPayment,
  capturePayment: paymentAPI.capturePayment,
  getPaymentStatus: paymentAPI.getPaymentStatus,
  cancelPayment: paymentAPI.cancelPayment,
  
  // ======= ENHANCED: Cart Functions with Quantities =======
  updateCartQuantity: async (productId, quantity) => {
    try {
      // For now, we'll handle this client-side
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.uid || userData.id || 'anonymous';
      
      const cartKey = `userCart_${userId}`;
      const cartData = JSON.parse(localStorage.getItem(cartKey) || '{}');
      
      if (quantity > 0) {
        cartData[productId] = quantity;
      } else {
        delete cartData[productId];
      }
      
      localStorage.setItem(cartKey, JSON.stringify(cartData));
      return { success: true };
    } catch (error) {
      console.error('updateCartQuantity error:', error);
      throw error;
    }
  },
  
  getCartWithQuantities: () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.uid || userData.id || 'anonymous';
      
      const cartKey = `userCart_${userId}`;
      return JSON.parse(localStorage.getItem(cartKey) || '{}');
    } catch (error) {
      console.error('getCartWithQuantities error:', error);
      return {};
    }
  },

  // ============= AUTH & PROFILE ENDPOINTS =============
  
  // ======= NEW: Get user profile =======
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('getUserProfile error:', error);
      throw error;
    }
  },
  // ============= USER MANAGEMENT ENDPOINTS (ADMIN ONLY) =============
  
  // Get all users (admin only)
   getAllUsers: async () => {
    return adminAPICall(async () => {
      const response = await api.get('/auth/users');
      return response.data;
    });
  },

  // Toggle user status (admin only)
  toggleUserStatus: async (userId) => {
    try {
      const response = await api.put(`/auth/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('toggleUserStatus error:', error);
      throw error;
    }
  },

  // Get user details (admin only)
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('getUserDetails error:', error);
      throw error;
    }
  },

  // ============= STATISTICS ENDPOINTS =============
  
  // Get business statistics (admin only)
  getStatistics: async () => {
    try {
      const response = await api.get('/admin/statistics');
      return response.data;
    } catch (error) {
      console.error('getStatistics error:', error);
      // Return mock data if endpoint doesn't exist
      return {
        success: false,
        message: 'Statistics endpoint not implemented yet'
      };
    }
  },

  // Get product statistics
  getProductStatistics: async () => {
    try {
      const response = await api.get('/admin/products/statistics');
      return response.data;
    } catch (error) {
      console.error('getProductStatistics error:', error);
      throw error;
    }
  },

  // Get user statistics  
  getUserStatistics: async () => {
    try {
      const response = await api.get('/admin/users/statistics');
      return response.data;
    } catch (error) {
      console.error('getUserStatistics error:', error);
      throw error;
    }
  },

  // Get revenue statistics
  getRevenueStatistics: async (period = 'month') => {
    try {
      const response = await api.get(`/admin/revenue/statistics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('getRevenueStatistics error:', error);
      throw error;
    }
  },

    // ============= ADMIN DASHBOARD SPECIFIC ENDPOINTS =============
  
  // Get dashboard overview (admin only)
  getDashboardOverview: async () => {
    try {
      const response = await api.get('/admin/dashboard/overview');
      return response.data;
    } catch (error) {
      console.error('getDashboardOverview error:', error);
      // Return mock data if endpoint doesn't exist
      return {
        success: false,
        message: 'Dashboard overview endpoint not implemented yet'
      };
    }
  },

  // Get recent activities (admin only)
  getRecentActivities: async (limit = 10) => {
    try {
      const response = await api.get(`/admin/activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('getRecentActivities error:', error);
      throw error;
    }
  },

  // Export data (admin only)
  exportData: async (type = 'products', format = 'csv') => {
    try {
      const response = await api.get(`/admin/export/${type}?format=${format}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('exportData error:', error);
      throw error;
    }
  },
  
  // ======= NEW: Update user profile =======
  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', {
        name: profileData.name,
        email: profileData.email,
        notifications: profileData.notifications,
        newsletter: profileData.newsletter
      });
      return response.data;
    } catch (error) {
      console.error('updateUserProfile error:', error);
      throw error;
    }
  },

  // ======= NEW: Change password =======
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      return response.data;
    } catch (error) {
      console.error('changePassword error:', error);
      throw error;
    }
  },

  // ======= NEW: Logout =======
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('logout error:', error);
      // Even if logout fails on server, we should clear local storage
      throw error;
    }
  },

  // ======= NEW: Login (for reference) =======
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('login error:', error);
      throw error;
    }
  },

  // ======= NEW: Register (for reference) =======
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('register error:', error);
      throw error;
    }
  },

  // ============= UTILITY ENDPOINTS =============
  
  // Health check endpoint
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('healthCheck error:', error);
      throw error;
    }
  },

  // ============= FUTURE ENDPOINTS (for reference) =============
  
  // ======= NEW: Get user favorites (if implemented) =======
  getUserFavorites: async () => {
    try {
      const response = await api.get('/user/favorites');
      return response.data;
    } catch (error) {
      console.error('getUserFavorites error:', error);
      throw error;
    }
  },

  // ======= NEW: Add to favorites =======
  addToFavorites: async (productId) => {
    try {
      const response = await api.post('/user/favorites', { productId });
      return response.data;
    } catch (error) {
      console.error('addToFavorites error:', error);
      throw error;
    }
  },

  // ======= NEW: Remove from favorites =======
  removeFromFavorites: async (productId) => {
    try {
      const response = await api.delete(`/user/favorites/${productId}`);
      return response.data;
    } catch (error) {
      console.error('removeFromFavorites error:', error);
      throw error;
    }
  },

  // ======= NEW: Get user cart (if implemented) =======
  getUserCart: async () => {
    try {
      const response = await api.get('/user/cart');
      return response.data;
    } catch (error) {
      console.error('getUserCart error:', error);
      throw error;
    }
  },

  // ======= NEW: Add to cart =======
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await api.post('/user/cart', { productId, quantity });
      return response.data;
    } catch (error) {
      console.error('addToCart error:', error);
      throw error;
    }
  },

  // ======= NEW: Remove from cart =======
  removeFromCart: async (productId) => {
    try {
      const response = await api.delete(`/user/cart/${productId}`);
      return response.data;
    } catch (error) {
      console.error('removeFromCart error:', error);
      throw error;
    }
  },

  // ======= NEW: Get user orders (if implemented) =======
  getUserOrders: async () => {
    try {
      const response = await api.get('/user/orders');
      return response.data;
    } catch (error) {
      console.error('getUserOrders error:', error);
      throw error;
    }
  },

  // ======= NEW: Create order =======
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/user/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('createOrder error:', error);
      throw error;
    }
  }
};