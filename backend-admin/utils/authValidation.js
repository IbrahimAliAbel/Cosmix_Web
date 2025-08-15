// ============= utils/authValidation.js (Updated) =============
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// ======= UPDATED: Enhanced updateProfileSchema =======
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  notifications: Joi.boolean().optional(),
  newsletter: Joi.boolean().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// ======= NEW: Additional validation schemas =======
const profilePreferencesSchema = Joi.object({
  notifications: Joi.boolean().required(),
  newsletter: Joi.boolean().required()
});

const emailUpdateSchema = Joi.object({
  email: Joi.string().email().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  profilePreferencesSchema,
  emailUpdateSchema
};