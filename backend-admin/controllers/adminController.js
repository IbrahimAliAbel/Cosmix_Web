// ============= controllers/adminController.js (FINAL FIXED VERSION) =============
const authService = require('../services/authService');
const productService = require('../services/productService');

// Helper functions outside the class to avoid 'this' context issues
const calculateCategoryStats = (products) => {
  try {
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category || 'uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
  } catch (error) {
    console.error('Error calculating category stats:', error);
    return [];
  }
};

const calculateAveragePrice = (products) => {
  try {
    if (products.length === 0) return 0;
    const prices = products.map(product => product.price || 0).filter(price => price > 0);
    if (prices.length === 0) return 0;
    const total = prices.reduce((sum, price) => sum + price, 0);
    return Math.round(total / prices.length);
  } catch (error) {
    console.error('Error calculating average price:', error);
    return 0;
  }
};

const calculateNewUsersThisMonth = (users) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return users.filter(user => {
      try {
        return new Date(user.createdAt) >= startOfMonth;
      } catch (e) {
        return false;
      }
    }).length;
  } catch (error) {
    console.error('Error calculating new users this month:', error);
    return 0;
  }
};

const calculateNewProductsThisMonth = (products) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return products.filter(product => {
      try {
        return new Date(product.createdAt) >= startOfMonth;
      } catch (e) {
        return false;
      }
    }).length;
  } catch (error) {
    console.error('Error calculating new products this month:', error);
    return 0;
  }
};

const generateMockChartData = (period) => {
  try {
    const data = [];
    const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    
    for (let i = 0; i < daysInPeriod; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.unshift({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error generating mock chart data:', error);
    return [];
  }
};

const convertToCSV = (data, type) => {
  try {
    if (data.length === 0) return 'No data available';

    let headers = [];
    let rows = [];

    if (type === 'products') {
      headers = ['ID', 'Name', 'Category', 'Price', 'Description', 'Image URL', 'Created At', 'Updated At'];
      rows = data.map(item => [
        item.id || '',
        item.name || '',
        item.category || 'uncategorized',
        item.price || 0,
        (item.description || '').replace(/,/g, ';').replace(/"/g, '""'), // Escape CSV
        item.imageUrl || '',
        item.createdAt || '',
        item.updatedAt || ''
      ]);
    } else if (type === 'users') {
      headers = ['UID', 'Name', 'Email', 'Role', 'Active', 'Notifications', 'Newsletter', 'Created At', 'Last Login'];
      rows = data.map(item => [
        item.uid || '',
        item.name || '',
        item.email || '',
        item.role || 'user',
        item.isActive ? 'Yes' : 'No',
        item.notifications ? 'Yes' : 'No',
        item.newsletter ? 'Yes' : 'No',
        item.createdAt || '',
        item.lastLogin || ''
      ]);
    }

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error converting to CSV:', error);
    return 'Error generating CSV';
  }
};

class AdminController {
  // Get dashboard overview statistics
  async getDashboardOverview(request, h) {
    try {
      console.log('[DEBUG] getDashboardOverview called');
      
      // Get product statistics
      const productsResult = await productService.getAllProducts();
      const products = productsResult.success ? productsResult.data : [];
      console.log('[DEBUG] Products loaded:', products.length);
      
      // Get user statistics
      const usersResult = await authService.getAllUsers();
      const users = usersResult.success ? usersResult.data : [];
      console.log('[DEBUG] Users loaded:', users.length);
      
      // Calculate basic statistics using standalone functions
      const stats = {
        totalProducts: products.length,
        totalUsers: users.length,
        totalAdmins: users.filter(user => user.role === 'admin').length,
        activeUsers: users.filter(user => user.isActive).length,
        categoryStats: calculateCategoryStats(products),
        recentProducts: products.slice(0, 5).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          createdAt: product.createdAt
        })),
        recentUsers: users.slice(0, 5).map(user => ({
          uid: user.uid,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }))
      };

      console.log('[DEBUG] Stats calculated successfully:', JSON.stringify(stats, null, 2));

      return h.response({
        success: true,
        data: stats
      }).code(200);
    } catch (error) {
      console.error('[ERROR] Dashboard overview error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Get business statistics
  async getStatistics(request, h) {
    try {
      console.log('[DEBUG] getStatistics called');
      
      const productsResult = await productService.getAllProducts();
      const products = productsResult.success ? productsResult.data : [];
      
      const usersResult = await authService.getAllUsers();
      const users = usersResult.success ? usersResult.data : [];

      const statistics = {
        products: {
          total: products.length,
          byCategory: calculateCategoryStats(products),
          averagePrice: calculateAveragePrice(products),
          withImages: products.filter(p => p.imageUrl).length,
          withoutImages: products.filter(p => !p.imageUrl).length
        },
        users: {
          total: users.length,
          admins: users.filter(user => user.role === 'admin').length,
          activeUsers: users.filter(user => user.isActive).length,
          inactiveUsers: users.filter(user => !user.isActive).length,
          withNotifications: users.filter(user => user.notifications !== false).length,
          withNewsletter: users.filter(user => user.newsletter !== false).length
        },
        growth: {
          newUsersThisMonth: calculateNewUsersThisMonth(users),
          newProductsThisMonth: calculateNewProductsThisMonth(products)
        }
      };

      console.log('[DEBUG] Statistics calculated successfully');

      return h.response({
        success: true,
        data: statistics
      }).code(200);
    } catch (error) {
      console.error('[ERROR] Statistics error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Get product statistics with enhanced data
  async getProductStatistics(request, h) {
    try {
      console.log('[DEBUG] getProductStatistics called');
      
      const result = await productService.getAllProducts();
      const products = result.success ? result.data : [];

      if (products.length === 0) {
        return h.response({
          success: true,
          data: {
            total: 0,
            byCategory: [],
            priceRange: { min: 0, max: 0, average: 0 },
            withImages: 0,
            withoutImages: 0,
            recentlyAdded: 0
          }
        }).code(200);
      }

      const prices = products.map(p => p.price || 0).filter(price => price > 0);
      const stats = {
        total: products.length,
        byCategory: calculateCategoryStats(products),
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0,
          average: calculateAveragePrice(products)
        },
        withImages: products.filter(p => p.imageUrl).length,
        withoutImages: products.filter(p => !p.imageUrl).length,
        recentlyAdded: products.filter(p => {
          const createdAt = new Date(p.createdAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdAt > dayAgo;
        }).length
      };

      return h.response({
        success: true,
        data: stats
      }).code(200);
    } catch (error) {
      console.error('[ERROR] Product statistics error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Get user statistics with enhanced data
  async getUserStatistics(request, h) {
    try {
      console.log('[DEBUG] getUserStatistics called');
      
      const result = await authService.getAllUsers();
      const users = result.success ? result.data : [];

      const stats = {
        total: users.length,
        admins: users.filter(user => user.role === 'admin').length,
        regularUsers: users.filter(user => user.role === 'user').length,
        activeUsers: users.filter(user => user.isActive).length,
        inactiveUsers: users.filter(user => !user.isActive).length,
        recentlyJoined: users.filter(user => {
          const createdAt = new Date(user.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > weekAgo;
        }).length,
        withNotifications: users.filter(user => user.notifications !== false).length,
        withNewsletter: users.filter(user => user.newsletter !== false).length
      };

      return h.response({
        success: true,
        data: stats
      }).code(200);
    } catch (error) {
      console.error('[ERROR] User statistics error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Get revenue statistics (enhanced mock data)
  async getRevenueStatistics(request, h) {
    try {
      console.log('[DEBUG] getRevenueStatistics called');
      
      const { period = 'month' } = request.query;
      
      // Get products for calculation
      const productsResult = await productService.getAllProducts();
      const products = productsResult.success ? productsResult.data : [];
      
      // Enhanced mock calculation based on actual data
      const totalRevenue = products.reduce((sum, product) => sum + (product.price || 0), 0);
      const averagePrice = products.length > 0 ? totalRevenue / products.length : 0;
      
      const mockData = {
        period: period,
        totalRevenue: Math.round(totalRevenue * 0.7), // Simulate 70% sales rate
        averageOrderValue: Math.round(averagePrice),
        totalOrders: Math.round(products.length * 0.8), // Simulate order rate
        growthRate: Math.floor(Math.random() * 20) + 5, // Random growth 5-25%
        chartData: generateMockChartData(period),
        topProducts: products.slice(0, 5).map(product => ({
          name: product.name,
          revenue: Math.round((product.price || 0) * (Math.random() * 10 + 5)),
          orders: Math.floor(Math.random() * 20 + 5)
        }))
      };

      return h.response({
        success: true,
        data: mockData
      }).code(200);
    } catch (error) {
      console.error('[ERROR] Revenue statistics error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Get recent activities with real data
  async getRecentActivities(request, h) {
    try {
      console.log('[DEBUG] getRecentActivities called');
      
      const { limit = 10 } = request.query;
      
      const productsResult = await productService.getAllProducts();
      const products = productsResult.success ? productsResult.data : [];
      
      const usersResult = await authService.getAllUsers();
      const users = usersResult.success ? usersResult.data : [];

      const activities = [];

      // Add product activities
      products.slice(0, Math.floor(limit / 2)).forEach(product => {
        activities.push({
          id: `product_${product.id}`,
          type: 'product_created',
          title: `New product "${product.name}" was created`,
          description: `Product in ${product.category || 'uncategorized'} category`,
          timestamp: product.createdAt,
          icon: 'package',
          data: {
            productId: product.id,
            productName: product.name,
            category: product.category,
            price: product.price
          }
        });
      });

      // Add user activities
      users.slice(0, Math.floor(limit / 2)).forEach(user => {
        activities.push({
          id: `user_${user.uid}`,
          type: 'user_registered',
          title: `New user "${user.name}" registered`,
          description: `User role: ${user.role}`,
          timestamp: user.createdAt,
          icon: 'user',
          data: {
            userId: user.uid,
            userName: user.name,
            userRole: user.role,
            isActive: user.isActive
          }
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedActivities = activities.slice(0, parseInt(limit));

      return h.response({
        success: true,
        data: limitedActivities,
        total: limitedActivities.length
      }).code(200);
    } catch (error) {
      console.error('[ERROR] Recent activities error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }

  // Export data with enhanced functionality
  async exportData(request, h) {
    try {
      console.log('[DEBUG] exportData called');
      
      const { type = 'products', format = 'csv' } = request.query;
      
      let data = [];
      let filename = '';

      if (type === 'products') {
        const result = await productService.getAllProducts();
        data = result.success ? result.data : [];
        filename = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
      } else if (type === 'users') {
        const result = await authService.getAllUsers();
        data = result.success ? result.data : [];
        filename = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
      } else {
        return h.response({
          success: false,
          message: 'Invalid export type. Use "products" or "users"'
        }).code(400);
      }

      if (format === 'csv') {
        const csvContent = convertToCSV(data, type);
        
        return h.response(csvContent)
          .header('Content-Type', 'text/csv; charset=utf-8')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .header('Cache-Control', 'no-cache')
          .code(200);
      } else if (format === 'json') {
        const jsonFilename = filename.replace('.csv', '.json');
        
        return h.response(JSON.stringify(data, null, 2))
          .header('Content-Type', 'application/json')
          .header('Content-Disposition', `attachment; filename="${jsonFilename}"`)
          .header('Cache-Control', 'no-cache')
          .code(200);
      } else {
        return h.response({
          success: false,
          message: 'Unsupported format. Use "csv" or "json"'
        }).code(400);
      }
    } catch (error) {
      console.error('[ERROR] Export data error:', error);
      return h.response({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }).code(500);
    }
  }
}

module.exports = new AdminController();