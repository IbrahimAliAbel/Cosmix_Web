const Hapi = require('@hapi/hapi');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // NEW: Payment routes
const { securityHeaders, sanitizePayload } = require('./middleware/security');
const { generalRateLimit } = require('./middleware/rateLimiter');
const logger = require('./utils/Logger');
require('dotenv').config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    routes: {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-frontend-domain.com'] 
          : ['*'],
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        credentials: true
      }
    }
  });

  // Register plugins
  await server.register([
    require('@hapi/inert'),
    require('@hapi/vision')
  ]);

  // Security middleware
  server.ext('onRequest', generalRateLimit);
  server.ext('onPreHandler', sanitizePayload);
  server.ext('onPreResponse', securityHeaders);

  // Register routes
  server.route(productRoutes);
  server.route(authRoutes);
  server.route(adminRoutes);
  server.route(userRoutes);
  server.route(paymentRoutes); // NEW: Register payment routes

  // Enhanced error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    if (response.isBoom) {
      logger.error('Server error', {
        url: request.url.pathname,
        method: request.method,
        error: response.message,
        stack: response.stack
      });
      
      return h.response({
        success: false,
        message: response.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: response.stack 
        })
      }).code(response.output.statusCode);
    }
    
    return h.continue;
  });

  await server.start();
  
  logger.info(`Server running on ${server.info.uri}`);
  console.log('🚀 Fashion Admin Backend Started!');
  console.log('📚 Available endpoints:');
  console.log('   GET    /api/health - Health check');
  console.log('   🔐 AUTH:');
  console.log('   POST   /api/auth/register - Register user');
  console.log('   POST   /api/auth/login - User login');
  console.log('   GET    /api/auth/profile - Get user profile');
  console.log('   PUT    /api/auth/profile - Update user profile');
  console.log('   PUT    /api/auth/change-password - Change password');
  console.log('   POST   /api/auth/logout - User logout');
  console.log('   GET    /api/auth/users - Get all users (Admin)');
  console.log('   PUT    /api/auth/users/{uid}/toggle-status - Toggle user (Admin)');
  console.log('   📦 PRODUCTS:');
  console.log('   GET    /api/products - Get all products (Public, ?search=query&category=category)');
  console.log('   GET    /api/products - Get all products (Public)');
  console.log('   GET    /api/products/{id} - Get product by ID (Public)');
  console.log('   POST   /api/products - Create product (Admin)');
  console.log('   PUT    /api/products/{id} - Update product (Admin)');
  console.log('   DELETE /api/products/{id} - Delete product (Admin)');
   console.log('   📊 ADMIN:');
  console.log('   GET    /api/admin/dashboard/overview - Dashboard overview (Admin)');
  console.log('   GET    /api/admin/statistics - Business statistics (Admin)');
  console.log('   GET    /api/admin/products/statistics - Product statistics (Admin)');
  console.log('   GET    /api/admin/users/statistics - User statistics (Admin)');
  console.log('   GET    /api/admin/revenue/statistics - Revenue statistics (Admin)');
  console.log('   GET    /api/admin/activities - Recent activities (Admin)');
  console.log('   GET    /api/admin/export/{type} - Export data (Admin)');
  console.log('   GET    /api/auth/users/{userId} - Get user details (Admin)');
  console.log('   👤 USER FEATURES:');
  console.log('   GET    /api/user/favorites - Get favorites (User)');
  console.log('   POST   /api/user/favorites - Add to favorites (User)');
  console.log('   DELETE /api/user/favorites/{productId} - Remove from favorites (User)');
  console.log('   GET    /api/user/cart - Get cart (User)');
  console.log('   POST   /api/user/cart - Add to cart (User)');
  console.log('   DELETE /api/user/cart/{productId} - Remove from cart (User)');
  console.log('   GET    /api/user/orders - Get orders (User)');
  console.log('   POST   /api/user/orders - Create order (User)');
  console.log('   💳 PAYMENTS (NEW):');
  console.log('   POST   /api/payments/create - Create PayPal payment (User)');
  console.log('   POST   /api/payments/capture/{paypalOrderId} - Capture payment (User)');
  console.log('   GET    /api/payments/status/{orderId} - Get payment status (User)');
  console.log('   PUT    /api/payments/cancel/{orderId} - Cancel payment (User)');
  console.log('   POST   /api/payments/webhook/paypal - PayPal webhook (Public)');
  console.log('');
  console.log('💡 Run "npm run create-admin" to create first admin user');
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

init();