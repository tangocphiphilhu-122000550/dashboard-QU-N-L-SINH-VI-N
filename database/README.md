# Database Setup & Import Guide

Hướng dẫn thiết lập database SQL Server và import dữ liệu sinh viên từ file Excel.

## 📋 Yêu cầu

- **SQL Server** (2019 trở lên) hoặc **Azure SQL Database**
- **Node.js** (v16+)
- File **DanhSach.xlsx** (đặt ở thư mục gốc project)

## 🚀 Bước 1: Cài đặt Dependencies

```bash
cd be
npm install
```

Các thư viện sẽ được cài đặt:
- `mssql` - SQL Server driver
- `xlsx` - Đọc file Excel
- Các thư viện khác cho backend

## 🔧 Bước 2: Cấu hình SQL Server

### 2.1. Tạo file `.env` từ template

```bash
cp env.example .env
```

### 2.2. Chỉnh sửa file `.env`

```env
# SQL Server Configuration
DB_SERVER=localhost              # Hoặc IP/hostname của SQL Server
DB_USER=sa                       # Username SQL Server
DB_PASSWORD=YourPassword123      # Password SQL Server
DB_NAME=Data_PersonalizedSystem  # Tên database

# Server Configuration
PORT=3001

# SMTP Email Configuration (Mailjet)
SMTP_HOST=in-v3.mailjet.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<MAILJET_API_KEY>
SMTP_PASS=<MAILJET_SECRET_KEY>
EMAIL_FROM=no-reply@learn-dashboard.shopsheap.online

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Secret Keys (đổi thành giá trị riêng của bạn)
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

## 🗄️ Bước 3: Tạo Database Schema

### 3.1. Mở SQL Server Management Studio (SSMS)

1. Kết nối tới SQL Server
2. Mở file `setup_database.sql`
3. Execute (F5)

### 3.2. Hoặc dùng Azure Data Studio

1. Kết nối tới SQL Server
2. Mở file `setup_database.sql`
3. Run (F5)

### 3.3. Kết quả

Script sẽ tạo:
- ✅ 4 tables: `class`, `users`, `user_sessions`, `password_resets`
- ✅ 11 indexes

## 📊 Bước 4: Chuẩn bị file Excel

### 4.1. Cấu trúc file `DanhSach.xlsx`

File Excel cần có các cột sau:

| Tên cột | Bắt buộc | Ví dụ | Ghi chú |
|---------|----------|-------|---------|
| **StudentID** | ✅ Có | 125000003 | Mã sinh viên |
| **LopID** | ✅ Có | 25MC111 | Mã lớp |
| **NganhID** | ✅ Có | 107 | Mã ngành (không có chữ 'h') |
| **HoSV** | ✅ Có | Huỳnh Anh | Sẽ gộp với TenSV |
| **TenSV** | ✅ Có | Dũng | Sẽ gộp với HoSV |
| **Phai** | ❌ Không | Nam/Nữ | Giới tính |
| **NgayDem** | ❌ Không | - | **Sẽ bị bỏ qua** khi import |

**⚠️ Lưu ý quan trọng:**
- Cột `HoSV` và `TenSV` sẽ tự động được gộp thành `HoTenSV` khi import vào database
- Cột `NgayDem` sẽ bị **bỏ qua** và không được import vào database

### 4.2. Ví dụ dữ liệu trong Excel

| StudentID | LopID | NganhID | NgayDem | HoSV | TenSV | Phai |
|-----------|-------|---------|---------|------|-------|------|
| 125000003 | 25MC111 | 107 | true | Huỳnh Anh | Dũng | Nam |
| 125000004 | 25MC111 | 107 | true | Trần Thị | Mai | Nữ |
| 125000005 | 25MC112 | 107 | false | Lê Văn | Cường | Nam |

**Sau khi import vào database:**

| StudentID | LopID | NganhID | HoTenSV | Phai |
|-----------|-------|---------|---------|------|
| 125000003 | 25MC111 | 107 | Huỳnh Anh Dũng | Nam |
| 125000004 | 25MC111 | 107 | Trần Thị Mai | Nữ |
| 125000005 | 25MC112 | 107 | Lê Văn Cường | Nam |

**Chú ý:** Cột `NgayDem` **không được import** vào database.

### 4.3. Lưu ý

- ✅ File phải được đặt tại: `Dashboard/DanhSach.xlsx` (thư mục gốc)
- ✅ Sheet đầu tiên sẽ được đọc
- ✅ Dòng đầu tiên là header (tên cột)
- ✅ Dữ liệu bắt đầu từ dòng 2
- ⚠️ Cột **StudentID** phải unique (không trùng)
- ⚠️ Giới tính sẽ được chuẩn hóa: Nam/Nữ/Khác

## 📥 Bước 5: Import dữ liệu từ Excel

### 5.1. Chạy script import

```bash
cd be
npm run import
```

Hoặc:

```bash
node database/import_from_excel.js
```

### 5.2. Kết quả mong đợi

```
🔄 Đang kết nối SQL Server...
✅ Kết nối SQL Server thành công!

📖 Đang đọc file DanhSach.xlsx...
✅ Đọc file thành công! Tìm thấy 100 dòng dữ liệu

🔄 Đang xóa dữ liệu cũ...
✅ Đã xóa dữ liệu cũ

🔄 Đang import dữ liệu...
   Đã import: 10/100 dòng
   Đã import: 20/100 dòng
   ...

=======================================================
✅ IMPORT HOÀN TẤT!
=======================================================
📊 THỐNG KÊ:
   - Tổng số dòng: 100
   - Thành công: 100
   - Lỗi: 0
=======================================================

📋 PHÂN BỐ THEO LỚP:
   - 22CT111: 25 sinh viên
   - 22CT112: 30 sinh viên
   - 22CT113: 45 sinh viên

📋 PHÂN BỐ THEO NGÀNH:
   - CNTT: 100 sinh viên

✨ Hoàn tất!
```

## 🔍 Kiểm tra dữ liệu

### SQL Query

```sql
USE Data_PersonalizedSystem;
GO

-- Xem tất cả sinh viên
SELECT * FROM class;

-- Đếm theo lớp
SELECT LopID, COUNT(*) as SoLuong
FROM class
GROUP BY LopID
ORDER BY LopID;

-- Đếm theo ngành
SELECT NganhID, COUNT(*) as SoLuong
FROM class
GROUP BY NganhID
ORDER BY NganhID;

-- Đếm theo giới tính
SELECT Phai, COUNT(*) as SoLuong
FROM class
GROUP BY Phai;
```

## ❌ Xử lý lỗi thường gặp

### Lỗi 1: Không kết nối được SQL Server

```
Error: Failed to connect to localhost:1433
```

**Giải pháp:**
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra firewall cho phép port 1433
3. Kiểm tra SQL Server Authentication Mode (Mixed Mode)
4. Kiểm tra TCP/IP protocol đã được enable

### Lỗi 2: File Excel không tìm thấy

```
Error: ENOENT: no such file or directory
```

**Giải pháp:**
1. Đảm bảo file `DanhSach.xlsx` ở đúng vị trí: `Dashboard/DanhSach.xlsx`
2. Kiểm tra tên file (phân biệt hoa/thường)

### Lỗi 3: Login failed for user

```
Error: Login failed for user 'sa'
```

**Giải pháp:**
1. Kiểm tra username/password trong file `.env`
2. Đảm bảo SQL Server Authentication được enable
3. Reset password nếu cần

### Lỗi 4: Duplicate StudentID

```
Error: Violation of UNIQUE KEY constraint
```

**Giải pháp:**
1. Kiểm tra dữ liệu trong Excel có StudentID trùng không
2. Xóa dữ liệu cũ: `TRUNCATE TABLE class;`
3. Chạy lại script import

## 🔄 Import lại dữ liệu

Nếu cần import lại:

```bash
# Script sẽ tự động xóa dữ liệu cũ và import mới
npm run import
```

Hoặc xóa thủ công:

```sql
USE Data_PersonalizedSystem;
DELETE FROM class;
DBCC CHECKIDENT ('class', RESEED, 0);
```

## 📝 Cấu trúc Table Class

```sql
CREATE TABLE class (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- Auto increment
    StudentID NVARCHAR(20) UNIQUE NOT NULL, -- Mã sinh viên (unique)
    LopID NVARCHAR(20) NOT NULL,            -- Mã lớp
    NganhID NVARCHAR(20) NOT NULL,          -- Mã ngành (không có chữ 'h')
    HoTenSV NVARCHAR(255) NOT NULL,         -- Họ và tên sinh viên (đã gộp)
    Phai NVARCHAR(10) CHECK (Phai IN (N'Nam', N'Nữ', N'Khác')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Kiểm tra SQL Server logs
3. Đọc kỹ error message
4. Liên hệ team support

---

**Good luck! 🚀**

