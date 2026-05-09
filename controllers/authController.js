import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../config/database.js';
import { sendMSSVEmail, sendResetPasswordEmail } from '../utils/emailService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ensureActivityTrackingColumns, updateUserLastActive } from '../utils/activityService.js';

// Cookie options for refresh token (HTTP-only)
const isProduction = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction, // should be true on HTTPS
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : value);

/**
 * Register - Đăng ký tài khoản mới
 * Sinh viên cần: email, password, full_name, class_name
 * Kiểm tra full_name và class_name có trong danh sách lớp không
 * Lấy StudentID từ bảng class làm MSSV
 * Mặc định role = "sinh_vien"
 * Gửi MSSV qua email mà user đã nhập
 */
export const register = async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const password = sanitizeString(req.body.password);
    const full_name = sanitizeString(req.body.full_name);
    const class_name = sanitizeString(req.body.class_name);
    const role = sanitizeString(req.body.role);

    // Validation - Sinh viên cần email, password, full_name, class_name
    // NOTE: password từ frontend đã được hash bằng SHA-256 (64 ký tự hex)
    if (!email || !password || !full_name || !class_name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, full_name và class_name là bắt buộc'
      });
    }

    // Validate SHA-256 hash format (64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(password)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password không đúng định dạng (phải là SHA-256 hash)'
      });
    }

    // Mặc định role = "sinh_vien"
    const userRole = role || 'sinh_vien';
    
    // KIỂM TRA: full_name và class_name có trong danh sách lớp không
    if (userRole === 'sinh_vien') {
      // Check trong bảng class: LopID = class_name và HoTenSV = full_name
      const pool = await getPool();
      const classCheckResult = await pool.request()
        .input('class_name', sql.NVarChar(20), class_name)
        .input('full_name', sql.NVarChar(255), full_name)
        .query('SELECT id, StudentID FROM class WHERE LopID = @class_name AND HoTenSV = @full_name');

      if (!classCheckResult.recordset || classCheckResult.recordset.length === 0) {
        return res.status(403).json({
          error: 'Registration denied',
          message: 'Bạn không có trong danh sách lớp học này'
        });
      }

      // Lấy StudentID từ bảng class làm MSSV
      const mssv = classCheckResult.recordset[0].StudentID;

      // Kiểm tra MSSV (StudentID) đã được sử dụng chưa (đã có user nào đăng ký với MSSV này chưa)
      const existingMSSVResult = await pool.request()
        .input('mssv', sql.NVarChar(20), mssv)
        .query('SELECT id FROM users WHERE mssv = @mssv');
      
      if (existingMSSVResult.recordset.length > 0) {
        return res.status(400).json({
          error: 'Registration failed',
          message: 'MSSV này đã được đăng ký'
        });
      }

      // Kiểm tra email đã được sử dụng bởi tài khoản khác chưa
      const existingUserResult = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query('SELECT id FROM users WHERE email = @email');
      
      if (existingUserResult.recordset.length > 0) {
        return res.status(400).json({
          error: 'Registration failed',
          message: 'Email đã được sử dụng'
        });
      }

      // Hash password với bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Lưu user vào database
      const insertResult = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .input('mssv', sql.NVarChar(20), mssv)
        .input('full_name', sql.NVarChar(255), full_name)
        .input('password', sql.NVarChar(255), passwordHash)
        .input('class_id', sql.Int, classCheckResult.recordset[0].id)
        .input('role', sql.NVarChar(20), userRole)
        .query(`
          INSERT INTO users (email, mssv, full_name, password, class_id, role)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.mssv, INSERTED.full_name, INSERTED.role, INSERTED.created_at
          VALUES (@email, @mssv, @full_name, @password, @class_id, @role)
        `);

      const newUser = insertResult.recordset[0];

      // Gửi email MSSV cho sinh viên
      if (mssv) {
        try {
          await sendMSSVEmail(email, full_name, mssv);
          console.log(`✅ MSSV ${mssv} sent to ${email}`);
        } catch (emailError) {
          console.error('Error sending MSSV email:', emailError);
          // Không fail registration nếu không gửi được email
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công! MSSV đã được gửi đến email của bạn.',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            mssv: newUser.mssv,
            full_name: newUser.full_name,
            role: newUser.role
          }
        }
      });
    } else {
      // Cho giảng viên và quản lý ngành đăng ký mà không cần kiểm tra class
      const pool = await getPool();
      const existingUserResult = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query('SELECT id FROM users WHERE email = @email');
      
      if (existingUserResult.recordset.length > 0) {
        return res.status(400).json({
          error: 'Registration failed',
          message: 'Email đã được sử dụng'
        });
      }

      // Hash password với bcrypt
      // NOTE: password từ frontend đã là SHA-256 hash, nên lưu bcrypt(SHA-256(password)) vào DB
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Lưu user vào database (không có class_id cho giảng viên)
      const insertResult = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .input('mssv', sql.NVarChar(20), null)
        .input('full_name', sql.NVarChar(255), full_name)
        .input('password', sql.NVarChar(255), passwordHash)
        .input('role', sql.NVarChar(20), userRole)
        .query(`
          INSERT INTO users (email, mssv, full_name, password, role)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.mssv, INSERTED.full_name, INSERTED.role, INSERTED.created_at
          VALUES (@email, @mssv, @full_name, @password, @role)
        `);

      const newUser = insertResult.recordset[0];

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công!',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            mssv: newUser.mssv,
            full_name: newUser.full_name,
            role: newUser.role
          }
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    
    // Check for duplicate email or mssv (SQL Server error code 2627)
    if (error.number === 2627) { // SQL Server unique violation
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message.includes('email') || error.message.includes('users_email')
          ? 'Email đã tồn tại'
          : 'MSSV đã tồn tại'
      });
    }
    
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Login - Đăng nhập
 * Có thể login bằng email hoặc MSSV
 */
export const login = async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const mssv = sanitizeString(req.body.mssv);
    const password = sanitizeString(req.body.password);

    // Validation
    // NOTE: password từ frontend đã được hash bằng SHA-256 (64 ký tự hex)
    if (!password || (!email && !mssv)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email hoặc MSSV và password là bắt buộc'
      });
    }

    // Validate SHA-256 hash format (64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(password)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password không đúng định dạng (phải là SHA-256 hash)'
      });
    }

    // Tìm user bằng email hoặc MSSV
    const pool = await getPool();
    let user;
    if (mssv && !email) {
      // Login bằng MSSV
      const result = await pool.request()
        .input('mssv', sql.NVarChar(20), mssv)
        .query(`
          SELECT u.id, u.email, u.mssv, u.full_name, u.password, u.role, c.LopID as class_name 
          FROM users u 
          LEFT JOIN class c ON u.class_id = c.id 
          WHERE u.mssv = @mssv
        `);
      user = result.recordset[0];
    } else {
      // Login bằng email
      const result = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query(`
          SELECT u.id, u.email, u.mssv, u.full_name, u.password, u.role, c.LopID as class_name 
          FROM users u 
          LEFT JOIN class c ON u.class_id = c.id 
          WHERE u.email = @email
        `);
      user = result.recordset[0];
    }

    // Check user exists
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Email/MSSV hoặc password không đúng'
      });
    }

    // Verify password
    // NOTE: password từ frontend đã là SHA-256 hash
    // DB lưu bcrypt(SHA-256(password)) cho user mới, hoặc bcrypt(plaintext) cho user cũ
    // So sánh SHA-256(password) với bcrypt hash trong DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt for security monitoring
      console.warn(`⚠️ Failed login attempt for ${email || mssv} at ${new Date().toISOString()}`);
      
      return res.status(401).json({
        error: 'Login failed',
        message: 'Email/MSSV hoặc password không đúng'
      });
    }

    await ensureActivityTrackingColumns();

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Decode JWT để lấy thời gian hết hạn từ token
    const accessTokenDecoded = jwt.decode(accessToken);
    const refreshTokenDecoded = jwt.decode(refreshToken);
    
    // Tính toán thời gian hết hạn từ JWT (exp is in seconds)
    // Convert sang giờ VN (UTC+7) để lưu vào database
    const tokenExpiresAtUTC = new Date(accessTokenDecoded.exp * 1000);
    const refreshTokenExpiresAtUTC = new Date(refreshTokenDecoded.exp * 1000);
    
    const tokenExpiresAt = new Date(tokenExpiresAtUTC.getTime() + 7 * 60 * 60 * 1000);
    const refreshTokenExpiresAt = new Date(refreshTokenExpiresAtUTC.getTime() + 7 * 60 * 60 * 1000);

    // Lưu session vào database (đã convert sang giờ VN)
    try {
      await pool.request()
        .input('user_id', sql.UniqueIdentifier, user.id)
        .input('access_token', sql.NVarChar(sql.MAX), accessToken)
        .input('refresh_token', sql.NVarChar(sql.MAX), refreshToken)
        .input('token_expires_at', sql.DateTime2, tokenExpiresAt.toISOString())
        .input('refresh_token_expires_at', sql.DateTime2, refreshTokenExpiresAt.toISOString())
        .query(`
          INSERT INTO user_sessions 
          (user_id, access_token, refresh_token, token_expires_at, refresh_token_expires_at)
          VALUES (@user_id, @access_token, @refresh_token, @token_expires_at, @refresh_token_expires_at)
        `);
    } catch (sessionError) {
      console.warn('Warning: Could not insert into user_sessions table:', sessionError.message);
    }

    try {
      await updateUserLastActive(user.id);
    } catch (activityError) {
      console.warn('Warning: Could not update last_active on login:', activityError.message);
    }

    // Remove password from response
    delete user.password;

    // Set refresh token as HTTP-only cookie
    res.cookie('refresh_token', refreshToken, refreshCookieOptions);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          mssv: user.mssv,
          full_name: user.full_name,
          class: user.class_name || null
        },
        access_token: accessToken
        // refresh_token stored in cookie
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Get Current User - Lấy thông tin user hiện tại
 */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Vui lòng đăng nhập'
      });
    }

    // Lấy thông tin user từ database
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.UniqueIdentifier, req.user.userId)
      .query(`
        SELECT
          u.id,
          u.email,
          u.mssv,
          u.full_name,
          u.phone,
          u.address,
          u.class_id,
          u.created_at,
          c.LopID AS class_name
        FROM users u
        LEFT JOIN class c ON u.class_id = c.id
        WHERE u.id = @user_id
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User không tồn tại'
      });
    }

    const user = result.recordset[0];

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          mssv: user.mssv,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          class_id: user.class_id,
          lop: user.class_name || null,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Activity Heartbeat - cập nhật last_active cho user đang online
 * FE có thể gọi mỗi 10 giây khi app đang mở
 */
export const heartbeat = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.json(false);
    }

    await updateUserLastActive(req.user.userId);
    return res.json(true);
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.json(false);
  }
};

/**
 * Logout - Đăng xuất (xóa session hiện tại)
 */
export const logout = async (req, res) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Vui lòng đăng nhập'
      });
    }

    // Xóa session khỏi database (hard delete để bảo mật)
    try {
      const pool = await getPool();
      await pool.request()
        .input('token', sql.NVarChar(sql.MAX), token)
        .query('DELETE FROM user_sessions WHERE access_token = @token');
      console.log('✅ Session deleted successfully from database');
    } catch (sessionError) {
      console.warn('Warning: Could not delete session from user_sessions table:', sessionError.message);
    }

    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    return res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Forgot Password - Gửi email reset password
 */
export const forgotPassword = async (req, res) => {
  try {
    // Sanitize và validate email
    const email = sanitizeString(req.body.email);

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email là bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // Log suspicious activity
      console.warn(`⚠️ Invalid email format attempted: ${email} from IP: ${req.ip} at ${new Date().toISOString()}`);
      // Return same message to prevent email enumeration
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu'
      });
    }

    // Limit email length to prevent abuse
    if (email.length > 255) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email không hợp lệ'
      });
    }

    // Tìm user trong database
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT id, email, full_name FROM users WHERE email = @email');

    const user = result.recordset[0];

    // Không báo lỗi nếu email không tồn tại để tránh brute force và email enumeration
    if (!user) {
      // Log request for security monitoring (but don't reveal if email exists)
      console.log(`📧 Password reset requested for non-existent email from IP: ${req.ip} at ${new Date().toISOString()}`);
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu'
      });
    }

    // Xóa các token reset password cũ của user này (chưa sử dụng và chưa hết hạn)
    // Để tránh tích lũy nhiều token
    await pool.request()
      .input('user_id', sql.UniqueIdentifier, user.id)
      .query('DELETE FROM password_resets WHERE user_id = @user_id AND is_used = 0 AND expires_at > GETDATE()');

    // Tạo token reset password mới
    const resetToken = crypto.randomBytes(32).toString('hex'); // 64 ký tự hex
    // Convert sang giờ VN (UTC+7) để lưu vào database
    const expiresAtUTC = new Date(Date.now() + 15 * 60 * 1000); // 15 phút từ bây giờ (UTC)
    const expiresAt = new Date(expiresAtUTC.getTime() + 7 * 60 * 60 * 1000); // Cộng 7 giờ để chuyển sang giờ VN

    // Log token để debug
    console.log(`🔑 Generated reset token: ${resetToken.substring(0, 10)}... (length: ${resetToken.length}), expires at: ${expiresAt.toISOString()}`);

    // Lưu token vào database
    await pool.request()
      .input('user_id', sql.UniqueIdentifier, user.id)
      .input('token', sql.NVarChar(255), resetToken)
      .input('expires_at', sql.DateTime2, expiresAt.toISOString())
      .query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (@user_id, @token, @expires_at)');
    
    // Verify token was saved correctly
    const verifyToken = await pool.request()
      .input('token', sql.NVarChar(255), resetToken)
      .query('SELECT token, LEN(token) as token_length FROM password_resets WHERE token = @token');
    
    if (verifyToken.recordset.length > 0) {
      const savedToken = verifyToken.recordset[0];
      console.log(`✅ Token saved to DB: ${savedToken.token.substring(0, 10)}... (length: ${savedToken.token_length})`);
    }

    // Log successful request for security monitoring
    console.log(`✅ Password reset token created for user: ${user.email} (ID: ${user.id}) from IP: ${req.ip} at ${new Date().toISOString()}`);

    // Gửi email reset password
    try {
      const emailResult = await sendResetPasswordEmail(user.email, user.full_name, resetToken);
      if (emailResult.success) {
        console.log(`📧 Reset password email sent to ${user.email}`);
        console.log(`   MessageId: ${emailResult.messageId}`);
        console.log(`   Response: ${emailResult.response || 'N/A'}`);
      } else {
        console.error(`❌ Failed to send reset password email to ${user.email}:`);
        console.error(`   Error: ${emailResult.message}`);
        if (emailResult.error) {
          console.error(`   Code: ${emailResult.error.code || 'N/A'}`);
          console.error(`   Response: ${emailResult.error.response || 'N/A'}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending reset password email:', emailError);
      // Không fail nếu không gửi được email (có thể do config)
      // Nhưng vẫn log để admin biết
    }

    return res.json({
      success: true,
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    // Log error with IP for security monitoring
    console.error(`Error details - IP: ${req.ip}, Time: ${new Date().toISOString()}, Error: ${error.message}`);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Verify Reset Token - Kiểm tra token reset password có hợp lệ không
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Token không được cung cấp'
      });
    }

    // Sanitize token (trim whitespace)
    const sanitizedToken = token.trim();

    // Log để debug
    console.log(`🔍 Verifying reset token: ${sanitizedToken.substring(0, 10)}... (length: ${sanitizedToken.length})`);

    // Tìm token trong database và kiểm tra hết hạn bằng SQL Server (để đảm bảo timezone đúng)
    const pool = await getPool();
    const result = await pool.request()
      .input('token', sql.NVarChar(255), sanitizedToken)
      .query('SELECT id, user_id, expires_at, is_used FROM password_resets WHERE token = @token AND expires_at > GETDATE()');

    const resetRecord = result.recordset[0];

    // Kiểm tra token có tồn tại và chưa hết hạn không
    if (!resetRecord) {
      // Check xem token có tồn tại nhưng đã hết hạn không
      const checkExpired = await pool.request()
        .input('token', sql.NVarChar(255), sanitizedToken)
        .query('SELECT id, is_used, expires_at FROM password_resets WHERE token = @token');
      
      if (checkExpired.recordset.length > 0) {
        const record = checkExpired.recordset[0];
        console.log(`⚠️ Token found but expired or invalid. Expires at: ${record.expires_at}, Current: ${new Date().toISOString()}, Is used: ${record.is_used}`);
        if (record.is_used) {
          return res.status(400).json({
            error: 'Token already used',
            message: 'Token này đã được sử dụng'
          });
        } else {
          return res.status(400).json({
            error: 'Token expired',
            message: 'Token đã hết hạn'
          });
        }
      }
      
      console.log(`❌ Token not found in database: ${sanitizedToken.substring(0, 10)}...`);
      return res.status(404).json({
        error: 'Invalid token',
        message: 'Token không hợp lệ hoặc không tồn tại'
      });
    }

    // Kiểm tra token đã được sử dụng chưa
    if (resetRecord.is_used) {
      return res.status(400).json({
        error: 'Token already used',
        message: 'Token này đã được sử dụng'
      });
    }

    console.log(`✅ Token is valid. User ID: ${resetRecord.user_id}, Expires at: ${resetRecord.expires_at}`);
    // Token hợp lệ
    return res.json({
      success: true,
      message: 'Token hợp lệ',
      valid: true
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Reset Password - Đặt lại mật khẩu mới
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validation
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Token, password và confirmPassword là bắt buộc'
      });
    }

    // NOTE: password và confirmPassword từ frontend đã được hash bằng SHA-256 (64 ký tự hex)
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password và confirmPassword không khớp'
      });
    }

    // Validate SHA-256 hash format (64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(password)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password không đúng định dạng (phải là SHA-256 hash)'
      });
    }

    // Sanitize token (trim whitespace)
    const sanitizedToken = token.trim();
    
    // Log để debug
    console.log(`🔍 Resetting password with token: ${sanitizedToken.substring(0, 10)}... (length: ${sanitizedToken.length})`);

    // Tìm token trong database và kiểm tra hết hạn bằng SQL Server (để đảm bảo timezone đúng)
    const pool = await getPool();
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar(255), sanitizedToken)
      .query('SELECT id, user_id, expires_at, is_used FROM password_resets WHERE token = @token AND expires_at > GETDATE()');

    const resetRecord = tokenResult.recordset[0];

    // Kiểm tra token có tồn tại và chưa hết hạn không
    if (!resetRecord) {
      // Check xem token có tồn tại nhưng đã hết hạn không
      const checkExpired = await pool.request()
        .input('token', sql.NVarChar(255), sanitizedToken)
        .query('SELECT id, is_used, expires_at FROM password_resets WHERE token = @token');
      
      if (checkExpired.recordset.length > 0) {
        const record = checkExpired.recordset[0];
        console.log(`⚠️ Token found but expired or invalid. Expires at: ${record.expires_at}, Current: ${new Date().toISOString()}, Is used: ${record.is_used}`);
        if (record.is_used) {
          return res.status(400).json({
            error: 'Token already used',
            message: 'Token này đã được sử dụng'
          });
        } else {
          return res.status(400).json({
            error: 'Token expired',
            message: 'Token đã hết hạn'
          });
        }
      }
      
      console.log(`❌ Token not found in database: ${sanitizedToken.substring(0, 10)}...`);
      return res.status(404).json({
        error: 'Invalid token',
        message: 'Token không hợp lệ hoặc không tồn tại'
      });
    }

    // Kiểm tra token đã được sử dụng chưa
    if (resetRecord.is_used) {
      return res.status(400).json({
        error: 'Token already used',
        message: 'Token này đã được sử dụng'
      });
    }

    console.log(`✅ Token is valid for reset. User ID: ${resetRecord.user_id}, Expires at: ${resetRecord.expires_at}`);
    // Hash password mới
    // NOTE: password từ frontend đã là SHA-256 hash, nên lưu bcrypt(SHA-256(password)) vào DB
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Cập nhật password mới cho user
    await pool.request()
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('user_id', sql.UniqueIdentifier, resetRecord.user_id)
      .query('UPDATE users SET password = @password, updated_at = GETDATE() WHERE id = @user_id');

    // Đánh dấu token đã được sử dụng
    await pool.request()
      .input('id', sql.UniqueIdentifier, resetRecord.id)
      .query('UPDATE password_resets SET is_used = 1 WHERE id = @id');

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

/**
 * Refresh Token - Làm mới access token khi token hết hạn
 * Requires: Access token (even if expired) + Refresh token cookie for security
 */
export const refreshToken = async (req, res) => {
  try {
    // Access token is already verified by verifyTokenAllowExpired middleware
    // req.user and req.token are available from middleware
    const oldAccessToken = req.token;
    const userId = req.user.userId;
    const isTokenExpired = req.isTokenExpired;

    // Get refresh token from cookie (HTTP-only)
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Refresh token là bắt buộc'
      });
    }

    // Verify refresh token
    const decodedRefresh = verifyRefreshToken(refresh_token);
    
    if (!decodedRefresh) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Verify access token and refresh token belong to same user
    if (decodedRefresh.userId !== userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token và refresh token không khớp'
      });
    }

    const pool = await getPool();

    // Check old session exists with old access token
    const oldSessionResult = await pool.request()
      .input('access_token', sql.NVarChar(sql.MAX), oldAccessToken)
      .query('SELECT id, user_id, refresh_token FROM user_sessions WHERE access_token = @access_token');

    if (!oldSessionResult.recordset || oldSessionResult.recordset.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session cũ không tồn tại'
      });
    }

    const oldSession = oldSessionResult.recordset[0];

    // Verify refresh token matches old session
    if (oldSession.refresh_token !== refresh_token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token không khớp với session'
      });
    }

    // Check refresh token is still valid
    const refreshTokenCheck = await pool.request()
      .input('refresh_token', sql.NVarChar(sql.MAX), refresh_token)
      .query('SELECT id FROM user_sessions WHERE refresh_token = @refresh_token AND refresh_token_expires_at > GETDATE()');

    if (!refreshTokenCheck.recordset || refreshTokenCheck.recordset.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token đã hết hạn'
      });
    }

    // Get user info to generate new tokens
    const userResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('SELECT id, role FROM users WHERE id = @user_id');

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // Decode new tokens to get expiry times
    const newAccessTokenDecoded = jwt.decode(newAccessToken);
    const newRefreshTokenDecoded = jwt.decode(newRefreshToken);
    
    // Convert sang giờ VN (UTC+7) để lưu vào database
    const tokenExpiresAtUTC = new Date(newAccessTokenDecoded.exp * 1000);
    const refreshTokenExpiresAtUTC = new Date(newRefreshTokenDecoded.exp * 1000);
    
    const tokenExpiresAt = new Date(tokenExpiresAtUTC.getTime() + 7 * 60 * 60 * 1000);
    const refreshTokenExpiresAt = new Date(refreshTokenExpiresAtUTC.getTime() + 7 * 60 * 60 * 1000);

    // Deactivate old session (set is_active = false)
    await pool.request()
      .input('old_session_id', sql.UniqueIdentifier, oldSession.id)
      .query('UPDATE user_sessions SET is_active = 0, updated_at = GETDATE() WHERE id = @old_session_id');

    // Update session with new tokens (đã convert sang giờ VN)
    await pool.request()
      .input('access_token', sql.NVarChar(sql.MAX), newAccessToken)
      .input('refresh_token', sql.NVarChar(sql.MAX), newRefreshToken)
      .input('token_expires_at', sql.DateTime2, tokenExpiresAt.toISOString())
      .input('refresh_token_expires_at', sql.DateTime2, refreshTokenExpiresAt.toISOString())
      .input('old_refresh_token', sql.NVarChar(sql.MAX), refresh_token)
      .query(`
        UPDATE user_sessions 
        SET access_token = @access_token, refresh_token = @refresh_token, token_expires_at = @token_expires_at, refresh_token_expires_at = @refresh_token_expires_at, is_active = 1, updated_at = GETDATE()
        WHERE refresh_token = @old_refresh_token
      `);

    // Set new refresh token cookie
    res.cookie('refresh_token', newRefreshToken, refreshCookieOptions);

    return res.json({
      success: true,
      message: 'Token đã được làm mới',
      data: {
        access_token: newAccessToken
        // refresh_token is stored in HTTP-only cookie
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

export default {
  register,
  login,
  getCurrentUser,
  heartbeat,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  refreshToken
};
