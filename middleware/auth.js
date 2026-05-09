import { verifyAccessToken, decodeAccessToken } from '../utils/jwt.js';
import { getPool, sql } from '../config/database.js';

/**
 * Middleware để verify JWT token từ request header
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token không được cung cấp'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token với JWT
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

      // Lấy thông tin user từ database
      try {
        const pool = await getPool();
        const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, decoded.userId)
        .query('SELECT id, role FROM users WHERE id = @user_id');

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User không tồn tại'
        });
      }

      // Check session exists, is active, and not expired
      // We check both JWT signature (above) and database timestamp (here)
      const sessionResult = await pool.request()
        .input('token', sql.NVarChar(sql.MAX), token)
        .query('SELECT id FROM user_sessions WHERE access_token = @token AND is_active = 1 AND token_expires_at > GETDATE()');

      if (!sessionResult.recordset || sessionResult.recordset.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Session không tồn tại, đã hết hạn hoặc đã bị đăng xuất'
        });
      }

      // Lưu user vào request để sử dụng trong routes
      req.user = {
        userId: result.recordset[0].id,
        role: result.recordset[0].role
      };
      req.token = token;
      
      next();
    } catch (dbError) {
      console.error('Database error in verifyToken:', dbError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Lỗi database'
      });
    }
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message
    });
  }
};

/**
 * Middleware để check role
 */
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Vui lòng đăng nhập'
        });
      }

      const userRole = req.user.role || 'sinh_vien';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Bạn không có quyền truy cập'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Server error',
        message: error.message
      });
    }
  };
};

/**
 * Middleware để verify access token nhưng cho phép expired token
 * Dùng cho refresh-token endpoint để verify token signature và user
 */
export const verifyTokenAllowExpired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token không được cung cấp'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Decode token (allows expired tokens, but verifies signature)
    const decoded = decodeAccessToken(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token không hợp lệ'
      });
    }

    // Lấy thông tin user từ database
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, decoded.userId)
        .query('SELECT id, role FROM users WHERE id = @user_id');

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User không tồn tại'
        });
      }

      // Check session exists (even if expired)
      const sessionResult = await pool.request()
        .input('token', sql.NVarChar(sql.MAX), token)
        .query('SELECT id, is_active FROM user_sessions WHERE access_token = @token');

      if (!sessionResult.recordset || sessionResult.recordset.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Session không tồn tại'
        });
      }

      // Lưu user và token vào request
      req.user = {
        userId: result.recordset[0].id,
        role: result.recordset[0].role
      };
      req.token = token;
      req.oldSessionId = sessionResult.recordset[0].id;
      req.isTokenExpired = decoded.exp ? decoded.exp < Math.floor(Date.now() / 1000) : false;
      
      next();
    } catch (dbError) {
      console.error('Database error in verifyTokenAllowExpired:', dbError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Lỗi database'
      });
    }
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message
    });
  }
};

export default {
  verifyToken,
  verifyTokenAllowExpired,
  checkRole
};