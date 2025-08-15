import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { 
  CreditCard, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Home,
  X,
  Loader,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Package
} from 'lucide-react';
import { paymentAPI } from '../src/api/paymentService';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  cartItems = [], 
  totalAmount = 0,
  onPaymentSuccess 
}) => {
  const navigate = useNavigate(); // Add this hook
  const [currentStep, setCurrentStep] = useState(1); // 1: Shipping, 2: Review, 3: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  
  const [shippingData, setShippingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [paymentData, setPaymentData] = useState({
    orderId: '',
    paypalOrderId: '',
    status: ''
  });

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setError('');
      setPaymentUrl('');
      setPaymentData({ orderId: '', paypalOrderId: '', status: '' });
    } else {
      // Pre-fill user data if available
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.name || userData.email) {
        setShippingData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || ''
        }));
      }
    }
  }, [isOpen]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const validateShippingForm = () => {
    const required = ['name', 'email', 'address', 'city', 'state', 'zipCode'];
    for (let field of required) {
      if (!shippingData[field] || shippingData[field].trim() === '') {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleShippingSubmit = () => {
    if (validateShippingForm()) {
      setCurrentStep(2);
    }
  };

  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare items for payment
      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity || 1
      }));

      const paymentPayload = {
        items: items,
        shippingAddress: {
          name: shippingData.name,
          address: shippingData.address,
          city: shippingData.city,
          state: shippingData.state,
          zipCode: shippingData.zipCode,
          country: shippingData.country
        }
      };

      console.log('Creating payment with payload:', paymentPayload);

      const response = await paymentAPI.createPayment(paymentPayload);
      
      if (response.success) {
        setPaymentData({
          orderId: response.data.orderId,
          paypalOrderId: response.data.paypalOrderId,
          status: 'created'
        });
        
        if (response.data.approvalUrl) {
          setPaymentUrl(response.data.approvalUrl);
          setCurrentStep(3);
          
          // Open PayPal in new window
          const paypalWindow = window.open(
            response.data.approvalUrl, 
            'paypal-payment', 
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );
          
          // Listen for payment completion
          const checkPaymentStatus = setInterval(async () => {
            if (paypalWindow.closed) {
              clearInterval(checkPaymentStatus);
              // Check payment status after window closes
              await checkFinalPaymentStatus(response.data.orderId);
            }
          }, 1000);
          
        } else {
          throw new Error('No approval URL received from PayPal');
        }
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setError(error.message || 'Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkFinalPaymentStatus = async (orderId) => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentStatus(orderId);
      
      if (response.success) {
        if (response.data.status === 'paid') {
          // Payment successful - prepare data for success page
          const successData = {
            orderId: orderId,
            paymentId: response.data.paymentId,
            amount: response.data.totalAmount || totalAmount,
            items: cartItems,
            shippingAddress: shippingData,
            timestamp: new Date().toISOString()
          };

          // Store success data in sessionStorage for the success page
          sessionStorage.setItem('paymentSuccessData', JSON.stringify(successData));
          
          // Clear cart data
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          const userId = userData.uid || userData.id || 'anonymous';
          const cartKey = `userCart_${userId}`;
          localStorage.removeItem(cartKey);
          
          // Call onPaymentSuccess callback if provided
          if (onPaymentSuccess) {
            onPaymentSuccess(successData);
          }
          
          // Close modal
          onClose();
          
          // Navigate to success page
          navigate('/payment-success', { 
            state: successData,
            replace: true 
          });
          
        } else {
          setError('Payment was not completed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Check payment status error:', error);
      setError('Unable to verify payment status. Please contact support if payment was deducted.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  // Handle manual redirect for completed payments (fallback)
  const handleViewOrderDetails = () => {
    const successData = {
      orderId: paymentData.orderId,
      paymentId: paymentData.paypalOrderId,
      amount: totalAmount,
      items: cartItems,
      shippingAddress: shippingData,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('paymentSuccessData', JSON.stringify(successData));
    onClose();
    navigate('/payment-success', { 
      state: successData,
      replace: true 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Secure Checkout</h2>
                <p className="text-purple-100">
                  Step {currentStep} of 3 - {
                    currentStep === 1 ? 'Shipping Information' :
                    currentStep === 2 ? 'Review Order' : 
                    paymentData.status === 'completed' ? 'Payment Complete' : 'Payment'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  step <= currentStep || paymentData.status === 'completed'
                    ? 'bg-white' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Shipping Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  Shipping Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={shippingData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={shippingData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Street Address *</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={shippingData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                    <input
                      type="text"
                      value={shippingData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                    <input
                      type="text"
                      value={shippingData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Enter state"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      value={shippingData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full px-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Enter ZIP code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                    <select
                      value={shippingData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="ID">Indonesia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review Order */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  Order Summary
                </h3>
                
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl">
                      <img
                        src={item.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23374151'/%3E%3Ctext x='40' y='40' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='10' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{item.name}</h4>
                        <p className="text-gray-400 text-sm">{item.description}</p>
                        <p className="text-purple-400 font-medium">Qty: {item.quantity || 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatCurrency(item.price * (item.quantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-700 mt-6 pt-6">
                  <div className="flex justify-between items-center text-lg font-bold text-white">
                    <span>Total Amount:</span>
                    <span className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Review */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  Shipping Address
                </h3>
                
                <div className="bg-gray-800/30 p-4 rounded-xl">
                  <p className="text-white font-medium">{shippingData.name}</p>
                  <p className="text-gray-400">{shippingData.email}</p>
                  {shippingData.phone && <p className="text-gray-400">{shippingData.phone}</p>}
                  <p className="text-gray-400 mt-2">{shippingData.address}</p>
                  <p className="text-gray-400">{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                  <p className="text-gray-400">{shippingData.country}</p>
                </div>
                
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-4 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit shipping information
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {paymentData.status === 'completed' ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3">Payment Successful!</h3>
                  <p className="text-gray-400 mb-6">
                    Your order has been confirmed and will be processed shortly.
                  </p>
                  <div className="bg-gray-800/50 p-4 rounded-xl inline-block mb-6">
                    <p className="text-gray-300">Order ID: <span className="text-purple-400 font-mono">{paymentData.orderId}</span></p>
                  </div>
                  
                  {/* Button to view order details */}
                  <button
                    onClick={handleViewOrderDetails}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <CheckCircle className="w-5 h-5" />
                    View Order Details
                  </button>
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    PayPal Payment
                  </h3>
                  
                  <div className="text-center py-8">
                    {loading ? (
                      <div>
                        <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                        <p className="text-gray-400">Processing payment...</p>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-xl inline-block mb-6">
                          <CreditCard className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-gray-400 mb-6">
                          {paymentUrl ? 
                            'PayPal window has been opened. Complete your payment there and return here.' :
                            'Click the button below to proceed with PayPal payment.'
                          }
                        </p>
                        {paymentUrl && (
                          <a
                            href={paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                          >
                            <CreditCard className="w-5 h-5" />
                            Open PayPal Payment
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {paymentData.status !== 'completed' && (
          <div className="border-t border-gray-700 p-6 bg-gray-900">
            <div className="flex justify-between items-center">
              <div className="text-gray-400">
                Total: <span className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</span>
              </div>
              
              <div className="flex gap-3">
                {currentStep > 1 && currentStep < 3 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                
                {currentStep === 1 && (
                  <button
                    onClick={handleShippingSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2"
                  >
                    Continue
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}
                
                {currentStep === 2 && (
                  <button
                    onClick={handleCreatePayment}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    {loading ? 'Creating Payment...' : 'Pay with PayPal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;