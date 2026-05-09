import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

/**
 * Generate access token (expires in 30 minutes)
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
};

/**
 * Generate refresh token (expires in 30 days)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Verify access token (strict - fails if expired)
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decode access token without verification (allows expired tokens)
 * Used for refresh token endpoint to verify token signature and get user info
 */
export const decodeAccessToken = (token) => {
  try {
    // Decode without verification to allow expired tokens
    // But still verify signature to ensure token is valid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return null;
    
    // Verify signature only (ignore expiration)
    jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    return decoded.payload;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeAccessToken
};
