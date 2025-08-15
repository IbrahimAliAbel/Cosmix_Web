// utils/authUtils.js (NEW FILE)
const jwt = require('jsonwebtoken');

class AuthUtils {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }

  static extractTokenFromHeader(authorization) {
    if (!authorization) return null;
    return authorization.replace('Bearer ', '');
  }
}

module.exports = AuthUtils;