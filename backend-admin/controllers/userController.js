// controllers/userController.js (UPDATED)
const authService = require('../services/authService');
const userService = require('../services/userService'); // Import yang sekarang tersedia

class UserController {
  // Get user details by ID (admin only)
  async getUserDetails(request, h) {
    try {
      const { userId } = request.params;
      
      const result = await authService.getUserProfile(userId);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(404);
      }

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get user details error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Get user favorites
  async getUserFavorites(request, h) {
    try {
      const result = await userService.getUserFavorites(request.auth.uid);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get favorites error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Add to favorites
  async addToFavorites(request, h) {
    try {
      const { productId } = request.payload;
      
      if (!productId) {
        return h.response({
          success: false,
          message: 'Product ID is required'
        }).code(400);
      }

      const result = await userService.addToFavorites(request.auth.uid, productId);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: 'Added to favorites',
        data: result.data
      }).code(201);
    } catch (error) {
      console.error('Add to favorites error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Remove from favorites
  async removeFromFavorites(request, h) {
    try {
      const { productId } = request.params;
      
      const result = await userService.removeFromFavorites(request.auth.uid, productId);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(404);
      }

      return h.response({
        success: true,
        message: result.message
      }).code(200);
    } catch (error) {
      console.error('Remove from favorites error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Get user cart
  async getUserCart(request, h) {
    try {
      const result = await userService.getUserCart(request.auth.uid);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get cart error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Add to cart
  async addToCart(request, h) {
    try {
      const { productId, quantity = 1 } = request.payload;
      
      if (!productId) {
        return h.response({
          success: false,
          message: 'Product ID is required'
        }).code(400);
      }

      const result = await userService.addToCart(request.auth.uid, productId, quantity);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: 'Added to cart',
        data: result.data
      }).code(201);
    } catch (error) {
      console.error('Add to cart error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Remove from cart
  async removeFromCart(request, h) {
    try {
      const { productId } = request.params;
      
      const result = await userService.removeFromCart(request.auth.uid, productId);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(404);
      }

      return h.response({
        success: true,
        message: result.message
      }).code(200);
    } catch (error) {
      console.error('Remove from cart error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Get user orders
  async getUserOrders(request, h) {
    try {
      const result = await userService.getUserOrders(request.auth.uid);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get orders error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // Create order
  async createOrder(request, h) {
    try {
      const orderData = request.payload;
      
      if (!orderData.items || !orderData.totalAmount) {
        return h.response({
          success: false,
          message: 'Items and total amount are required'
        }).code(400);
      }

      const result = await userService.createOrder(request.auth.uid, orderData);
      
      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: 'Order created successfully',
        data: result.data
      }).code(201);
    } catch (error) {
      console.error('Create order error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }
}

module.exports = new UserController();