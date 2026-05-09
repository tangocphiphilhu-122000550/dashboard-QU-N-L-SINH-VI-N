import crypto from 'crypto';

// Check if we're in production (HTTPS) or development (HTTP)
// For Render.com or any HTTPS deployment, we need secure cookies
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.FRONTEND_URL?.includes('https://') ||
                     process.env.PORT; // If PORT is set, likely production

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

// Extract root domain from URL (e.g., 'dashboard.shopsheap.online' -> '.shopsheap.online')
const getRootDomain = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    // If has at least 2 parts (e.g., 'shopsheap.online'), return root domain with dot
    if (parts.length >= 2) {
      const rootDomain = '.' + parts.slice(-2).join('.');
      return rootDomain;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const setCsrfCookie = (res, token, req = null) => {
  // For production (HTTPS), use secure: true and sameSite: 'none'
  // For development (HTTP), use secure: false and sameSite: 'lax'
  const cookieOptions = {
    httpOnly: false, // must be readable by client to send back in header
    secure: isProduction, // true for HTTPS, false for HTTP
    sameSite: isProduction ? 'none' : 'lax', // 'none' requires secure: true
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // align with refresh token lifetime
  };
  
  // If sameSite is 'none', secure must be true
  if (cookieOptions.sameSite === 'none' && !cookieOptions.secure) {
    cookieOptions.secure = true;
  }
  
  // Set domain for cross-subdomain cookie sharing
  // Try to get root domain from request origin or FRONTEND_URL
  let rootDomain = null;
  if (req && req.headers.origin) {
    rootDomain = getRootDomain(req.headers.origin);
    console.log('🌐 Detected root domain from origin:', rootDomain);
  }
  if (!rootDomain && process.env.FRONTEND_URL) {
    rootDomain = getRootDomain(process.env.FRONTEND_URL);
    console.log('🌐 Detected root domain from FRONTEND_URL:', rootDomain);
  }
  
  // Always clear old cookie first (with and without domain) to ensure it's replaced
  // This is important because browser might have old cookie with different domain
  res.clearCookie('csrf_token', { path: '/', domain: undefined });
  if (rootDomain) {
    res.clearCookie('csrf_token', { path: '/', domain: rootDomain });
    res.clearCookie('csrf_token', { path: '/', domain: rootDomain.replace(/^\./, '') }); // Also try without leading dot
  }
  
  // Set new cookie with domain if we have root domain
  if (rootDomain && isProduction) {
    cookieOptions.domain = rootDomain; // e.g., '.shopsheap.online'
  }
  
  console.log('🍪 Setting CSRF cookie with options:', {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    isProduction,
    domain: cookieOptions.domain || 'not set',
    origin: req?.headers?.origin,
    tokenPreview: token.substring(0, 20) + '...'
  });
  
  res.cookie('csrf_token', token, cookieOptions);
};

export const csrfProtection = (req, res, next) => {
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  console.log('🔒 CSRF validation check:', {
    path: req.path,
    method: req.method,
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    cookieTokenPreview: cookieToken ? cookieToken.substring(0, 20) + '...' : null,
    headerTokenPreview: headerToken ? headerToken.substring(0, 20) + '...' : null,
    tokensMatch: cookieToken === headerToken,
    allCookies: Object.keys(req.cookies || {})
  });

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.error('❌ CSRF validation failed:', {
      missingCookie: !cookieToken,
      missingHeader: !headerToken,
      mismatch: cookieToken !== headerToken
    });
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }

  console.log('✅ CSRF validation passed');
  next();
};

export default {
  generateCsrfToken,
  setCsrfCookie,
  csrfProtection
};

