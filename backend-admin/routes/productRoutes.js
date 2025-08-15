const productController = require('../controllers/productController');
const upload = require('../middleware/upload');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');  // TAMBAHAN BARU

const productRoutes = [
  {
    method: 'GET',
    path: '/api/products',
    handler: productController.getAllProducts,
    options: {
      description: 'Get all products',
      tags: ['api', 'products'],
      pre: [{ method: optionalAuth }]  // TAMBAHAN BARU - Optional auth untuk public access
    }
  },
   // TAMBAHAN: Get products by category
  {
    method: 'GET',
    path: '/api/products/category/{category}',
    handler: productController.getProductsByCategory,
    options: {
      description: 'Get products by category',
      tags: ['api', 'products'],
      pre: [{ method: optionalAuth }]
    }
  },
  // TAMBAHAN: Get available categories
  {
    method: 'GET',
    path: '/api/categories',
    handler: productController.getCategories,
    options: {
      description: 'Get available product categories',
      tags: ['api', 'products']
    }
  },
  {
    method: 'GET',
    path: '/api/products/{id}',
    handler: productController.getProductById,
    options: {
      description: 'Get product by ID',
      tags: ['api', 'products'],
      pre: [{ method: optionalAuth }]  // TAMBAHAN BARU - Optional auth untuk public access
    }
  },
  {
    method: 'POST',
    path: '/api/products',
    handler: productController.createProduct,
    options: {
      description: 'Create new product (Admin only)',  // UPDATED
      tags: ['api', 'products'],
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024 // 10MB
      },
      pre: [  // TAMBAHAN BARU - Require admin
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'PUT',
    path: '/api/products/{id}',
    handler: productController.updateProduct,
    options: {
      description: 'Update product (Admin only)',  // UPDATED
      tags: ['api', 'products'],
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024 // 10MB
      },
      pre: [  // TAMBAHAN BARU - Require admin
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  {
    method: 'DELETE',
    path: '/api/products/{id}',
    handler: productController.deleteProduct,
    options: {
      description: 'Delete product (Admin only)',  // UPDATED
      tags: ['api', 'products'],
      pre: [  // TAMBAHAN BARU - Require admin
        { method: verifyToken },
        { method: requireAdmin }
      ]
    }
  },
  // Health check endpoint
  {
    method: 'GET',
    path: '/api/health',
    handler: (request, h) => {
      return h.response({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
      }).code(200);
    }
  }
];
module.exports = productRoutes;