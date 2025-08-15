// frontend/utils/errorHandler.js (NEW FILE FOR FRONTEND)

import { AuthHelper } from './authHelper';
export class ErrorHandler {
  static handleApiError(error, customHandlers = {}) {
    console.error('API Error:', error);

    // Extract error message
    let message = 'Something went wrong';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    // Handle specific error codes
    const errorCode = error.response?.data?.code;
    
    switch (errorCode) {
      case 'AUTH_TOKEN_MISSING':
      case 'AUTH_TOKEN_INVALID':
      case 'AUTH_USER_NOT_FOUND':
        AuthHelper.clearAuthData();
        window.location.href = '/login';
        return;
        
      case 'AUTH_ACCOUNT_DEACTIVATED':
        AuthHelper.clearAuthData();
        alert('Your account has been deactivated. Please contact administrator.');
        window.location.href = '/login';
        return;
        
      case 'AUTH_ADMIN_REQUIRED':
        alert('Admin access required for this action.');
        return;
        
      default:
        if (customHandlers[errorCode]) {
          customHandlers[errorCode](error);
          return;
        }
    }

    // Show generic error message
    alert(message);
  }

  static handleNetworkError(error) {
    if (error.code === 'ECONNABORTED') {
      alert('Request timeout. Please check your internet connection.');
    } else if (error.code === 'ERR_NETWORK') {
      alert('Network error. Please check your internet connection.');
    } else {
      alert('Connection failed. Please try again.');
    }
  }
}