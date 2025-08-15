// ============= user-dashboard.jsx (WITH PAYMENT INTEGRATION) =============
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star, 
  Filter, 
  Grid, 
  List,
  ChevronDown,
  Loader,
  Eye,
  ArrowRight,
  TrendingUp,
  X,
  Shirt,
  Package,
  User,
  Settings,
  LogOut,
  Edit,
  Save,
  Lock,
  Mail,
  Camera,
  Bell,
  Shield,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Zap,
  Crown,
  Plus,
  Minus,
  DollarSign,
  Trash2
} from 'lucide-react';
import { productAPI } from "./api/productService";
import PaymentModal from '../components/PaymentModal'; // Import PaymentModal
import PaymentSuccess from '../components/PaymentSucces';
// Simple placeholder components
const TextCursor = ({ text }) => <span>{text}</span>;
const SplashCursor = () => null;

const UserDashboard = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  
  // ======= ENHANCED: Cart with quantities =======
  const [cart, setCart] = useState({}); // Changed from Set to Object for quantities
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  // Profile state management
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    avatar: null,
    notifications: true,
    newsletter: true,
    isLoading: true
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Safe localStorage operations
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('localStorage setItem error:', error);
        return false;
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('localStorage removeItem error:', error);
        return false;
      }
    }
  };

  // Get current user ID
  const getCurrentUserId = () => {
    const userData = JSON.parse(safeLocalStorage.getItem('userData') || '{}');
    return userData.uid || userData.id || 'anonymous';
  };

  // ======= ENHANCED: Cart functions with quantities =======
  const addToCart = (productId, quantity = 1) => {
    setCart(prev => {
      const newCart = { ...prev };
      newCart[productId] = (newCart[productId] || 0) + quantity;
      
      // Persist to localStorage
      const userId = getCurrentUserId();
      safeLocalStorage.setItem(`userCart_${userId}`, JSON.stringify(newCart));
      
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      
      // Persist to localStorage
      const userId = getCurrentUserId();
      safeLocalStorage.setItem(`userCart_${userId}`, JSON.stringify(newCart));
      
      return newCart;
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => {
      const newCart = { ...prev };
      newCart[productId] = quantity;
      
      // Persist to localStorage
      const userId = getCurrentUserId();
      safeLocalStorage.setItem(`userCart_${userId}`, JSON.stringify(newCart));
      
      return newCart;
    });
  };

  const getCartItems = () => {
    return Object.entries(cart).map(([productId, quantity]) => {
      const product = allProducts.find(p => p.id === productId);
      return product ? { ...product, quantity } : null;
    }).filter(Boolean);
  };

  const getCartTotal = () => {
    return getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  // ======= ENHANCED: Toggle cart (add/remove) =======
  const toggleCart = (productId) => {
    if (cart[productId]) {
      removeFromCart(productId);
    } else {
      addToCart(productId, 1);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    
    // Clear cart after successful payment
    setCart({});
    const userId = getCurrentUserId();
    safeLocalStorage.setItem(`userCart_${userId}`, JSON.stringify({}));
    
    setShowPayment(false);
    setShowCart(false);
    
    // Show success message
    alert(`Payment successful! Order ID: ${paymentData.orderId}`);
  };

  // Load user profile
  const loadUserProfile = async () => {
    try {
      setUserProfile(prev => ({ ...prev, isLoading: true }));
      const response = await productAPI.getUserProfile();
      
      if (response && response.success) {
        setUserProfile({
          name: response.data.name || '',
          email: response.data.email || '',
          avatar: response.data.avatar || null,
          notifications: response.data.notifications !== undefined ? response.data.notifications : true,
          newsletter: response.data.newsletter !== undefined ? response.data.newsletter : true,
          isLoading: false
        });
        setProfileError('');
      } else {
        throw new Error(response?.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      
      // Fallback to localStorage
      const userData = JSON.parse(safeLocalStorage.getItem('userData') || '{}');
      if (userData.name || userData.email) {
        setUserProfile(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          isLoading: false
        }));
        setProfileError('Using cached profile data. Some features may be limited.');
      } else {
        setProfileError('Failed to load profile data');
        setUserProfile(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      setProfileLoading(true);
      setProfileError('');
      setProfileSuccess('');
      
      const response = await productAPI.updateUserProfile(profileData);
      
      if (response && response.success) {
        setUserProfile(prev => ({
          ...prev,
          ...profileData
        }));
        setProfileSuccess('Profile updated successfully!');
        setEditingProfile(false);
        
        const userData = JSON.parse(safeLocalStorage.getItem('userData') || '{}');
        safeLocalStorage.setItem('userData', JSON.stringify({
          ...userData,
          name: profileData.name,
          email: profileData.email
        }));
        
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setProfileError(error.message || 'Failed to update profile');
      setTimeout(() => setProfileError(''), 5000);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      setProfileLoading(true);
      
      try {
        await productAPI.logout();
      } catch (error) {
        console.error('Logout API error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      safeLocalStorage.removeItem('authToken');
      safeLocalStorage.removeItem('userData');
      window.location.href = '/login';
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadUserProfile()
      ]);
    };
    initializeData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, allProducts]);

  // Load persisted cart and favorites
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      
      const savedCart = JSON.parse(safeLocalStorage.getItem(`userCart_${userId}`) || '{}');
      const savedFavorites = JSON.parse(safeLocalStorage.getItem(`userFavorites_${userId}`) || '[]');
      
      setCart(savedCart);
      setFavorites(new Set(savedFavorites));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [userProfile.email]);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = safeLocalStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        window.location.href = '/login';
        return;
      }
    };

    checkAuth();
  }, []);

  // Client-side filtering
  const applyFilters = () => {
    let filtered = [...allProducts];
    
    if (selectedCategory && selectedCategory !== 'no-category') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    } else if (selectedCategory === 'no-category') {
      filtered = filtered.filter(product => !product.category);
    }
    
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }
    
    setFilteredProducts(filtered);
  };

  const loadCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      if (response && response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productAPI.getAllProducts('', '');
      
      if (response && response.success) {
        setAllProducts(response.data);
      } else {
        setError(response?.message || 'Gagal memuat produk');
      }
    } catch (err) {
      setError('Gagal memuat produk. Silakan coba lagi.');
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (window.innerWidth < 1024) {
      setShowFilters(false);
    }
  };

  // Toggle favorites
  const toggleFavorite = async (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      
      const userId = getCurrentUserId();
      safeLocalStorage.setItem(`userFavorites_${userId}`, JSON.stringify([...newFavorites]));
      
      return newFavorites;
    });
  };

  const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    switch (sortBy) {
      case 'price-low':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'name':
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryDisplayName = (categoryName) => {
    const displayNames = {
      'kaos': 'Kaos',
      'fullset': 'Fullset',
      'kemeja': 'Kemeja',
      'hoodie': 'Hoodie'
    };
    return displayNames[categoryName] || categoryName;
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'kaos': <Shirt className="w-4 h-4" />,
      'fullset': <Package className="w-4 h-4" />,
      'kemeja': <Shirt className="w-4 h-4" />,
      'hoodie': <Package className="w-4 h-4" />
    };
    return icons[categoryName] || <Package className="w-4 h-4" />;
  };

  const getActualCategoryCounts = () => {
    const counts = {
      'kaos': 0,
      'fullset': 0,
      'kemeja': 0,
      'hoodie': 0,
      'no-category': 0
    };
    
    allProducts.forEach(product => {
      // eslint-disable-next-line no-prototype-builtins
      if (product.category && counts.hasOwnProperty(product.category)) {
        counts[product.category]++;
      } else {
        counts['no-category']++;
      }
    });
    
    return counts;
  };

  const handleProfileUpdate = () => {
    setProfileError('');
    setProfileSuccess('');
    
    if (!userProfile.name || userProfile.name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters long');
      return;
    }

    if (!userProfile.email || !userProfile.email.includes('@')) {
      setProfileError('Please enter a valid email address');
      return;
    }

    updateUserProfile({
      name: userProfile.name.trim(),
      email: userProfile.email.trim(),
      notifications: userProfile.notifications,
      newsletter: userProfile.newsletter
    });
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setProfileError('');
    setProfileSuccess('');
    loadUserProfile();
  };

  const actualCounts = getActualCategoryCounts();
  const sortedProducts = sortProducts(filteredProducts, sortBy);

  // ======= NEW: Cart Modal Component =======
  const CartModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl w-full max-w-2xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <p className="text-purple-100">
                  {getCartItemsCount()} items • {formatCurrency(getCartTotal())}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(false)}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {getCartItems().length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-400 mb-6">Add some products to get started!</p>
              <button
                onClick={() => setShowCart(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {getCartItems().map((item) => (
                <div key={item.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23374151'/%3E%3Ctext x='40' y='40' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='10' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{item.name}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                      <p className="text-purple-400 font-medium">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-white font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-lg font-bold text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {getCartItems().length > 0 && (
          <div className="border-t border-gray-700 p-6 bg-gray-900">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-400">Total Items: {getCartItemsCount()}</p>
                <p className="text-2xl font-bold text-white">Total: {formatCurrency(getCartTotal())}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCart(false)}
                className="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowPayment(true);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Hero Section
  const HeroSection = () => (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden min-h-[70vh]">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 w-full px-4 py-20">
        <div className="text-center max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-400/30 px-6 py-3 rounded-full flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">PREMIUM COLLECTION 2025</span>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              COSMIX
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              APOCALYPSE
            </span>
          </h1>
          
          <div className="relative">
            <SplashCursor />
          </div>
          
          {userProfile.name && !userProfile.isLoading && (
            <div className="mb-6">
              <p className="text-2xl text-gray-300">
                Welcome back, <span className="text-gradient bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">{userProfile.name}</span>
              </p>
            </div>
          )}
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover the finest collection of premium fashion that defines elegance, comfort, and sophistication for every moment that matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button 
              onClick={() => {
                document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                <Zap className="mr-2 w-5 h-5" />
                Explore Collection
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button 
              onClick={() => handleCategoryFilter('kaos')}
              className="group border-2 border-gray-600 hover:border-gray-400 bg-black/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
            >
              <span className="flex items-center">
                <TrendingUp className="mr-2 w-5 h-5" />
                Trending Now
              </span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
              <div className="text-4xl font-black text-yellow-400 mb-2">{allProducts.length}+</div>
              <div className="text-gray-400 font-medium">Premium Products</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
              <div className="text-4xl font-black text-purple-400 mb-2">100%</div>
              <div className="text-gray-400 font-medium">Quality Guaranteed</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
              <div className="text-4xl font-black text-cyan-400 mb-2">24/7</div>
              <div className="text-gray-400 font-medium">VIP Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Product Card Component
  const ProductCard = ({ product }) => (
    <div className="group bg-gradient-to-b from-gray-900 to-black rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-800 hover:border-purple-500/50">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        <img
          src={product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23374151'/%3E%3Cstop offset='100%25' stop-color='%23111827'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad)'/%3E%3Ctext x='200' y='200' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='16' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Overlay buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="flex gap-3">
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 border ${
                  favorites.has(product.id) 
                    ? 'bg-red-500/80 border-red-400 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-gray-800/80 border-gray-600 text-gray-300 hover:bg-gray-700/80 hover:border-gray-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
              </button>
              
              <button className="p-3 bg-gray-800/80 backdrop-blur-sm rounded-full text-gray-300 hover:bg-gray-700/80 border border-gray-600 transition-all duration-300">
                <Eye className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => toggleCart(product.id)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 border ${
                  cart[product.id]
                    ? 'bg-green-500/80 border-green-400 text-white shadow-lg shadow-green-500/25'
                    : 'bg-purple-600/80 border-purple-500 text-white hover:bg-purple-500/80 shadow-lg shadow-purple-500/25'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category and New badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.category && (
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border border-purple-500/50">
              {getCategoryIcon(product.category)}
              {getCategoryDisplayName(product.category)}
            </span>
          )}
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            NEW
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
            <span className="text-gray-500 text-sm ml-2">(4.8)</span>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(product.createdAt).toLocaleDateString('id-ID')}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {formatCurrency(product.price)}
            </span>
          </div>
          
          <button
            onClick={() => toggleCart(product.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 border ${
              cart[product.id]
                ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-500/50 shadow-lg shadow-purple-500/25'
            }`}
          >
            {cart[product.id] ? 'In Cart' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  // Profile Modal Component
  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl w-full max-w-2xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white text-purple-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfile.isLoading ? 'Loading...' : (userProfile.name || 'User')}
                </h2>
                <p className="text-purple-100">
                  {userProfile.isLoading ? 'Loading...' : (userProfile.email || 'user@example.com')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowProfile(false);
                setEditingProfile(false);
                setProfileError('');
                setProfileSuccess('');
              }}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900 to-black">
          {userProfile.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-3 text-gray-400">Loading profile...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {profileError && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}
              
              {profileSuccess && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {/* Profile Information */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-400" />
                    Profile Information
                  </h3>
                  <button
                    onClick={() => editingProfile ? handleProfileUpdate() : setEditingProfile(!editingProfile)}
                    disabled={profileLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 border border-purple-500/50"
                  >
                    {profileLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : editingProfile ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                    {profileLoading ? 'Saving...' : editingProfile ? 'Save' : 'Edit'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="text-white bg-gray-800/30 px-3 py-2 rounded-xl">{userProfile.name || 'Not set'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    {editingProfile ? (
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="text-white bg-gray-800/30 px-3 py-2 rounded-xl">{userProfile.email || 'Not set'}</p>
                    )}
                  </div>
                </div>
                
                {editingProfile && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={profileLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 border border-purple-500/50"
                    >
                      {profileLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={profileLoading}
                      className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 border border-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Shopping Stats */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-pink-400" />
                  Shopping Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="text-2xl font-bold text-pink-400">{favorites.size}</div>
                    <div className="text-gray-400 text-sm">Favorites</div>
                  </div>
                  <div className="text-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="text-2xl font-bold text-purple-400">{getCartItemsCount()}</div>
                    <div className="text-gray-400 text-sm">Cart Items</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 bg-gray-900">
          <button 
            onClick={handleLogout}
            disabled={profileLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 border border-red-500/50"
          >
            {profileLoading ? <Loader className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {profileLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  // Enhanced Dark Loading State
  if (loading && allProducts.length === 0) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden z-50">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-b-cyan-500 border-l-blue-500 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              COSMIX APOCALYPSE
            </h2>
            <p className="text-xl text-gray-400 font-medium animate-pulse">
              Loading premium collection...
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Dark Error state
  if (error && allProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-20 h-20 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-400 mb-6 max-w-md">{error}</p>
          <button
            onClick={() => loadProducts()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 border border-purple-500/50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Enhanced Dark Navigation Bar */}
      <nav className="bg-black/80 backdrop-blur-md shadow-2xl sticky top-0 z-40 border-b border-gray-800">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                COSMIX
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search premium fashion..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-lg text-white placeholder-gray-400"
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer text-white"
                >
                  <option value="newest">Latest</option>
                  <option value="price-low">Price: Low</option>
                  <option value="price-high">Price: High</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  showFilters 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              {/* Profile Button */}
              <button
                onClick={() => setShowProfile(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25 border border-purple-500/50"
              >
                <User className="w-5 h-5" />
              </button>
              
              {/* Favorites Button */}
              <div className="relative">
                <button className="bg-gray-800/50 text-gray-400 hover:text-pink-400 p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700">
                  <Heart className="w-5 h-5" />
                </button>
                {favorites.size > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                    {favorites.size}
                  </span>
                )}
              </div>
              
              {/* Cart Button with Enhanced Badge */}
              <div className="relative">
                <button 
                  onClick={() => setShowCart(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25 border border-purple-500/50"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                    {getCartItemsCount()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Category Filter Section */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Filter Categories:</span>
                </div>
                
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedCategory === '' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  All Categories ({allProducts.length})
                </button>
                
                {['kaos', 'fullset', 'kemeja', 'hoodie'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    {getCategoryDisplayName(category)} ({actualCounts[category]})
                  </button>
                ))}
                
                {(selectedCategory || searchQuery) && (
                  <button
                    onClick={() => {
                      handleCategoryFilter('');
                      setSearchQuery('');
                    }}
                    className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 rounded-full border border-gray-700 hover:bg-gray-700/50"
                    title="Reset all filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full px-4 py-8">
        {/* Enhanced Dark Stats Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{sortedProducts.length}</div>
              <div className="text-gray-500 text-sm">Products Found</div>
            </div>
            {(searchQuery || selectedCategory) && (
              <div className="text-center">
                <div className="text-sm text-gray-500">Active filters:</div>
                <div className="font-semibold text-white flex items-center gap-2">
                  {searchQuery && <span className="text-pink-400">"{searchQuery}"</span>}
                  {searchQuery && selectedCategory && <span className="text-gray-600">•</span>}
                  {selectedCategory && (
                    <span className="flex items-center gap-1 text-purple-400">
                      {getCategoryIcon(selectedCategory)}
                      {getCategoryDisplayName(selectedCategory)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-pink-400">{favorites.size}</div>
              <div className="text-gray-500 text-xs">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">{getCartItemsCount()}</div>
              <div className="text-gray-500 text-xs">Cart Items</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">{formatCurrency(getCartTotal())}</div>
              <div className="text-gray-500 text-xs">Cart Total</div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {sortedProducts.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8" 
              : "space-y-6"
          }>
            {sortedProducts.map((product) => (
              viewMode === 'grid' ? (
                <ProductCard key={product.id} product={product} />
              ) : (
                <div key={product.id} className="bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden border border-gray-800 hover:border-purple-500/50">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 aspect-square md:aspect-auto bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      <img
                        src={product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23374151'/%3E%3Ctext x='128' y='128' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='14' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Category and New badge */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.category && (
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border border-purple-500/50">
                            {getCategoryIcon(product.category)}
                            {getCategoryDisplayName(product.category)}
                          </span>
                        )}
                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          NEW
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-xl text-white hover:text-purple-400 transition-colors">
                            {product.name}
                          </h3>
                        </div>
                        
                        <p className="text-gray-400 mb-4 leading-relaxed">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                          <span className="text-gray-500 text-sm ml-2">(4.8)</span>
                          <span className="text-gray-600 mx-2">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(product.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {formatCurrency(product.price)}
                        </span>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className={`p-3 rounded-full transition-all duration-300 border ${
                              favorites.has(product.id) 
                                ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/25' 
                                : 'bg-gray-800/50 text-gray-400 hover:text-red-400 border-gray-700 hover:border-red-500/50'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button className="p-3 bg-gray-800/50 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-all duration-300 border border-gray-700">
                            <Eye className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => toggleCart(product.id)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 border ${
                              cart[product.id]
                                ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/25'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-500/50 shadow-lg shadow-purple-500/25'
                            }`}
                          >
                            {cart[product.id] ? 'In Cart' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-600 mb-6">
              <Search className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No products found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory
                ? `No products match your current filters. Try different filters.`
                : 'No products are available at the moment.'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 border border-purple-500/50 shadow-lg shadow-purple-500/25"
              >
                View All Products
              </button>
            )}
          </div>
        )}
        
        {loading && allProducts.length > 0 && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          </div>
        )}
      </main>

      {/* Enhanced Dark Footer */}
      <footer className="bg-black text-white py-16 mt-16 border-t border-gray-800">
        <div className="w-full px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                 COSMIX APOCALYPSE
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Discover your perfect style with our premium fashion collection that combines elegance, comfort, and sophistication.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-400">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                {['kaos', 'fullset', 'kemeja', 'hoodie'].map((category) => (
                  <li key={category}>
                    <button 
                      onClick={() => handleCategoryFilter(category)}
                      className="hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      {getCategoryIcon(category)}
                      <span className="group-hover:text-purple-400 transition-colors">
                        {getCategoryDisplayName(category)} ({actualCounts[category]})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-400">Help & Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How to Order</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns & Exchange</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-purple-400">Contact Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  hello@cosmixapocalypse.com
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  +62 123 456 789
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  24/7 VIP Support
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-center">
                &copy; 2025 Cosmix Apocalypse Store. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm">Follow us:</span>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-600 to-red-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showProfile && <ProfileModal />}
      {showCart && <CartModal />}
      
      {/* Payment Modal Integration */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          cartItems={getCartItems()}
          totalAmount={getCartTotal()}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default UserDashboard;