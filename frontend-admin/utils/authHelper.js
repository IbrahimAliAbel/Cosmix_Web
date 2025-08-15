// frontend/utils/authHelper.js (NEW FILE FOR FRONTEND)
export class AuthHelper {
  static TOKEN_KEY = 'authToken';
  static USER_DATA_KEY = 'userData';

  static setAuthData(token, userData) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUserData() {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static clearAuthData() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static isAuthenticated() {
    const token = this.getToken();
    const userData = this.getUserData();
    return !!(token && userData);
  }

  static isAdmin() {
    const userData = this.getUserData();
    return userData?.role === 'admin';
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static handleAuthError(error) {
    if (error.message.includes('Session expired') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Invalid token')) {
      this.clearAuthData();
      window.location.href = '/login';
    }
  }
}