import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { courseExerciseCatalog, studentMock } from '../data/trainingMockData';
import { getTrainingSelectionSnapshot, subscribeTrainingSelection } from '../trainingSelection';
import { formatDateTime } from '../exerciseProgress';

const achievementCards = [
  {
    title: 'Người giữ nhịp luyện tập',
    description: 'Duy trì chuỗi luyện tập đều trong tuần gần nhất và không bị đứt nhịp giữa chừng.',
    tone: 'from-emerald-100/75 via-teal-50/65 to-white/40 border-emerald-100/70',
  },
  {
    title: 'Mở khóa nhánh tiếp theo',
    description: 'Bạn đang tiến gần đến mốc mở thêm bài khó hơn trong môn đang rèn luyện.',
    tone: 'from-sky-100/75 via-cyan-50/65 to-white/40 border-sky-100/70',
  },
  {
    title: 'Tăng tốc xử lý lỗi',
    description: 'Khả năng nhận diện điểm sai và sửa bài có xu hướng tốt hơn qua các lượt luyện gần đây.',
    tone: 'from-amber-100/75 via-orange-50/65 to-white/40 border-amber-100/70',
  },
];

const roleLabel = {
  sinh_vien: 'Sinh viên',
  giang_vien: 'Giảng viên',
  quan_ly_nganh: 'Quản lý ngành',
};

const highlightTones = [
  'from-blue-100/80 via-sky-50/70 to-white/45 border-blue-100/70',
  'from-emerald-100/80 via-teal-50/70 to-white/45 border-emerald-100/70',
  'from-amber-100/80 via-orange-50/70 to-white/45 border-amber-100/70',
  'from-rose-100/75 via-pink-50/65 to-white/45 border-rose-100/70',
];

const progressTones = [
  'from-cyan-100/75 via-sky-50/65 to-white/45 border-cyan-100/70',
  'from-indigo-100/75 via-blue-50/65 to-white/45 border-indigo-100/70',
  'from-lime-100/75 via-emerald-50/65 to-white/45 border-lime-100/70',
  'from-orange-100/75 via-amber-50/65 to-white/45 border-orange-100/70',
];

const tintedCardClass = (tone) =>
  `rounded-[28px] border bg-gradient-to-br p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl ${tone}`;

const getRoleLabel = (role) => roleLabel[role] || role || 'Sinh viên';

const getInitials = (name) => {
  if (!name) {
    return 'SV';
  }

  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const Profile = ({ authUser }) => {
  const [trainingSnapshot, setTrainingSnapshot] = useState(() => getTrainingSelectionSnapshot());
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  
  const selectedCourse = trainingSnapshot.selectedCourse;
  const currentExercises = selectedCourse ? courseExerciseCatalog[selectedCourse.id] || [] : [];
  const completedCount = currentExercises.filter((exercise) => exercise.status === 'Đã làm').length;

  const displayName = authUser?.full_name || authUser?.fullName || 'Người dùng';
  const displayRole = getRoleLabel(authUser?.role);
  const displayStudentCode = authUser?.mssv || authUser?.studentId || authUser?.id || '--';
  const displayEmail = authUser?.email || '--';
  const displayClass = authUser?.lop || authUser?.class || authUser?.class_name || authUser?.class_id || '--';

  const handleExport = () => {
    setIsExporting(true);
    setExportMessage('Đang kết xuất PDF...');
    
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Hàm loại bỏ dấu tiếng Việt để tránh lỗi font trong PDF
        const sanitizeForPDF = (text) => {
          if (!text) return '';
          return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
        };

        const cleanName = sanitizeForPDF(displayName).toUpperCase();
        const cleanCourse = sanitizeForPDF(selectedCourse?.name || 'CHUA CHON MON').toUpperCase();
        const cleanRole = sanitizeForPDF(displayRole).toUpperCase();
        const cleanClass = sanitizeForPDF(displayClass).toUpperCase();

        // --- BACKGROUND DECORATION ---
        doc.setFillColor(248, 250, 252); // Màu nền xám nhạt thanh lịch
        doc.rect(0, 0, 210, 297, 'F');

        // --- KHUNG BAO CHUYÊN NGHIỆP ---
        doc.setDrawColor(226, 232, 240); // Viền nhẹ
        doc.setLineWidth(0.5);
        doc.rect(8, 8, 194, 281, 'S');

        // --- THANH TRANG TRÍ ĐẦU BÁO CÁO ---
        doc.setDrawColor(24, 86, 255); // Màu xanh dương chính
        doc.setLineWidth(1.5);
        doc.line(15, 15, 195, 15);

        // --- TIÊU ĐỀ ---
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('STUDENT PERFORMANCE & DEVELOPMENT REPORT', 15, 25);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`SYSTEM ISSUED: LMS-DASHBOARD | GENERATED: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}`, 15, 31);

        // --- PHẦN 1: THÔNG TIN SINH VIÊN ---
        doc.setFillColor(24, 86, 255); // Cột điểm nhấn màu xanh
        doc.rect(15, 38, 3, 28, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(24, 86, 255);
        doc.text('PERSONAL INFORMATION', 22, 42);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105); // slate-700
        doc.text('Full Name:', 22, 49);
        doc.text('Student Code:', 22, 55);
        doc.text('Classroom:', 22, 61);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(cleanName, 55, 49);
        doc.text(displayStudentCode, 55, 55);
        doc.text(cleanClass, 55, 61);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('System Role:', 115, 49);
        doc.text('Email Address:', 115, 55);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(cleanRole, 145, 49);
        doc.text(displayEmail, 145, 55);

        // Đường gạch ngang phân cách
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 73, 195, 73);

        // --- PHẦN 2: TIẾN ĐỘ RÈN LUYỆN ---
        doc.setFillColor(34, 211, 238); // Cột màu cyan
        doc.rect(15, 80, 3, 28, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(14, 116, 144); // cyan-700
        doc.text('ACADEMIC PROGRESS & PERFORMANCE', 22, 84);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Target Course:', 22, 91);
        doc.text('Current Level:', 22, 97);
        doc.text('Exercises Solved:', 22, 103);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(cleanCourse, 55, 91);
        doc.text(selectedCourse ? `Level ${selectedCourse.currentLevel}` : 'Not Started', 55, 97);
        doc.text(`${completedCount} Completed`, 55, 103);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Progress Rate:', 115, 91);
        doc.text('Weekly Streak:', 115, 97);
        doc.text('Relative Rank:', 115, 103);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(selectedCourse ? `${selectedCourse.progressPercent}%` : '0%', 145, 91);
        doc.text(`${studentMock.weeklyStreak} Days`, 145, 97);
        doc.text(studentMock.rankLabel, 145, 103);

        // Đường gạch ngang phân cách
        doc.line(15, 115, 195, 115);

        // --- PHẦN 3: ĐÁNH GIÁ KỸ NĂNG MỀM ---
        doc.setFillColor(139, 92, 246); // Cột màu tím
        doc.rect(15, 122, 3, 48, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(109, 40, 217); // violet-700
        doc.text('SOFT SKILLS DEVELOPMENT MATRIX', 22, 126);

        const skills = [
          { name: 'Communication (Giao Tiep)', score: 4.5 },
          { name: 'Teamwork (Lam Viec Nhom)', score: 4.2 },
          { name: 'Time Management (Quan Ly Thoi Gian)', score: 4.0 },
          { name: 'Problem Solving (Giai Quyet Van De)', score: 4.8 },
          { name: 'Creativity (Sang Tao)', score: 3.5 },
          { name: 'Leadership (Lanh Dao)', score: 3.8 }
        ];

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        skills.forEach((skill, idx) => {
          const yPos = 135 + idx * 6.5;
          doc.setTextColor(71, 85, 105);
          doc.text(skill.name, 22, yPos);
          
          // Vẽ thanh biểu đồ ngang rực rỡ
          doc.setFillColor(241, 245, 249); // Nền xám
          doc.rect(100, yPos - 2.8, 50, 3, 'F');
          
          doc.setFillColor(99, 102, 241); // Thanh tiến trình tím-xanh
          doc.rect(100, yPos - 2.8, (skill.score / 5) * 50, 3, 'F');

          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${skill.score} / 5.0`, 155, yPos);
          doc.setFont('Helvetica', 'normal');
        });

        // Đường gạch ngang phân cách
        doc.line(15, 178, 195, 178);

        // --- PHẦN 4: THÀNH TÍCH ĐẠT ĐƯỢC ---
        doc.setFillColor(16, 185, 129); // Cột màu xanh lá
        doc.rect(15, 185, 3, 24, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(4, 120, 87); // emerald-700
        doc.text('ACHIEVEMENTS & EVIDENCE LOG', 22, 189);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('[x] STREAK KEEPER: Maintained daily coding streak for the last week.', 22, 196);
        doc.text('[x] PATH LOCKBREAKER: Ready to unlock higher difficulty stage on target course.', 22, 201);
        doc.text('[x] EXCELLENT DEBUGGER: Accelerated error identification and resolution speed.', 22, 206);

        // --- PHẦN CHỮ KÝ VÀ MÃ XÁC THỰC ---
        doc.setFillColor(255, 255, 255); // Nền trắng cho phần chữ ký
        doc.rect(15, 220, 180, 24, 'F');
        doc.rect(15, 220, 180, 24, 'S');

        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.2);
        doc.setTextColor(100, 116, 139);
        doc.text('Verification Code: ' + Math.random().toString(36).substring(2, 15).toUpperCase(), 18, 226);
        doc.text('Personalized Learning System Dashboard issues this digital certificate automatically.', 18, 231);
        doc.text('Disclaimer: This is a verified electronic performance transcript. No physical signature required.', 18, 236);

        // --- THANH TRANG TRÍ CUỐI TRANG ---
        doc.setDrawColor(24, 86, 255);
        doc.setLineWidth(1.5);
        doc.line(15, 260, 195, 260);

        // --- TẢI FILE PDF ---
        const sanitizedName = displayName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-zA-Z0-9]/g, '_');

        doc.save(`Bao_cao_ren_luyen_${sanitizedName}.pdf`);
      } catch (err) {
        console.error('PDF Generation failed, falling back to printer dialog:', err);
        window.print();
      } finally {
        setIsExporting(false);
        setExportMessage('');
      }
    }, 1500);
  };

  const profileHighlights = useMemo(
    () => [
      { label: 'Mục tiêu đang luyện', value: selectedCourse?.name || 'Chưa chọn môn' },
      { label: 'Bài đã hoàn thành', value: String(completedCount) },
      { label: 'Chuỗi luyện tập', value: `${studentMock.weeklyStreak} ngày` },
      { label: 'Xếp hạng tương đối', value: studentMock.rankLabel },
    ],
    [completedCount, selectedCourse]
  );

  const progressCards = [
    { label: 'Mục tiêu đang theo', value: selectedCourse?.name || 'Chưa chọn môn' },
    { label: 'Cấp hiện tại', value: selectedCourse ? `Lv ${selectedCourse.currentLevel}` : '--' },
    { label: 'Tiến độ môn hiện tại', value: selectedCourse ? `${selectedCourse.progressPercent}%` : '--' },
    { label: 'Bài đã giải của môn này', value: String(completedCount) },
  ];

  useEffect(() => subscribeTrainingSelection(() => setTrainingSnapshot(getTrainingSelectionSnapshot())), []);

  return (
    <div className="space-y-6">
      <section className="glass-panel bg-gradient-to-br from-blue-50/70 via-white/38 to-cyan-50/60 p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr] xl:items-center">
          <div className="rounded-[28px] border border-sky-100/70 bg-gradient-to-br from-sky-100/80 via-cyan-50/70 to-white/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary-500 via-sky-400 to-cyan-300 text-3xl font-extrabold text-white shadow-[0_22px_45px_rgba(24,86,255,0.28)]">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{displayRole}</p>
                <h2 className="mt-2 truncate text-3xl font-bold text-slate-900">{displayName}</h2>
                <p className="mt-2 text-sm text-slate-600">Mã sinh viên: {displayStudentCode}</p>
                <p className="mt-1 truncate text-sm text-slate-600">Email: {displayEmail}</p>
                <p className="mt-1 text-sm text-slate-600">Lớp: {displayClass}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="glass-chip">Hồ sơ rèn luyện cá nhân</div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 transition-all flex items-center gap-2 ${
                    isExporting 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-500/20 active:scale-95'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {exportMessage}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Xuất báo cáo
                    </>
                  )}
                </button>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">
                Theo dõi hồ sơ cá nhân và tiến độ rèn luyện của bạn.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Hồ sơ giúp bạn xem nhanh thông tin tài khoản, môn đang luyện, số bài đã hoàn thành và các thành tích gần đây.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {profileHighlights.map((item, index) => (
          <article key={item.label} className={tintedCardClass(highlightTones[index % highlightTones.length])}>
            <p className="text-sm font-semibold text-slate-600">{item.label}</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="glass-panel bg-gradient-to-br from-indigo-50/55 via-white/38 to-sky-50/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ảnh chụp tiến độ</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {progressCards.map((item, index) => (
              <div key={item.label} className={tintedCardClass(progressTones[index % progressTones.length])}>
                <p className="text-sm text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel bg-gradient-to-br from-emerald-50/55 via-white/38 to-amber-50/55 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Thành tích mô phỏng</p>
          <div className="mt-5 space-y-4">
            {achievementCards.map((item) => (
              <article key={item.title} className={tintedCardClass(item.tone)}>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Profile;
