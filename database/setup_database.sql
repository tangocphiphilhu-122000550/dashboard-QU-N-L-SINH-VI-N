-- =====================================================
-- DASHBOARD BACKEND - SQL SERVER DATABASE SETUP
-- Tạo toàn bộ database schema cho SQL Server
-- =====================================================

USE Data_PersonalizedSystem;
GO

PRINT '📊 Sử dụng database: Data_PersonalizedSystem';
GO

-- =====================================================
-- BƯỚC 1: TẠO TABLES
-- =====================================================

PRINT '🔄 Đang tạo tables...';

-- Table: class (danh sách sinh viên)
CREATE TABLE class (
    id INT IDENTITY(1,1) PRIMARY KEY,
    StudentID NVARCHAR(20) NOT NULL,  -- Không unique nữa
    LopID NVARCHAR(20) NOT NULL,
    NganhID NVARCHAR(20) NOT NULL,
    HoTenSV NVARCHAR(255) NULL,
    Phai NVARCHAR(10) NULL CHECK (Phai IN (N'Nam', N'Nữ', N'Khác')),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

PRINT '✅ Table class đã được tạo';

-- Table: users (thông tin người dùng)
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    mssv NVARCHAR(10) UNIQUE NULL,
    full_name NVARCHAR(255) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    class_id INT NULL,
    last_active DATETIME2 NULL,
    last_inactive_reminder_at DATETIME2 NULL,
    role NVARCHAR(20) DEFAULT 'sinh_vien' CHECK (role IN ('sinh_vien', 'giang_vien', 'manage_nghanh')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_users_class FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE SET NULL
);

PRINT '✅ Table users đã được tạo';

-- Table: user_sessions (lưu JWT tokens)
CREATE TABLE user_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    access_token NVARCHAR(MAX) NOT NULL,
    refresh_token NVARCHAR(MAX) NOT NULL,
    token_expires_at DATETIME2 NOT NULL,
    refresh_token_expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    CONSTRAINT FK_user_sessions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

PRINT '✅ Table user_sessions đã được tạo';

-- Table: password_resets (token reset password)
CREATE TABLE password_resets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    token NVARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_password_resets_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

PRINT '✅ Table password_resets đã được tạo';
GO

-- =====================================================
-- BƯỚC 2: TẠO INDEXES
-- =====================================================

PRINT '🔄 Đang tạo indexes...';

-- Indexes cho class
CREATE INDEX idx_class_student_id ON class(StudentID);
CREATE INDEX idx_class_lop_id ON class(LopID);
CREATE INDEX idx_class_nganh_id ON class(NganhID);

-- Indexes cho users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mssv ON users(mssv);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_class_id ON users(class_id);
CREATE INDEX idx_users_last_active ON users(last_active);

-- Indexes cho user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(user_id, is_active) WHERE is_active = 1;

-- Indexes cho password_resets
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

PRINT '✅ Đã tạo indexes';
GO

-- =====================================================
-- BƯỚC 3: IMPORT DỮ LIỆU SINH VIÊN
-- =====================================================
-- Chạy script import_from_excel.js để import dữ liệu từ file DanhSach.xlsx

PRINT '⚠️  Chưa import dữ liệu sinh viên';
PRINT '💡 Chạy lệnh: node database/import_from_excel.js';
GO

-- =====================================================
-- BƯỚC 4: THỐNG KÊ
-- =====================================================

PRINT '';
PRINT '=======================================================';
PRINT '✅ SETUP DATABASE HOÀN TẤT!';
PRINT '=======================================================';
PRINT '';
PRINT '📊 THỐNG KÊ:';
PRINT '   - Database: Data_PersonalizedSystem';
PRINT '   - Tables: 4 (class, users, user_sessions, password_resets)';
PRINT '   - Indexes: 12';
PRINT '';
PRINT '🚀 Database đã sẵn sàng!';
PRINT '';
PRINT '📝 BƯỚC TIẾP THEO:';
PRINT '   1. Chạy: npm run import';
PRINT '   2. Import dữ liệu từ file DanhSach.xlsx';
PRINT '=======================================================';
GO
