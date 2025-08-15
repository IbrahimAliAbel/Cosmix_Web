const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const adminRoutes = [
  // Dashboard and statistics
  {
    method: 'GET',
    path: '/api/admin/dashboard/overview',
    handler: adminController.getDashboardOverview,
    options: {
      description: 'Get admin dashboard overview',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/statistics',
    handler: adminController.getStatistics,
    options: {
      description: 'Get business statistics',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/products/statistics',
    handler: adminController.getProductStatistics,
    options: {
      description: 'Get product statistics',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/users/statistics',
    handler: adminController.getUserStatistics,
    options: {
      description: 'Get user statistics',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/revenue/statistics',
    handler: adminController.getRevenueStatistics,
    options: {
      description: 'Get revenue statistics',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/activities',
    handler: adminController.getRecentActivities,
    options: {
      description: 'Get recent activities',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/admin/export/{type}',
    handler: adminController.exportData,
    options: {
      description: 'Export data (CSV)',
      tags: ['api', 'admin'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  // User management
  {
    method: 'GET',
    path: '/api/auth/users/{userId}',
    handler: userController.getUserDetails,
    options: {
      description: 'Get user details by ID (Admin only)',
      tags: ['api', 'admin', 'users'],
      pre: [
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  }
];

module.exports = adminRoutes;