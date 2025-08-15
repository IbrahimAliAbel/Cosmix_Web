const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const userRoutes = [
  // User favorites (future implementation)
  {
    method: 'GET',
    path: '/api/user/favorites',
    handler: userController.getUserFavorites,
    options: {
      description: 'Get user favorites',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'POST',
    path: '/api/user/favorites',
    handler: userController.addToFavorites,
    options: {
      description: 'Add product to favorites',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'DELETE',
    path: '/api/user/favorites/{productId}',
    handler: userController.removeFromFavorites,
    options: {
      description: 'Remove product from favorites',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  // User cart (future implementation)
  {
    method: 'GET',
    path: '/api/user/cart',
    handler: userController.getUserCart,
    options: {
      description: 'Get user cart',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'POST',
    path: '/api/user/cart',
    handler: userController.addToCart,
    options: {
      description: 'Add product to cart',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'DELETE',
    path: '/api/user/cart/{productId}',
    handler: userController.removeFromCart,
    options: {
      description: 'Remove product from cart',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  // User orders (future implementation)
  {
    method: 'GET',
    path: '/api/user/orders',
    handler: userController.getUserOrders,
    options: {
      description: 'Get user orders',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  },
  {
    method: 'POST',
    path: '/api/user/orders',
    handler: userController.createOrder,
    options: {
      description: 'Create new order',
      tags: ['api', 'user'],
      pre: [{ method: verifyToken }]
    }
  }
];

module.exports = userRoutes;