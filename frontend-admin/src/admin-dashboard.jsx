// ============= admin-dashboard.jsx (SIDEBAR VERSION) =============
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Upload, Eye, Search, Loader, Filter, X, ChevronDown, AlertTriangle,
  Users, BarChart3, TrendingUp, DollarSign, Package, Activity, UserCheck, UserX,
  Calendar, Clock, Star, ShoppingCart, Heart, Mail, Phone, MapPin, Settings,
  FileText, Download, RefreshCw, Bell, LogOut, Menu, Home, ChevronLeft, ChevronRight
} from 'lucide-react';
import { productAPI } from "./api/productService";

const AdminDashboard = () => {
  // ======= EXISTING STATES =======
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    imagePreview: null
  });

  // ======= ENHANCED STATES =======
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    categoryStats: [],
    userRoleStats: { admin: 0, user: 0 },
    userStatusStats: { active: 0, inactive: 0 },
    recentActivity: []
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed to true by default
  const [currentUser, setCurrentUser] = useState(null);

  // ======= ENHANCED USEEFFECTS =======
  useEffect(() => {
    const initializeData = async () => {
      // Check authentication first
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      if (!token || !userData) {
        window.location.href = '/login';
        return;
      }

      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        if (user.role !== 'admin') {
          alert('Access denied. Admin rights required.');
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = '/login';
        return;
      }

      // Load initial data
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadStatistics()
      ]);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, allProducts]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    applyUserFilters();
  }, [userSearchQuery, userRoleFilter, userStatusFilter, allUsers]);

  // ======= ENHANCED FUNCTIONS =======
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await productAPI.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    }
  };

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
        product.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  };

  const loadCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      if (response.success) {
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
      
      if (response.success) {
        setAllProducts(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Gagal memuat produk');
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await productAPI.getAllUsers();
      
      if (response.success) {
        setAllUsers(response.data);
      } else {
        console.error('Failed to load users:', response.message);
        setAllUsers([]);
      }
    } catch (err) {
      console.error('Load users error:', err);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      
      // Try to load from endpoints, fallback to calculating from basic data
      const [productsResponse, usersResponse] = await Promise.all([
        productAPI.getAllProducts().catch(() => ({ success: false, data: [] })),
        productAPI.getAllUsers().catch(() => ({ success: false, data: [] }))
      ]);

      const products = productsResponse.success ? productsResponse.data : [];
      const users = usersResponse.success ? usersResponse.data : [];

      // Try to get enhanced statistics
      let dashboardStats = null;
      try {
        const statsResponse = await productAPI.getDashboardOverview();
        if (statsResponse.success) {
          dashboardStats = statsResponse.data;
        }
      } catch (err) {
        console.log('Dashboard overview endpoint not available, using calculated data');
      }

      setStatistics({
        totalProducts: dashboardStats?.totalProducts || products.length,
        totalUsers: dashboardStats?.totalUsers || users.length,
        totalRevenue: calculateMockRevenue(products),
        totalOrders: calculateMockOrders(products),
        categoryStats: dashboardStats?.categoryStats || calculateCategoryStats(products),
        userRoleStats: calculateUserRoleStats(users),
        userStatusStats: calculateUserStatusStats(users),
        recentActivity: dashboardStats?.recentProducts ? 
          dashboardStats.recentProducts.slice(0, 5).map(product => ({
            type: 'product_added',
            description: `Product "${product.name}" was added`,
            time: formatTimeAgo(product.createdAt),
            icon: Package,
            data: product
          })) : generateMockActivity()
      });

    } catch (err) {
      console.error('Load statistics error:', err);
      setStatistics({
        totalProducts: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        categoryStats: [],
        userRoleStats: { admin: 0, user: 0 },
        userStatusStats: { active: 0, inactive: 0 },
        recentActivity: []
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // ======= HELPER FUNCTIONS =======
  const calculateMockRevenue = (products) => {
    return products.reduce((total, product) => total + (product.price * Math.floor(Math.random() * 10 + 1)), 0);
  };

  const calculateMockOrders = (products) => {
    return Math.floor(products.length * (Math.random() * 0.5 + 0.5)); // 50-100% of products
  };

  const calculateCategoryStats = (products) => {
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category || 'uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
  };

  const calculateUserRoleStats = (users) => {
    const roleStats = { admin: 0, user: 0 };
    users.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    return roleStats;
  };

  const calculateUserStatusStats = (users) => {
    const statusStats = { active: 0, inactive: 0 };
    users.forEach(user => {
      statusStats[user.isActive ? 'active' : 'inactive']++;
    });
    return statusStats;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const applyUserFilters = () => {
    let filtered = [...allUsers];

    if (userRoleFilter) {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }

    if (userStatusFilter === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (userStatusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    }

    if (userSearchQuery && userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId) => {
    if (!window.confirm('Are you sure you want to change this user\'s status?')) {
      return;
    }

    try {
      setLoadingUsers(true);
      const response = await productAPI.toggleUserStatus(userId);
      
      if (response.success) {
        await loadUsers();
        await loadStatistics(); // Refresh stats
        alert('User status updated successfully');
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      alert('An error occurred while updating user status');
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateMockActivity = () => {
    return [
      { type: 'user_register', description: 'New user registered', time: '2 minutes ago', icon: UserCheck },
      { type: 'product_added', description: 'New product added', time: '15 minutes ago', icon: Package },
      { type: 'order_placed', description: 'New order received', time: '1 hour ago', icon: ShoppingCart },
      { type: 'user_login', description: 'Admin logged in', time: '2 hours ago', icon: Activity }
    ];
  };

  // ======= EXISTING PRODUCT FUNCTIONS =======
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      alert('Please fill in all required fields including category!');
      return;
    }

    // Validate price
    const price = parseInt(formData.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price,
        category: formData.category,
        image: formData.image
      };

      let response;
      if (editingProduct) {
        response = await productAPI.updateProduct(editingProduct.id, productData);
      } else {
        response = await productAPI.createProduct(productData);
      }

      if (response.success) {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadStatistics() // Refresh stats after adding/updating product
        ]);
        resetForm();
        setShowModal(false);
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('An error occurred while saving the product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await productAPI.deleteProduct(id);
      
      if (response.success) {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadStatistics() // Refresh stats after deleting product
        ]);
        alert('Product deleted successfully!');
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null,
      imagePreview: null
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || '',
      image: null,
      imagePreview: product.imageUrl
    });
    setShowModal(true);
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
      'kaos': 'T-Shirt',
      'fullset': 'Full Set',
      'kemeja': 'Shirt', 
      'hoodie': 'Hoodie'
    };
    return displayNames[categoryName] || categoryName;
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
      if (product.category && counts.hasOwnProperty(product.category)) {
        counts[product.category]++;
      } else {
        counts['no-category']++;
      }
    });
    
    return counts;
  };

  const actualCounts = getActualCategoryCounts();

  // ======= SIDEBAR NAVIGATION ITEMS =======
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview'
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      description: `${allProducts.length} items`,
      badge: allProducts.length
    },
    {
      id: 'users',
      name: 'Users',
      icon: Users,
      description: `${allUsers.length} users`,
      badge: allUsers.length
    },
    {
      id: 'statistics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Reports & Stats'
    }
  ];

// ======= LOADING & ERROR STATES =======
  if (loading && allProducts.length === 0 && activeTab === 'products') {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-gray-900/40"></div>
        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin mx-auto shadow-lg"></div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin mx-auto opacity-70" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Fashion Admin
            </h2>
            <p className="text-xl text-gray-300 font-medium animate-pulse">
              Loading admin dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && allProducts.length === 0 && activeTab === 'products') {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Occurred</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadProducts()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ======= DASHBOARD TAB CONTENT =======
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl text-white p-6 shadow-2xl border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.name || 'Admin'}!</h2>
        <p className="text-purple-100">Here's what's happening with your fashion business today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Products</p>
              <p className="text-3xl font-bold text-white">{statistics.totalProducts}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-white">{statistics.totalUsers}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Revenue</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(statistics.totalRevenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-full shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Orders</p>
              <p className="text-3xl font-bold text-white">{statistics.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {statistics.recentActivity.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-2 rounded-full">
                    <IconComponent className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                setActiveTab('products');
                resetForm();
                setShowModal(true);
              }}
               className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Add New Product</span>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Users className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Manage Users</span>
            </button>
            
            <button
              onClick={() => setActiveTab('statistics')}
              className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-5 h-5 text-white" />
              <span className="text-white font-medium">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ======= STATISTICS TAB CONTENT =======
  const StatisticsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Statistics</h2>
          <p className="text-gray-400">Detailed analytics and performance metrics</p>
        </div>
        <button
          onClick={loadStatistics}
          disabled={loadingStats}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-400">Loading statistics...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{statistics.totalUsers}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+8%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(statistics.totalRevenue)}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-full shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+23%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Orders</p>
                  <p className="text-3xl font-bold text-white">{statistics.totalOrders}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+15%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </div>
          </div>

 {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Product Category Distribution</h3>
              <div className="space-y-3">
                {statistics.categoryStats.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-300 capitalize">{getCategoryDisplayName(category.name)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-white mr-2">{category.count}</span>
                      <span className="text-sm text-gray-400">
                        ({statistics.totalProducts > 0 ? Math.round((category.count / statistics.totalProducts) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

                       {/* User Stats */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">User Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-300">Admin</span>
                    <span className="text-white">{statistics.userRoleStats?.admin || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full" 
                      style={{ width: `${statistics.totalUsers > 0 ? ((statistics.userRoleStats?.admin || 0) / statistics.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-300">Users</span>
                    <span className="text-white">{statistics.userRoleStats?.user || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                      style={{ width: `${statistics.totalUsers > 0 ? ((statistics.userRoleStats?.user || 0) / statistics.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-300">Active Users</span>
                    <span className="text-white">{statistics.userStatusStats?.active || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                      style={{ width: `${statistics.totalUsers > 0 ? ((statistics.userStatusStats?.active || 0) / statistics.totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

 {/* Recent Activity */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {statistics.recentActivity.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-2 rounded-full">
                      <IconComponent className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.description}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ======= USERS TAB CONTENT =======
  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400">Manage users and admin accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {filteredUsers.length} / {allUsers.length} Users
          </div>
          {loadingUsers && (
            <Loader className="w-4 h-4 animate-spin text-purple-400" />
          )}
        </div>
      </div>

      {/* User Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full text-white placeholder-gray-400"
          />
        </div>
        
        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={userStatusFilter}
          onChange={(e) => setUserStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(userSearchQuery || userRoleFilter || userStatusFilter) && (
          <button
            onClick={() => {
              setUserSearchQuery('');
              setUserRoleFilter('');
              setUserStatusFilter('');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {loadingUsers ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-400">Loading users...</span>
        </div>
      ) : (
        <>
          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.uid} className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Last login: {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-400">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications: {user.notifications ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div className="flex gap-2">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => toggleUserStatus(user.uid)}
                      disabled={loadingUsers}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
                        user.isActive
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="w-4 h-4 inline mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 inline mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                  )}
                  <button className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300">
                    <Eye className="w-4 h-4 inline mr-1" />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>

{/* Empty State */}
          {filteredUsers.length === 0 && !loadingUsers && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {allUsers.length === 0 ? 'No users yet' : 'No matching users'}
              </h3>
              <p className="text-gray-400">
                {userSearchQuery || userRoleFilter || userStatusFilter
                  ? 'No users match the selected filters.'
                  : 'No users have registered in the system yet.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ======= PRODUCTS TAB CONTENT =======
  const ProductsTab = () => (
    <div className="space-y-6">
      {/* Warning for products without category */}
      {actualCounts['no-category'] > 0 && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-200">
                <strong>{actualCounts['no-category']} products</strong> don't have a category assigned. 
                <button 
                  onClick={() => handleCategoryFilter('no-category')}
                  className="ml-2 text-yellow-100 underline hover:text-white transition-colors"
                >
                  View and edit these products
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col space-y-4">
        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-80 text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filter by Category:</span>
          </div>
          
          <button
            onClick={() => handleCategoryFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === '' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({allProducts.length})
          </button>
          
          {['kaos', 'fullset', 'kemeja', 'hoodie'].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getCategoryDisplayName(category)} ({actualCounts[category]})
            </button>
          ))}
          
          {/* Show products without category */}
          {actualCounts['no-category'] > 0 && (
            <button
              onClick={() => handleCategoryFilter('no-category')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === 'no-category'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
              }`}
            >
              No Category ({actualCounts['no-category']})
            </button>
          )}
          
          {selectedCategory && (
            <button
              onClick={() => handleCategoryFilter('')}
              className="p-1 text-gray-400 hover:text-white transition-colors bg-gray-700 rounded-full border border-gray-600 hover:border-gray-500"
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter status indicator */}
        {(searchQuery || selectedCategory) && (
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-300">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Active filters: 
                  {searchQuery && <span className="ml-1 font-semibold text-white">"{searchQuery}"</span>}
                  {searchQuery && selectedCategory && <span className="mx-1">•</span>}
                  {selectedCategory && (
                    <span className="ml-1 font-semibold text-white">
                      {selectedCategory === 'no-category' ? 'No Category' : getCategoryDisplayName(selectedCategory)}
                    </span>
                  )}
                </span>
                <span className="ml-2 text-xs text-gray-400">({filteredProducts.length} results)</span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl relative group">
            <div className="aspect-square bg-gray-700 rounded-t-xl overflow-hidden relative">
              <img
                src={product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23374151'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='14' fill='%239CA3AF'%3ENo Image%3C/text%3E%3C/svg%3E"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23374151'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='14' fill='%239CA3AF'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <span className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                  product.category ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}>
                  {product.category ? getCategoryDisplayName(product.category) : 'NEEDS CATEGORY'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{formatCurrency(product.price)}</span>
                <span className="text-xs text-gray-500">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {allProducts.length === 0 ? 'No products yet' : 'No matching products'}
          </h3>
          <p className="text-gray-600">
            {searchQuery || selectedCategory ? 
              <span>
                {allProducts.length > 0 ? 'No products match the current filters' : 'No products exist yet.'}
                {searchQuery && <strong> "{searchQuery}"</strong>}
                {searchQuery && selectedCategory && <span> and </span>}
                {selectedCategory && (
                  <strong>
                    {selectedCategory === 'no-category' ? ' No Category' : ` ${getCategoryDisplayName(selectedCategory)}`}
                  </strong>
                )}
                {allProducts.length > 0 && (
                  <>
                    . <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button> or{" "}
                  </>
                )}
              </span>
              : 
              ''
            }
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              add your first product
            </button>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-50 flex" style={{margin: 0, padding: 0}}>
      {/* Sidebar */}
      <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Fashion Admin</h1>
                    <p className="text-xs text-gray-500">Dashboard</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        {item.badge !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-blue-500 text-blue-100'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            {sidebarOpen && currentUser && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50 ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
            
            {/* Loading Indicator */}
            {(loading || loadingUsers || loadingStats) && sidebarOpen && (
              <div className="mt-3 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-gray-600">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'dashboard' && 'Dashboard Overview'}
                    {activeTab === 'products' && 'Product Management'}
                    {activeTab === 'users' && 'User Management'}
                    {activeTab === 'statistics' && 'Business Analytics'}
                  </h1>
                  <p className="text-gray-600">
                    {activeTab === 'dashboard' && 'Welcome to your fashion business dashboard'}
                    {activeTab === 'products' && 'Manage your product inventory'}
                    {activeTab === 'users' && 'Manage users and admin accounts'}
                    {activeTab === 'statistics' && 'Detailed analytics and performance metrics'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {activeTab === 'dashboard' && 'Overview'}
                  {activeTab === 'products' && `${filteredProducts.length} / ${allProducts.length} Products`}
                  {activeTab === 'users' && `${filteredUsers.length} / ${allUsers.length} Users`}
                  {activeTab === 'statistics' && 'Analytics'}
                </div>
                {(loading || loadingUsers || loadingStats) && (
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-6 py-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
        </main>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md h-full max-h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    {formData.imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">Choose image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="kaos">T-Shirt</option>
                      <option value="fullset">Full Set</option>
                      <option value="kemeja">Shirt</option>
                      <option value="hoodie">Hoodie</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the appropriate category for this product
                  </p>
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your product"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.name || !formData.description || !formData.price || !formData.category}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;