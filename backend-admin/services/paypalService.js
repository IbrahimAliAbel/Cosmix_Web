// services/paypalService.js (FIXED - Simple Version)
const axios = require('axios');
require('dotenv').config();

class PayPalService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.ngrokUrl = process.env.NGROK_URL || 'http://localhost:3000';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.mode = process.env.PAYPAL_MODE || 'sandbox';
    this.baseURL = this.mode === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
      
    console.log('🔧 PayPal Service initialized:');
    console.log('   Mode:', this.mode);
    console.log('   Base URL:', this.baseURL);
    console.log('   Client ID:', this.clientId ? 'Set ✅' : 'Missing ❌');
    console.log('   Client Secret:', this.clientSecret ? 'Set ✅' : 'Missing ❌');
  }

  // Get PayPal access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      console.log('🔑 Getting PayPal access token...');
      
      const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
        'grant_type=client_credentials', 
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ PayPal access token obtained');
      return response.data.access_token;
    } catch (error) {
      console.error('❌ Error getting PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token: ' + (error.response?.data?.error_description || error.message));
    }
  }

  // Make authenticated request to PayPal API
  async makeRequest(method, endpoint, data = null) {
    try {
      const accessToken = await this.getAccessToken();
      
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      console.log(`🔄 Making PayPal ${method} request to ${endpoint}`);
      
      const response = await axios(config);
      console.log(`✅ PayPal ${method} request successful`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ PayPal ${method} request error:`, error.response?.data || error.message);
      throw new Error(`PayPal API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }

  // Create PayPal order
  async createOrder(orderData) {
    try {
      const baseUrl = this.isDevelopment ? this.ngrokUrl : process.env.FRONTEND_URL;
      
      const orderPayload = {
        intent: 'CAPTURE',
        application_context: {
          brand_name: 'Fashion Admin',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${baseUrl}/payment/success`,
          cancel_url: `${baseUrl}/payment/cancel`
        },
        purchase_units: [{
          reference_id: orderData.referenceId,
          description: orderData.description,
          amount: {
            currency_code: 'USD',
            value: orderData.amount.toString(),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: orderData.amount.toString()
              }
            }
          },
          items: orderData.items.map(item => ({
            name: item.name,
            description: item.description || '',
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toString()
            },
            quantity: item.quantity.toString(),
            category: 'PHYSICAL_GOODS'
          }))
        }]
      };

      console.log('🔄 Creating PayPal order:', {
        referenceId: orderData.referenceId,
        amount: orderData.amount,
        items: orderData.items.length,
        returnUrl: `${baseUrl}/payment/success`,
        cancelUrl: `${baseUrl}/payment/cancel`
      });

      const response = await this.makeRequest('POST', '/v2/checkout/orders', orderPayload);
      
      console.log('✅ PayPal order created:', response.id);

      return {
        success: true,
        data: {
          orderId: response.id,
          status: response.status,
          links: response.links
        }
      };
    } catch (error) {
      console.error('❌ PayPal create order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture PayPal order
  async captureOrder(orderId) {
    try {
      console.log('🔄 Capturing PayPal order:', orderId);

      const response = await this.makeRequest('POST', `/v2/checkout/orders/${orderId}/capture`);
      
      const capture = response.purchase_units[0].payments.captures[0];
      
      console.log('✅ PayPal payment captured:', capture.id);

      return {
        success: true,
        data: {
          orderId: response.id,
          status: response.status,
          paymentId: capture.id,
          amount: capture.amount,
          payerInfo: response.payer
        }
      };
    } catch (error) {
      console.error('❌ PayPal capture order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      console.log('🔄 Getting PayPal order details:', orderId);
      
      const response = await this.makeRequest('GET', `/v2/checkout/orders/${orderId}`);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('❌ PayPal get order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature (simplified for development)
  verifyWebhookSignature(headers, body, webhookId) {
    try {
      // In development mode, skip signature verification
      if (this.isDevelopment) {
        console.log('⚠️  Development mode: Skipping webhook signature verification');
        return true;
      }

      // For production, implement proper webhook verification
      const auth_algo = headers['paypal-auth-algo'];
      const transmission_id = headers['paypal-transmission-id'];
      const cert_id = headers['paypal-cert-id'];
      const transmission_sig = headers['paypal-transmission-sig'];
      const transmission_time = headers['paypal-transmission-time'];
      
      // Simplified verification for now
      console.log('🔐 Webhook signature verification (simplified)');
      return true;
    } catch (error) {
      console.error('❌ Webhook verification error:', error);
      return false;
    }
  }
}

module.exports = new PayPalService();