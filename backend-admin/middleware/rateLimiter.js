// Rate limiting untuk keamanan API
const rateLimitStore = new Map();

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (request) => request.info.remoteAddress
  } = options;

  return async (request, h) => {
    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    let requests = rateLimitStore.get(key);
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return h.response({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      }).code(429).takeover();
    }

    // Add current request
    requests.push(now);
    rateLimitStore.set(key, requests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - windowMs;
      for (const [storeKey, timestamps] of rateLimitStore.entries()) {
        const filtered = timestamps.filter(timestamp => timestamp > cutoff);
        if (filtered.length === 0) {
          rateLimitStore.delete(storeKey);
        } else {
          rateLimitStore.set(storeKey, filtered);
        }
      }
    }

    return h.continue;
  };
};

// Specific rate limiters for different endpoints
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.'
});

const generalRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});

module.exports = {
  rateLimiter,
  authRateLimit,
  generalRateLimit
};
