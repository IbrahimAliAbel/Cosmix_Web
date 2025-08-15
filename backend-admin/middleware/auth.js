// middleware/auth.js (ENHANCED VERSION)
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const AuthUtils = require('../utils/authUtils');

// Enhanced JWT verification middleware
const verifyToken = async (request, h) => {
  try {
    const authorization = request.headers.authorization;
    
    if (!authorization) {
      return h.response({
        success: false,
        message: 'No token provided',
        code: 'AUTH_TOKEN_MISSING'
      }).code(401).takeover();
    }

    const token = AuthUtils.extractTokenFromHeader(authorization);
    
    if (!token) {
      return h.response({
        success: false,
        message: 'Invalid token format',
        code: 'AUTH_TOKEN_INVALID_FORMAT'
      }).code(401).takeover();
    }
    
    const decoded = AuthUtils.verifyToken(token);
    
    if (!decoded) {
      return h.response({
        success: false,
        message: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      }).code(401).takeover();
    }

    // Verify user still exists and is active
    const userProfile = await authService.getUserProfile(decoded.uid);
    
    if (!userProfile.success) {
      return h.response({
        success: false,
        message: 'User not found',
        code: 'AUTH_USER_NOT_FOUND'
      }).code(401).takeover();
    }

    if (!userProfile.data.isActive) {
      return h.response({
        success: false,
        message: 'Account is deactivated',
        code: 'AUTH_ACCOUNT_DEACTIVATED'
      }).code(401).takeover();
    }

    request.auth = {
      ...decoded,
      ...userProfile.data
    };
    
    return h.continue;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return h.response({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_VERIFICATION_FAILED'
    }).code(401).takeover();
  }
};

// Firebase token verification (alternative method)
const verifyFirebaseToken = async (request, h) => {
  try {
    const authorization = request.headers.authorization;
    
    if (!authorization) {
      return h.response({
        success: false,
        message: 'No token provided',
        code: 'AUTH_TOKEN_MISSING'
      }).code(401).takeover();
    }

    const idToken = AuthUtils.extractTokenFromHeader(authorization);
    
    const result = await authService.verifyFirebaseToken(idToken);
    
    if (!result.success) {
      return h.response({
        success: false,
        message: result.error,
        code: 'AUTH_FIREBASE_TOKEN_INVALID'
      }).code(401).takeover();
    }

    request.auth = result.data;
    return h.continue;
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return h.response({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FIREBASE_VERIFICATION_FAILED'
    }).code(401).takeover();
  }
};

// Enhanced admin role verification
const requireAdmin = async (request, h) => {
  if (!request.auth) {
    return h.response({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    }).code(401).takeover();
  }

  if (request.auth.role !== 'admin') {
    return h.response({
      success: false,
      message: 'Admin access required',
      code: 'AUTH_ADMIN_REQUIRED'
    }).code(403).takeover();
  }
  
  return h.continue;
};

// Enhanced optional authentication
const optionalAuth = async (request, h) => {
  try {
    const authorization = request.headers.authorization;
    
    if (authorization) {
      const token = AuthUtils.extractTokenFromHeader(authorization);
      
      if (token) {
        const decoded = AuthUtils.verifyToken(token);
        
        if (decoded) {
          // Try to get user profile
          const userProfile = await authService.getUserProfile(decoded.uid);
          
          if (userProfile.success && userProfile.data.isActive) {
            request.auth = {
              ...decoded,
              ...userProfile.data
            };
          } else {
            request.auth = null;
          }
        } else {
          request.auth = null;
        }
      } else {
        request.auth = null;
      }
    } else {
      request.auth = null;
    }
    
    return h.continue;
  } catch (error) {
    console.error('Optional auth error:', error);
    request.auth = null;
    return h.continue;
  }
};

// Rate limiting based on user
const userRateLimit = (options = {}) => {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options;
  const userRequests = new Map();

  return async (request, h) => {
    const userId = request.auth?.uid || request.info.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    let requests = userRequests.get(userId);
    requests = requests.filter(timestamp => timestamp > windowStart);

    if (requests.length >= maxRequests) {
      return h.response({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      }).code(429).takeover();
    }

    requests.push(now);
    userRequests.set(userId, requests);

    return h.continue;
  };
};

module.exports = {
  verifyToken,
  verifyFirebaseToken,
  requireAdmin,
  optionalAuth,
  userRateLimit
};