// ============= controllers/authController.js (Updated) =============
const Joi = require('joi');
const authService = require('../services/authService');
const { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  changePasswordSchema 
} = require('../utils/authValidation');

class AuthController {
  async register(request, h) {
    try {
      const { error, value } = registerSchema.validate(request.payload);
      
      if (error) {
        return h.response({
          success: false,
          message: error.details[0].message
        }).code(400);
      }

      const result = await authService.registerUser(value);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: 'User registered successfully',
        data: result.data
      }).code(201);
    } catch (error) {
      console.error('Register controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async login(request, h) {
    try {
      const { error, value } = loginSchema.validate(request.payload);
      
      if (error) {
        return h.response({
          success: false,
          message: error.details[0].message
        }).code(400);
      }

      const result = await authService.loginUser(value.email, value.password);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(401);
      }

      return h.response({
        success: true,
        message: 'Login successful',
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Login controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // ======= UPDATED: Improved getProfile =======
  async getProfile(request, h) {
    try {
      const result = await authService.getUserProfile(request.auth.uid);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(404);
      }

      return h.response({
        success: true,
        message: 'Profile loaded successfully',
        data: result.data
      }).code(200);
    } catch (error) {
      console.error('Get profile controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // ======= UPDATED: Enhanced updateProfile with preferences =======
  async updateProfile(request, h) {
    try {
      // Extended validation schema untuk frontend compatibility
      const extendedUpdateSchema = updateProfileSchema.keys({
        email: Joi.string().email().optional(),
        notifications: Joi.boolean().optional(),
        newsletter: Joi.boolean().optional()
      });

      const { error, value } = extendedUpdateSchema.validate(request.payload);
      
      if (error) {
        return h.response({
          success: false,
          message: error.details[0].message
        }).code(400);
      }

      // Check if email is being changed and validate uniqueness
      if (value.email) {
        const emailCheck = await authService.checkEmailExists(value.email, request.auth.uid);
        if (!emailCheck.success) {
          return h.response({
            success: false,
            message: emailCheck.error
          }).code(400);
        }
      }

      const result = await authService.updateUserProfile(request.auth.uid, value);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      // Return updated profile data
      const updatedProfile = await authService.getUserProfile(request.auth.uid);

      return h.response({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile.data
      }).code(200);
    } catch (error) {
      console.error('Update profile controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async changePassword(request, h) {
    try {
      const { error, value } = changePasswordSchema.validate(request.payload);
      
      if (error) {
        return h.response({
          success: false,
          message: error.details[0].message
        }).code(400);
      }

      const result = await authService.changePassword(request.auth.uid, value.newPassword);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: result.message
      }).code(200);
    } catch (error) {
      console.error('Change password controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  // ======= UPDATED: Enhanced logout =======
  async logout(request, h) {
    try {
      const result = await authService.logoutUser(request.auth.uid);

      return h.response({
        success: true,
        message: 'Logout successful'
      }).code(200);
    } catch (error) {
      console.error('Logout controller error:', error);
      // Return success even if there's an error on server side
      return h.response({
        success: true,
        message: 'Logout successful'
      }).code(200);
    }
  }

  // Admin endpoints
  async getAllUsers(request, h) {
    try {
      const result = await authService.getAllUsers();

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(500);
      }

      return h.response({
        success: true,
        data: result.data,
        total: result.data.length
      }).code(200);
    } catch (error) {
      console.error('Get users controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }

  async toggleUserStatus(request, h) {
    try {
      const { uid } = request.params;
      
      // Prevent admin from deactivating themselves
      if (uid === request.auth.uid) {
        return h.response({
          success: false,
          message: 'Cannot deactivate your own account'
        }).code(400);
      }
      
      const result = await authService.toggleUserStatus(uid);

      if (!result.success) {
        return h.response({
          success: false,
          message: result.error
        }).code(400);
      }

      return h.response({
        success: true,
        message: result.message
      }).code(200);
    } catch (error) {
      console.error('Toggle user status controller error:', error);
      return h.response({
        success: false,
        message: 'Internal server error'
      }).code(500);
    }
  }
}

module.exports = new AuthController();