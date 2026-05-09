import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// SQL Server Configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || 'DashboardDB',
  options: {
    encrypt: true, // For Azure
    trustServerCertificate: true // For local dev
  }
};

async function importFromTextFile() {
  try {
    console.log('🔄 Đang kết nối SQL Server...');
    
    // Kết nối SQL Server
    const pool = await sql.connect(config);
    console.log('✅ Kết nối SQL Server thành công!\n');
    
    // Đọc file text
    console.log('📖 Đang đọc file class_export.txt...');
    const textFilePath = path.join(__dirname, '..', '..', 'class_export.txt');
    
    if (!fs.existsSync(textFilePath)) {
      console.error(`❌ Không tìm thấy file: ${textFilePath}`);
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(textFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (!lines || lines.length === 0) {
      console.log('⚠️  File text không có dữ liệu!');
      return;
    }
    
    console.log(`✅ Đọc file thành công! Tìm thấy ${lines.length} dòng dữ liệu\n`);
    
    // Debug: Hiển thị dòng đầu tiên
    if (lines.length > 0) {
      console.log('📋 Định dạng: StudentID|LopID|NganhID|HoTenSV|Phai');
      console.log('📝 Dữ liệu dòng đầu tiên:');
      console.log(lines[0]);
      console.log('');
    }
    
    // Parse data từ text file
    const data = lines.map((line, index) => {
      const parts = line.split('|');
      if (parts.length < 5) {
        console.warn(`⚠️  Dòng ${index + 1} không đủ cột (có ${parts.length}/5): ${line.substring(0, 50)}...`);
        return null;
      }
      return {
        StudentID: parts[0]?.trim() || '',
        LopID: parts[1]?.trim() || '',
        NganhID: parts[2]?.trim() || '',
        HoTenSV: parts[3]?.trim() || '',
        Phai: parts[4]?.trim() || ''
      };
    }).filter(row => row !== null);
    
    console.log(`✅ Parsed thành công ${data.length} dòng hợp lệ\n`);
    
    // Kiểm tra duplicate StudentID
    console.log('🔍 Đang kiểm tra duplicate StudentID...');
    const studentIDs = data.map(row => row.StudentID).filter(id => id);
    const duplicates = studentIDs.filter((id, index) => studentIDs.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    if (uniqueDuplicates.length > 0) {
      console.log(`⚠️  CẢNH BÁO: Phát hiện ${uniqueDuplicates.length} StudentID BỊ TRÙNG:`);
      uniqueDuplicates.slice(0, 10).forEach(id => {
        const count = studentIDs.filter(sid => sid === id).length;
        console.log(`   - ${id}: xuất hiện ${count} lần`);
      });
      if (uniqueDuplicates.length > 10) {
        console.log(`   ... và ${uniqueDuplicates.length - 10} StudentID trùng khác`);
      }
      console.log('');
    } else {
      console.log('✅ Không có StudentID trùng lặp\n');
    }
    
    // Đếm số StudentID đã tồn tại trong database
    console.log('🔍 Đang kiểm tra StudentID đã tồn tại trong database...');
    const existingStudentIDsResult = await pool.request().query('SELECT StudentID FROM class');
    const existingStudentIDs = new Set(existingStudentIDsResult.recordset.map(row => row.StudentID));
    const initialCount = existingStudentIDs.size;
    console.log(`📊 Đã có ${initialCount} StudentID trong database\n`);
    
    // Import từng dòng - CHỈ INSERT StudentID MỚI
    console.log('🔄 Đang import dữ liệu (chỉ insert StudentID mới)...');
    let successCount = 0;
    let skippedCount = 0; // Số StudentID đã tồn tại (bỏ qua)
    let errorCount = 0;
    const errorLines = []; // Lưu danh sách dòng lỗi
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Lấy dữ liệu từ file text (đã parsed)
        const studentID = row.StudentID || '';
        const lopID = row.LopID || '';
        const nghanhID = row.NganhID || '';
        const hoTenSV = row.HoTenSV || null;
        const phai = row.Phai || null;
        
        // Kiểm tra chỉ các cột BẮT BUỘC (StudentID, LopID, NghanhID)
        if (!studentID || !lopID || !nghanhID) {
          console.log(`⚠️  Bỏ qua dòng ${i + 1}: Thiếu StudentID, LopID hoặc NghanhID`);
          errorLines.push({
            line: i + 1,
            studentID: studentID || 'NULL',
            lopID: lopID || 'NULL',
            nghanhID: nghanhID || 'NULL',
            error: 'Thiếu dữ liệu bắt buộc'
          });
          errorCount++;
          continue;
        }
        
        // Kiểm tra StudentID đã tồn tại chưa
        if (existingStudentIDs.has(studentID)) {
          // Bỏ qua StudentID đã tồn tại (không báo lỗi)
          skippedCount++;
          continue;
        }
        
        // Chuẩn hóa giới tính (NULL nếu không có hoặc không hợp lệ)
        let phaiNormalized = null;
        if (phai && typeof phai === 'string') {
          const phaiLower = phai.toLowerCase().trim();
          if (phaiLower === 'nam' || phaiLower === 'male' || phaiLower === 'm') {
            phaiNormalized = 'Nam';
          } else if (phaiLower === 'nữ' || phaiLower === 'nu' || phaiLower === 'female' || phaiLower === 'f') {
            phaiNormalized = 'Nữ';
          } else {
            phaiNormalized = 'Khác';
          }
        }
        
        // Insert vào database (chỉ StudentID mới)
        const insertResult = await pool.request()
          .input('studentID', sql.NVarChar(20), studentID ? String(studentID).trim() : null)
          .input('lopID', sql.NVarChar(20), lopID ? String(lopID).trim() : null)
          .input('nganhID', sql.NVarChar(20), nghanhID ? String(nghanhID).trim() : null)
          .input('hoTenSV', sql.NVarChar(255), hoTenSV ? String(hoTenSV).trim() : null)
          .input('phai', sql.NVarChar(10), phaiNormalized)
          .query(`
            INSERT INTO class (StudentID, LopID, NganhID, HoTenSV, Phai)
            VALUES (@studentID, @lopID, @nganhID, @hoTenSV, @phai)
          `);
        
        // Verify insert thành công
        if (insertResult.rowsAffected && insertResult.rowsAffected[0] === 1) {
          successCount++;
          // Thêm StudentID mới vào set để tránh insert duplicate trong cùng batch
          existingStudentIDs.add(studentID);
        } else {
          console.error(`\n⚠️  CẢNH BÁO: Insert dòng ${i + 1} KHÔNG thành công (rowsAffected = ${insertResult.rowsAffected})`);
          errorCount++;
        }
        
        // Hiển thị progress
        if ((i + 1) % 50 === 0) {
          console.log(`   ✅ Đã xử lý: ${i + 1}/${data.length} dòng (Mới: ${successCount}, Bỏ qua: ${skippedCount}, Lỗi: ${errorCount})`);
        }
      } catch (error) {
        // Lấy lại studentID từ row để đảm bảo có giá trị
        const studentID = row.StudentID || '';
        const lopID = row.LopID || '';
        const nghanhID = row.NganhID || '';
        const hoTenSV = row.HoTenSV || null;
        
        // Kiểm tra lỗi duplicate (có thể xảy ra nếu có race condition)
        if (error.message.includes('duplicate') || error.message.includes('UNIQUE') || error.number === 2627) {
          // Bỏ qua duplicate (không báo lỗi)
          skippedCount++;
          if (studentID) {
            existingStudentIDs.add(studentID);
          }
          continue;
        }
        
        // Lỗi khác
        console.error(`\n❌ LỖI TẠI DÒNG ${i + 1}:`);
        console.error(`   StudentID: ${studentID}, LopID: ${lopID}, NganhID: ${nghanhID}`);
        console.error(`   HoTenSV: ${hoTenSV}`);
        console.error(`   Chi tiết lỗi: ${error.message}`);
        console.error('');
        
        errorLines.push({
          line: i + 1,
          studentID,
          lopID,
          nghanhID,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log('\n=======================================================');
    console.log('✅ IMPORT HOÀN TẤT!');
    console.log('=======================================================');
    console.log(`📊 THỐNG KÊ:`);
    console.log(`   - Tổng số dòng trong file: ${data.length}`);
    console.log(`   - ✅ Đã INSERT (StudentID mới): ${successCount}`);
    console.log(`   - ⏭️  Đã BỎ QUA (StudentID đã tồn tại): ${skippedCount}`);
    console.log(`   - ❌ Lỗi: ${errorCount}`);
    
    // Đếm số dòng THỰC TẾ trong database
    const countResult = await pool.request().query('SELECT COUNT(*) as Total FROM class');
    const actualCount = countResult.recordset[0].Total;
    console.log(`   - 📊 Tổng số dòng TRONG DATABASE: ${actualCount}`);
    
    const expectedCount = initialCount + successCount;
    if (actualCount !== expectedCount) {
      console.log(`\n⚠️  Lưu ý: Số dòng trong DB (${actualCount}) khác với số dòng dự kiến (${expectedCount})`);
    }
    
    // Hiển thị danh sách dòng lỗi nếu có
    if (errorLines.length > 0) {
      console.log(`\n❌ DANH SÁCH ${errorLines.length} DÒNG BỊ LỖI:`);
      errorLines.slice(0, 20).forEach(err => {
        console.log(`   - Dòng ${err.line}: StudentID=${err.studentID}, Error: ${err.error.substring(0, 80)}`);
      });
      if (errorLines.length > 20) {
        console.log(`   ... và ${errorLines.length - 20} dòng lỗi khác`);
      }
    }
    
    console.log('=======================================================\n');
    
    // Thống kê theo lớp
    const result = await pool.request().query(`
      SELECT 
        LopID,
        COUNT(*) as SoLuong
      FROM class
      GROUP BY LopID
      ORDER BY LopID
    `);
    
    if (result.recordset.length > 0) {
      console.log('📋 PHÂN BỐ THEO LỚP:');
      result.recordset.forEach(row => {
        console.log(`   - ${row.LopID}: ${row.SoLuong} sinh viên`);
      });
      console.log('');
    }
    
    // Thống kê theo ngành
    const nghanhResult = await pool.request().query(`
      SELECT 
        NganhID,
        COUNT(*) as SoLuong
      FROM class
      GROUP BY NganhID
      ORDER BY NganhID
    `);
    
    if (nghanhResult.recordset.length > 0) {
      console.log('📋 PHÂN BỐ THEO NGÀNH:');
      nghanhResult.recordset.forEach(row => {
        console.log(`   - ${row.NganhID}: ${row.SoLuong} sinh viên`);
      });
      console.log('');
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('❌ LỖI:', error.message);
    console.error('\n💡 HƯỚNG DẪN:');
    console.error('   1. Kiểm tra file class_export.txt có tồn tại không (đặt ở thư mục gốc Dashboard)');
    console.error('   2. Định dạng file: StudentID|LopID|NganhID|HoTenSV|Phai');
    console.error('   3. Kiểm tra cấu hình SQL Server trong .env:');
    console.error('      - DB_SERVER=localhost');
    console.error('      - DB_USER=sa');
    console.error('      - DB_PASSWORD=your_password');
    console.error('      - DB_NAME=Data_PersonalizedSystem');
    console.error('   4. Đảm bảo SQL Server đang chạy');
    console.error('   5. Đảm bảo database đã được tạo (chạy setup_database.sql)');
    throw error;
  }
}

// Chạy import
importFromTextFile()
  .then(() => {
    console.log('✨ Hoàn tất!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import thất bại:', error);
    process.exit(1);
  });

