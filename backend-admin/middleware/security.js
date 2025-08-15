// Security middleware untuk headers dan validasi
const securityHeaders = async (request, h) => {
  const response = request.response;
  
  if (response.isBoom) {
    return h.continue;
  }

  // Set security headers
  response.header('X-Content-Type-Options', 'nosniff');
  response.header('X-Frame-Options', 'DENY');
  response.header('X-XSS-Protection', '1; mode=block');
  response.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return h.continue;
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};

const sanitizePayload = async (request, h) => {
  if (request.payload && typeof request.payload === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(request.payload)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    request.payload = sanitized;
  }
  
  return h.continue;
};

module.exports = {
  securityHeaders,
  sanitizePayload,
  sanitizeInput
};