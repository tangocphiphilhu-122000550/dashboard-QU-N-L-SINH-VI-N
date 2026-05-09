import rateLimit from 'express-rate-limit';

// General purpose limiter
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please slow down and try again later.'
  }
});

// Stricter limiter for login to mitigate brute-force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts',
    message: 'Please wait a few minutes before trying again.'
  }
});

// Limiter for registration to prevent abuse
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registrations',
    message: 'Please try again later.'
  }
});

// Limiter for refresh token endpoint
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many refresh requests',
    message: 'Please slow down and try again.'
  }
});

// Limiter for forgot password to prevent email spam and brute force
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many password reset requests',
    message: 'Vui lòng đợi một lúc trước khi thử lại.'
  }
});

export default {
  defaultLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter
};

