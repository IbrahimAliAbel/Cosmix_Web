// routes/paymentRoutes.js
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

const paymentRoutes = [
  // Create payment
  {
    method: 'POST',
    path: '/api/payments/create',
    handler: paymentController.createPayment,
    options: {
      description: 'Create PayPal payment',
      tags: ['api', 'payment'],
      pre: [{ method: verifyToken }]
    }
  },
  // Capture payment
  {
    method: 'POST',
    path: '/api/payments/capture/{paypalOrderId}',
    handler: paymentController.capturePayment,
    options: {
      description: 'Capture PayPal payment',
      tags: ['api', 'payment'],
      pre: [{ method: verifyToken }]
    }
  },
  // Get payment status
  {
    method: 'GET',
    path: '/api/payments/status/{orderId}',
    handler: paymentController.getPaymentStatus,
    options: {
      description: 'Get payment status',
      tags: ['api', 'payment'],
      pre: [{ method: verifyToken }]
    }
  },
  // Cancel payment
  {
    method: 'PUT',
    path: '/api/payments/cancel/{orderId}',
    handler: paymentController.cancelPayment,
    options: {
      description: 'Cancel payment',
      tags: ['api', 'payment'],
      pre: [{ method: verifyToken }]
    }
  },
  // PayPal webhook
  {
    method: 'POST',
    path: '/api/payments/webhook/paypal',
    handler: paymentController.handleWebhook,
    options: {
      description: 'PayPal webhook handler',
      tags: ['api', 'payment', 'webhook']
    }
  }
];

module.exports = paymentRoutes;