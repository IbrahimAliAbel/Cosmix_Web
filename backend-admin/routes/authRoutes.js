const authController = require('../controllers/authController');
const { verifyToken, verifyFirebaseToken, requireAdmin } = require('../middleware/auth');

const authRoutes = [
  // Public routes
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: authController.register,
    options: {
      description: 'Register new user',
      tags: ['api', 'auth']
    }
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: authController.login,
    options: {
      description: 'User login',
      tags: ['api', 'auth']
    }
  },

  // Protected routes (memerlukan authentication)
  {
    method: 'GET',
    path: '/api/auth/profile',
    handler: authController.getProfile,
    options: {
      description: 'Get user profile',
      tags: ['api', 'auth'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'PUT',
    path: '/api/auth/profile',
    handler: authController.updateProfile,
    options: {
      description: 'Update user profile',
      tags: ['api', 'auth'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'PUT',
    path: '/api/auth/change-password',
    handler: authController.changePassword,
    options: {
      description: 'Change password',
      tags: ['api', 'auth'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: authController.logout,
    options: {
      description: 'User logout',
      tags: ['api', 'auth'],
      pre: [{ method: verifyToken }]
    }
  },

  // Admin only routes
  {
    method: 'GET',
    path: '/api/auth/users',
    handler: authController.getAllUsers,
    options: {
      description: 'Get all users (Admin only)',
      tags: ['api', 'auth', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'PUT',
    path: '/api/auth/users/{uid}/toggle-status',
    handler: authController.toggleUserStatus,
    options: {
      description: 'Toggle user active status (Admin only)',
      tags: ['api', 'auth', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  }
];

module.exports = authRoutes;