# 📊 Student Learning Dashboard

Dashboard Quản lý Tiến Độ Học Lập Trình cho Sinh Viên - Ứng dụng web demo được xây dựng bằng React và Tailwind CSS.

## 🎯 Tính năng

### 1. Dashboard Tổng quan
- **KPI Cards**: Hiển thị các chỉ số quan trọng (Tiến độ, Bài tập, Điểm TB, Giờ học)
- **Biểu đồ tiến độ**: Theo dõi tiến độ học tập theo tuần
- **Cảnh báo & Thông báo**: Nhắc nhở bài tập, deadline, kết quả học tập
- **Hoạt động gần đây**: Lịch sử các hoạt động học tập

### 2. Bài tập Gợi ý
- **Filter thông minh**: Lọc theo độ khó và chủ đề
- **Danh sách bài tập**: Cards hiển thị thông tin chi tiết từng bài
- **% Phù hợp**: Gợi ý bài tập phù hợp với trình độ
- **Lộ trình học tập**: Timeline hiển thị tiến độ học tập

### 3. Lỗi & Phản hồi
- **Biểu đồ thống kê lỗi**: Pie chart và Bar chart phân loại lỗi
- **Danh sách bài nộp**: Hiển thị kết quả test cases
- **Gợi ý sửa lỗi**: Phản hồi chi tiết cho từng lỗi
- **Tips tránh lỗi**: Các mẹo hữu ích

### 4. Kỹ năng Mềm & Teamwork
- **Radar Chart**: Đánh giá 6 kỹ năng mềm cơ bản
- **Progress bars**: Hiển thị điểm số từng kỹ năng
- **Bảng dự án nhóm**: Quản lý tiến độ các dự án
- **Gợi ý cải thiện**: Lời khuyên phát triển kỹ năng

### 5. Hồ sơ Học tập
- **Thông tin cá nhân**: Profile card với thông tin sinh viên
- **Thống kê tổng quan**: Các chỉ số quan trọng
- **Thành tích (Badges)**: Danh sách achievement đã đạt được
- **Xuất báo cáo**: Preview và xuất báo cáo PDF

## 🚀 Cài đặt

### Yêu cầu
- Node.js (v14 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. **Cài đặt dependencies**
```bash
npm install
```

2. **Chạy ứng dụng ở chế độ development**
```bash
npm start
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

3. **Build cho production**
```bash
npm run build
```

## 📁 Cấu trúc Dự án

```
src/
├── components/          # React components
│   ├── Sidebar.js      # Navigation sidebar
│   ├── Header.js       # Header với thông tin sinh viên
│   ├── KPICard.js      # Component card KPI
│   └── AlertCard.js    # Component card cảnh báo
├── pages/              # Các trang chính
│   ├── Dashboard.js    # Trang tổng quan
│   ├── Exercises.js    # Trang bài tập
│   ├── Feedback.js     # Trang lỗi & phản hồi
│   ├── Skills.js       # Trang kỹ năng mềm
│   └── Profile.js      # Trang hồ sơ
├── data/
│   └── data.js         # Mock data
├── App.js              # Component chính
├── index.js            # Entry point
└── index.css           # Tailwind CSS & custom styles
```

## 🎨 Công nghệ Sử dụng

- **React 18.2** - Thư viện UI
- **Tailwind CSS 3.4** - Framework CSS
- **Recharts 2.10** - Thư viện biểu đồ
- **JavaScript** - Ngôn ngữ lập trình

## 📊 Dữ liệu Demo

Toàn bộ dữ liệu được mock trong file `src/data/data.js` bao gồm:
- Thông tin sinh viên
- Dữ liệu tiến độ học tập
- Danh sách bài tập và lỗi
- Thống kê kỹ năng mềm
- Dự án nhóm và thành tích

## 🎯 Đặc điểm UI/UX

- ✅ **Responsive Design**: Hoạt động tốt trên mọi thiết bị
- ✅ **Modern UI**: Giao diện hiện đại, màu sắc hài hòa
- ✅ **Smooth Animations**: Hiệu ứng mượt mà, tự nhiên
- ✅ **Interactive**: Các thành phần tương tác trực quan
- ✅ **Accessibility**: Dễ sử dụng, thân thiện người dùng

## 🎨 Color Palette

- **Primary**: Blue (#3b82f6) - Chủ đạo
- **Success**: Green (#22c55e) - Thành công
- **Warning**: Yellow (#eab308) - Cảnh báo
- **Danger**: Red (#ef4444) - Lỗi
- **Purple**: Purple (#8b5cf6) - Nhấn nhá

## 📝 Ghi chú

- Đây là ứng dụng demo, không có backend thực
- Tất cả dữ liệu là giả lập (mock data)
- Chức năng "Xuất báo cáo PDF" chỉ hiển thị preview
- Không có tính năng đăng nhập/xác thực

## 👨‍💻 Phát triển

Để tùy chỉnh:
1. Sửa dữ liệu mock trong `src/data/data.js`
2. Thêm/sửa components trong `src/components/`
3. Tùy chỉnh theme trong `tailwind.config.js`
4. Thêm trang mới trong `src/pages/`

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và phát triển.

---

**Developed with ❤️ using React & Tailwind CSS**

