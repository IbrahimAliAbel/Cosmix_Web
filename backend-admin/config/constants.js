// Constants untuk aplikasi
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const PRODUCT_CATEGORIES = {
  KAOS: 'kaos',
  FULLSET: 'fullset', 
  KEMEJA: 'kemeja',
  HOODIE: 'hoodie'
};

const JWT_EXPIRES_IN = '7d';

const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

const API_LIMITS = {
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX: 5
};

const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PRODUCT_NAME_MIN: 3,
  PRODUCT_NAME_MAX: 100,
  PRODUCT_DESC_MIN: 10,
  PRODUCT_DESC_MAX: 500
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  FILE_TOO_LARGE: 'File size too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  INVALID_CATEGORY: 'Invalid product category'
};

module.exports = {
  USER_ROLES,
  PRODUCT_CATEGORIES,
  JWT_EXPIRES_IN,
  UPLOAD_LIMITS,
  API_LIMITS,
  VALIDATION_RULES,
  ERROR_MESSAGES
};