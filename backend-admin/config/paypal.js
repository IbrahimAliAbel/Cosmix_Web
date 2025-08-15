// config/paypal.js (SIMPLE VERSION - No SDK dependency issues)
require('dotenv').config();

console.log('🔧 PayPal Configuration:');
console.log('   Mode:', process.env.PAYPAL_MODE || 'sandbox');
console.log('   Client ID:', process.env.PAYPAL_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
console.log('   Client Secret:', process.env.PAYPAL_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');
console.log('   ngrok URL:', process.env.NGROK_URL || 'Not set');

// Export configuration for use in services
module.exports = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.PAYPAL_MODE || 'sandbox',
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
  ngrokUrl: process.env.NGROK_URL,
  baseURL: process.env.PAYPAL_MODE === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com'
};