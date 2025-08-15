// controllers/paymentController.js
const Joi = require('joi');
const paypalService = require('../services/PaypalService');
const productService = require('../services/productService');
const { db } = require('../config/firebase');

class PaymentController {
  // Create PayPal payment
  async createPayment(request, h) {
    try {
      const schema = Joi.object({
        items: Joi.array().items(
          Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().min(1).required()
          })
        ).min(1).required(),
        shippingAddress: Joi.object({
          name: Joi.string().required(),
          address: Joi.string().required(),
          city: Joi.string().required(),
          state: Joi.string().required(),
          zipCode: Joi.string().required(),
          country: Joi.string().required()
        }).required()
      });

      const { error, value } = schema.validate(request.payload);
      if (error) {
        return h.response({
          success: false,
          message: error.details[0].message
        }).code(400);
      }

      console.log('🛒 Creating payment for user:', request.auth.uid);
      console.log('📦 Items:', value.items);

      // Get product details and calculate total
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of value.items) {
        const productResult = await productService.getProductById(item.productId);
        if (!productResult.success) {
          return h.response({
            success: false,
            message: `Product ${item.productId} not found`
          }).code(404);
        }

        const product = productResult.data;
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: item.quantity,
          imageUrl: product.imageUrl
        });
      }

      console.log('💰 Total amount:', totalAmount);

      // Create pending order in database
      const pendingOrder = {
        userId: request.auth.uid,
        items: orderItems,
        totalAmount: totalAmount,
        shippingAddress: value.shippingAddress,
        status: 'pending_payment',
        paymentMethod: 'paypal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderRef = await db.collection('orders').add(pendingOrder);
      const orderId = orderRef.id;

      console.log('📝 Order created in database:', orderId);

      // Create PayPal order
      const paypalOrderData = {
        referenceId: orderId,
        description: `Fashion Admin Order #${orderId.substring(0, 8)}`,
        amount: totalAmount,
        items: orderItems
      };

      const paypalResult = await paypalService.createOrder(paypalOrderData);

      if (!paypalResult.success) {
        // Delete pending order if PayPal order creation fails
        await orderRef.delete();
        console.error('❌ Failed to create PayPal order, deleting database order');
        return h.response({
          success: false,
          message: 'Failed to create PayPal order: ' + paypalResult.error
        }).code(500);
      }

      // Update order with PayPal order ID
      await orderRef.update({
        paypalOrderId: paypalResult.data.orderId,
        updatedAt: new Date().toISOString()
      });

      const approvalUrl = paypalResult.data.links.find(link => link.rel === 'approve')?.href;

      console.log('✅ Payment created successfully');
      console.log('🔗 Approval URL:', approvalUrl);

      return h.response({
        success: true,
        message: 'Payment created successfully',
        data: {
          orderId: orderId,
          paypalOrderId: paypalResult.data.orderId,
          approvalUrl: approvalUrl,
          totalAmount: totalAmount
        }
      }).code(201);
    } catch (error) {
      console.error('❌ Create payment error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Capture PayPal payment
  async capturePayment(request, h) {
    try {
      const { paypalOrderId } = request.params;
      
      if (!paypalOrderId) {
        return h.response({
          success: false,
          message: 'PayPal Order ID is required'
        }).code(400);
      }

      console.log('🔄 Capturing payment for PayPal order:', paypalOrderId);

      // Capture PayPal payment
      const captureResult = await paypalService.captureOrder(paypalOrderId);
      
      if (!captureResult.success) {
        return h.response({
          success: false,
          message: 'Failed to capture payment: ' + captureResult.error
        }).code(400);
      }

      // Find and update order in database
      const orderSnapshot = await db.collection('orders')
        .where('paypalOrderId', '==', paypalOrderId)
        .get();

      if (orderSnapshot.empty) {
        return h.response({
          success: false,
          message: 'Order not found'
        }).code(404);
      }

      const orderDoc = orderSnapshot.docs[0];
      const orderData = orderDoc.data();

      // Update order status
      await orderDoc.ref.update({
        status: 'paid',
        paymentId: captureResult.data.paymentId,
        payerInfo: captureResult.data.payerInfo,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Order updated to paid status');

      // Clear user's cart
      const cartSnapshot = await db.collection('cart')
        .where('userId', '==', orderData.userId)
        .get();
      
      if (!cartSnapshot.empty) {
        const batch = db.batch();
        cartSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('🗑️  User cart cleared');
      }

      return h.response({
        success: true,
        message: 'Payment captured successfully',
        data: {
          orderId: orderDoc.id,
          paymentId: captureResult.data.paymentId,
          status: 'paid',
          amount: captureResult.data.amount
        }
      }).code(200);
    } catch (error) {
      console.error('❌ Capture payment error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Get payment status
  async getPaymentStatus(request, h) {
    try {
      const { orderId } = request.params;
      
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return h.response({
          success: false,
          message: 'Order not found'
        }).code(404);
      }

      const orderData = orderDoc.data();
      
      // Check if user owns this order (unless admin)
      if (request.auth.role !== 'admin' && orderData.userId !== request.auth.uid) {
        return h.response({
          success: false,
          message: 'Access denied'
        }).code(403);
      }

      return h.response({
        success: true,
        data: {
          orderId: orderId,
          status: orderData.status,
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          paypalOrderId: orderData.paypalOrderId,
          paymentId: orderData.paymentId,
          createdAt: orderData.createdAt,
          paidAt: orderData.paidAt,
          items: orderData.items
        }
      }).code(200);
    } catch (error) {
      console.error('❌ Get payment status error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Cancel payment
  async cancelPayment(request, h) {
    try {
      const { orderId } = request.params;
      
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return h.response({
          success: false,
          message: 'Order not found'
        }).code(404);
      }

      const orderData = orderDoc.data();
      
      // Check if user owns this order
      if (orderData.userId !== request.auth.uid) {
        return h.response({
          success: false,
          message: 'Access denied'
        }).code(403);
      }

      // Only allow cancellation of pending payments
      if (orderData.status !== 'pending_payment') {
        return h.response({
          success: false,
          message: 'Cannot cancel this order'
        }).code(400);
      }

      // Update order status
      await orderDoc.ref.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('❌ Payment cancelled for order:', orderId);

      return h.response({
        success: true,
        message: 'Payment cancelled successfully'
      }).code(200);
    } catch (error) {
      console.error('❌ Cancel payment error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // PayPal webhook handler
  async handleWebhook(request, h) {
    try {
      const webhookEvent = request.payload;
      const headers = request.headers;
      
      console.log('🔔 PayPal webhook received:', webhookEvent.event_type);

      // Verify webhook signature (simplified for development)
      const isValid = paypalService.verifyWebhookSignature(
        headers, 
        JSON.stringify(webhookEvent), 
        process.env.PAYPAL_WEBHOOK_ID
      );

      if (!isValid) {
        return h.response({
          success: false,
          message: 'Invalid webhook signature'
        }).code(401);
      }

      // Handle different webhook events
      switch (webhookEvent.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(webhookEvent);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentDenied(webhookEvent);
          break;
        case 'CHECKOUT.ORDER.APPROVED':
          console.log('📋 Order approved:', webhookEvent.resource.id);
          break;
        default:
          console.log('🔔 Unhandled webhook event:', webhookEvent.event_type);
      }

      return h.response({ success: true }).code(200);
    } catch (error) {
      console.error('❌ Webhook error:', error);
      return h.response({
        success: false,
        message: 'Webhook processing failed'
      }).code(500);
    }
  }

  // Handle completed payment webhook
  async handlePaymentCompleted(webhookEvent) {
    try {
      const paymentId = webhookEvent.resource.id;
      const orderId = webhookEvent.resource.supplementary_data?.related_ids?.order_id;

      console.log('✅ Payment completed webhook:', { paymentId, orderId });

      if (orderId) {
        const orderSnapshot = await db.collection('orders')
          .where('paypalOrderId', '==', orderId)
          .get();

        if (!orderSnapshot.empty) {
          const orderDoc = orderSnapshot.docs[0];
          await orderDoc.ref.update({
            status: 'paid',
            paymentId: paymentId,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('📝 Order status updated via webhook');
        }
      }
    } catch (error) {
      console.error('❌ Handle payment completed error:', error);
    }
  }

  // Handle denied payment webhook
  async handlePaymentDenied(webhookEvent) {
    try {
      const orderId = webhookEvent.resource.supplementary_data?.related_ids?.order_id;

      console.log('❌ Payment denied webhook:', orderId);

      if (orderId) {
        const orderSnapshot = await db.collection('orders')
          .where('paypalOrderId', '==', orderId)
          .get();

        if (!orderSnapshot.empty) {
          const orderDoc = orderSnapshot.docs[0];
          await orderDoc.ref.update({
            status: 'payment_failed',
            failedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('📝 Order marked as failed via webhook');
        }
      }
    } catch (error) {
      console.error('❌ Handle payment denied error:', error);
    }
  }
}

module.exports = new PaymentController();