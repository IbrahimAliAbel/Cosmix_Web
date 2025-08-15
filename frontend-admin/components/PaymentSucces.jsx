// ============= PaymentSuccess.jsx - Simple Success Page =============
import React from 'react';
import { 
  CheckCircle, 
  ShoppingBag, 
  ArrowLeft, 
  Star,
  Crown,
  Sparkles
} from 'lucide-react';

const PaymentSuccess = ({ 
  isOpen, 
  onClose, 
  paymentData = {},
  cartItems = [],
  totalAmount = 0,
  onBackToDashboard 
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl w-full max-w-2xl overflow-hidden border border-gray-700 shadow-2xl">
        {/* Animated Background */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="relative text-center">
            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <CheckCircle className="w-16 h-16 text-white" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
                </div>
              </div>
            </div>
            
            {/* Success Text */}
            <h1 className="text-4xl font-black mb-3">Payment Successful!</h1>
            <p className="text-xl text-green-100 mb-6">
              Thank you for your purchase! Your order has been confirmed.
            </p>
            
            {/* Premium Badge */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold text-sm">PREMIUM PURCHASE</span>
                <Crown className="w-5 h-5 text-yellow-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-8 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-400" />
              Order Summary
            </h3>
            
            {/* Order ID */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-green-400 font-mono font-bold">
                  {paymentData.orderId || 'ORD-' + Date.now()}
                </span>
              </div>
            </div>
            
            {/* Items List */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23374151'/%3E%3Ctext x='20' y='20' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='8' fill='%23666'%3EImg%3C/text%3E%3C/svg%3E"}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-gray-400 text-sm">Qty: {item.quantity || 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatCurrency(item.price * (item.quantity || 1))}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">Total Paid:</span>
                <span className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Payment Method:</span>
                <p className="text-white font-medium">PayPal</p>
              </div>
              <div>
                <span className="text-gray-400">Transaction ID:</span>
                <p className="text-green-400 font-mono text-xs">{paymentData.paymentId || 'TXN-' + Date.now()}</p>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <p className="text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </p>
              </div>
              <div>
                <span className="text-gray-400">Date:</span>
                <p className="text-white">{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Order confirmation email sent to your inbox</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Your items will be processed within 24 hours</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Tracking information will be provided</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-6 bg-gray-900">
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (onBackToDashboard) {
                  onBackToDashboard();
                }
                if (onClose) {
                  onClose();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-lg border border-purple-500/50 shadow-lg shadow-purple-500/25"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-6 py-4 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors font-medium border border-gray-600"
            >
              Print Receipt
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">
              Need help? Contact our support team at 
              <span className="text-purple-400 ml-1">support@cosmixapocalypse.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;