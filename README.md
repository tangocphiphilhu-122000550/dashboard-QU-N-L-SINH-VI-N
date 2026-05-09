# Dashboard Backend API

Backend API cho Dashboard Quản lý Tiến Độ Học Lập Trình, kết nối với Supabase.

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin Supabase của bạn:

```env
# Supabase Configuration
SUPABASE_URL=https://xccziowwooshoselpneq.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# PostgreSQL Connection (Optional)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xccziowwooshoselpneq.supabase.co:5432/postgres

# Server
PORT=3001
```

#### Cách lấy Supabase Keys:

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

### 3. Chạy server

**Development mode (với auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3001`

## 📡 API Endpoints

### Health Check

- **GET** `/health` - Kiểm tra trạng thái server và database

### Test

- **GET** `/` - Trang chủ API
- **GET** `/api/test` - Test endpoint

## 🔧 Cấu trúc Project

```
be/
├── config/
│   └── database.js      # Cấu hình kết nối Supabase & PostgreSQL
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env.example         # Template environment variables
└── README.md           # Documentation
```

## 🔌 Kết nối Database

Backend hỗ trợ 2 cách kết nối:

### 1. Supabase Client (Recommended)
Sử dụng `@supabase/supabase-js` - an toàn và dễ sử dụng:

```javascript
import { supabase } from './config/database.js';

const { data, error } = await supabase
  .from('your_table')
  .select('*');
```

### 2. Direct PostgreSQL Pool
Kết nối trực tiếp qua `pg` library:

```javascript
import { pool } from './config/database.js';

const result = await pool.query('SELECT * FROM your_table');
```

## 📝 Ví dụ sử dụng

### Sử dụng Supabase Client

```javascript
import { supabase } from './config/database.js';

// SELECT
const { data, error } = await supabase
  .from('users')
  .select('*');

// INSERT
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' });

// UPDATE
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', 1);

// DELETE
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 1);
```

### Sử dụng PostgreSQL Pool

```javascript
import { pool } from './config/database.js';

// Query
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

## 🔒 Security Notes

- **Không commit file `.env`** vào Git
- Sử dụng **Supabase Row Level Security (RLS)** cho bảo mật
- Supabase Anon Key an toàn cho client-side (có RLS)
- Service Role Key chỉ dùng cho server-side operations

## 📚 Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Node.js Driver](https://node-postgres.com/)

## 🐛 Troubleshooting

### Lỗi kết nối database

1. Kiểm tra `.env` file có đúng không
2. Kiểm tra Supabase project có active không
3. Kiểm tra network firewall
4. Test connection: `GET /health`

### Lỗi SSL

Nếu gặp lỗi SSL với PostgreSQL, đã được cấu hình trong `database.js`:
```javascript
ssl: { rejectUnauthorized: false }
```

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Logs trong console
2. Supabase Dashboard logs
3. Health endpoint: `http://localhost:3001/health`
