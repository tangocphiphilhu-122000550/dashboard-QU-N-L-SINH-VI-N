import { availableCourses } from './data';

export const TRAINING_COURSE_KEY = 'selectedTrainingCourse';
export const ENROLLED_COURSES_KEY = 'enrolledTrainingCourses';

const ALLOWED_COURSE_CODES = ['IT3080', 'IT3090', 'IT3100', 'IT2030'];

const toCourseId = (course) => String(course.code || course.id).toLowerCase().replace(/[^a-z0-9]+/g, '-');

const getCurrentLevel = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 1;
    case 'Advanced':
      return 3;
    default:
      return 2;
  }
};

const getProgressPercent = (course, currentLevel) => {
  const occupancy = course.maxStudents ? Math.round((course.enrolled / course.maxStudents) * 100) : 50;
  return Math.max(18, Math.min(78, occupancy - 8 + currentLevel * 6));
};

const getFocusTopics = (topics) => topics.slice(0, 3).map((topic) => topic.name);

const roadmapBlueprints = {
  IT3080: [
    {
      stage: 1,
      tier: 'Mức dễ',
      title: 'Nền tảng giao diện web',
      summary: 'Làm quen bố cục trang, HTML semantic, CSS cơ bản và responsive nền tảng.',
      skillCluster: ['HTML & CSS', 'Responsive UI', 'Semantic Layout'],
      exerciseTitles: [
        'Dựng trang hồ sơ sinh viên bằng HTML/CSS',
        'Chuyển layout 2 cột sang responsive',
        'Tách header, sidebar và thẻ thông tin thành khối giao diện rõ ràng',
      ],
      assessmentTitle: 'Kiểm tra nền tảng giao diện',
      weakAreas: ['Flex/Grid', 'Responsive', 'Semantic HTML'],
      remediationTitles: [
        'Luyện lại căn chỉnh layout dashboard',
        'Bổ sung bài xử lý responsive cho thẻ thống kê',
      ],
    },
    {
      stage: 2,
      tier: 'Mức trung bình',
      title: 'JavaScript DOM và tương tác',
      summary: 'Rèn xử lý sự kiện, DOM, validate input và cập nhật giao diện theo trạng thái.',
      skillCluster: ['JavaScript ES6+', 'DOM Events', 'Form Validation'],
      exerciseTitles: [
        'Viết bộ lọc khóa học theo từ khóa và độ khó',
        'Xử lý form đăng ký môn với validate dữ liệu đầu vào',
        'Tạo thanh tiến độ cập nhật theo trạng thái bài tập',
      ],
      assessmentTitle: 'Kiểm tra tương tác JavaScript',
      weakAreas: ['Xử lý sự kiện', 'Validate form', 'Cập nhật state giao diện'],
      remediationTitles: [
        'Bài luyện validate biểu mẫu nhiều trạng thái',
        'Bài luyện đồng bộ dữ liệu giao diện sau khi submit',
        'Bài luyện xử lý sự kiện nhiều bước',
      ],
    },
    {
      stage: 3,
      tier: 'Mức khó',
      title: 'React component và tích hợp API',
      summary: 'Làm việc với component, props, state và luồng lấy dữ liệu để sẵn sàng nối LMS/API.',
      skillCluster: ['React Basics', 'Hooks', 'API Integration'],
      exerciseTitles: [
        'Tách màn khóa học thành các component tái sử dụng',
        'Hiển thị bài tập theo dữ liệu mock rồi thay được bằng API thật',
        'Thêm trạng thái loading và empty state cho danh sách bài luyện',
      ],
      assessmentTitle: 'Kiểm tra React và tích hợp dữ liệu',
      weakAreas: ['Tách component', 'useEffect', 'Hiển thị dữ liệu động'],
      remediationTitles: [
        'Luyện lại render danh sách từ API mock',
        'Bài tập tách component và truyền props nhiều tầng',
      ],
    },
  ],
  IT3090: [
    {
      stage: 1,
      tier: 'Mức dễ',
      title: 'Mảng và danh sách liên kết',
      summary: 'Củng cố tư duy dữ liệu tuyến tính, duyệt phần tử và cập nhật cấu trúc cơ bản.',
      skillCluster: ['Array & Linked List', 'Traversal', 'Insertion/Deletion'],
      exerciseTitles: [
        'Đảo ngược mảng và phân tích độ phức tạp',
        'Cài đặt linked list đơn với thao tác thêm/xóa',
        'Tìm phần tử trùng và chuẩn hóa dữ liệu đầu vào',
      ],
      assessmentTitle: 'Kiểm tra cấp 1: dữ liệu tuyến tính',
      weakAreas: ['Con trỏ next', 'Chèn/xóa node', 'Phân tích Big O'],
      remediationTitles: [
        'Bài luyện chèn node vào giữa danh sách liên kết',
        'Bài luyện đếm số lần xuất hiện trong mảng',
        'Bài luyện phân tích độ phức tạp cho duyệt tuyến tính',
      ],
    },
    {
      stage: 2,
      tier: 'Mức trung bình',
      title: 'Ngăn xếp và hàng đợi',
      summary: 'Luyện cấu trúc LIFO/FIFO, xử lý chuỗi thao tác và mô phỏng luồng xử lý dữ liệu.',
      skillCluster: ['Stack & Queue', 'Simulation', 'Window Processing'],
      exerciseTitles: [
        'Cài đặt stack kiểm tra dấu ngoặc hợp lệ',
        'Mô phỏng queue xử lý tác vụ theo thứ tự đến',
        'Giải bài toán cửa sổ trượt bằng deque cơ bản',
      ],
      assessmentTitle: 'Kiểm tra cấp 2: stack và queue',
      weakAreas: ['Push/Pop', 'Front/Rear', 'Deque và mô phỏng thao tác'],
      remediationTitles: [
        'Bài luyện mô phỏng stack nhiều thao tác',
        'Bài luyện queue ưu tiên trường hợp rỗng/đầy',
        'Bài luyện trượt cửa sổ với dữ liệu lớn',
      ],
    },
    {
      stage: 3,
      tier: 'Mức khó',
      title: 'Cây và đồ thị cơ bản',
      summary: 'Tiếp cận cấu trúc phi tuyến, duyệt DFS/BFS và biểu diễn bài toán bằng graph.',
      skillCluster: ['Tree & Graph', 'DFS/BFS', 'Adjacency List'],
      exerciseTitles: [
        'Duyệt cây nhị phân theo nhiều thứ tự',
        'Duyệt đồ thị bằng BFS và DFS',
        'Đếm thành phần liên thông trong đồ thị vô hướng',
      ],
      assessmentTitle: 'Kiểm tra cấp 3: cây và đồ thị',
      weakAreas: ['Duyệt đệ quy', 'Visited set', 'Biểu diễn graph'],
      remediationTitles: [
        'Bài luyện BFS với hàng đợi từng bước',
        'Bài luyện DFS phát hiện chu trình cơ bản',
        'Bài luyện tạo adjacency list từ input thô',
      ],
    },
    {
      stage: 4,
      tier: 'Mức nâng cao',
      title: 'Tối ưu và quy hoạch động',
      summary: 'Giải các bài cần tối ưu trạng thái, so sánh phương án và giảm độ phức tạp lời giải.',
      skillCluster: ['Sorting Algorithms', 'Dynamic Programming', 'Optimization'],
      exerciseTitles: [
        'So sánh quick sort, merge sort và chọn chiến lược phù hợp',
        'Giải bài toán ba lô 0/1 bằng quy hoạch động',
        'Tối ưu dãy con tăng dài nhất với nhiều cách tiếp cận',
      ],
      assessmentTitle: 'Kiểm tra cấp 4: tối ưu lời giải',
      weakAreas: ['Chọn trạng thái DP', 'Tối ưu bộ nhớ', 'So sánh chiến lược sắp xếp'],
      remediationTitles: [
        'Bài luyện dựng bảng DP từ ví dụ nhỏ',
        'Bài luyện tối ưu bộ nhớ từ 2D xuống 1D',
        'Bài luyện chọn thuật toán sắp xếp theo dữ liệu đầu vào',
      ],
    },
  ],
  IT3100: [
    {
      stage: 1,
      tier: 'Mức dễ',
      title: 'SQL truy vấn cơ bản',
      summary: 'Ôn SELECT, WHERE, ORDER BY và chuẩn hóa câu truy vấn với dữ liệu đơn bảng.',
      skillCluster: ['SQL Basics', 'Filtering', 'Ordering'],
      exerciseTitles: [
        'Viết truy vấn lọc sinh viên theo điều kiện điểm',
        'Sắp xếp kết quả và phân trang dữ liệu cơ bản',
        'Thống kê số lượng bản ghi theo từng nhóm đơn giản',
      ],
      assessmentTitle: 'Kiểm tra SQL cơ bản',
      weakAreas: ['WHERE', 'GROUP BY', 'ORDER BY'],
      remediationTitles: [
        'Bài luyện lọc dữ liệu nhiều điều kiện',
        'Bài luyện thống kê số lượng theo nhóm',
      ],
    },
    {
      stage: 2,
      tier: 'Mức trung bình',
      title: 'Thiết kế cơ sở dữ liệu quan hệ',
      summary: 'Rèn chuẩn hóa bảng, khóa chính/khóa ngoại và mô hình hóa nghiệp vụ thực tế.',
      skillCluster: ['Database Design', 'Normalization', 'ER Modeling'],
      exerciseTitles: [
        'Thiết kế schema cho hệ thống luyện code sinh viên',
        'Xác định khóa chính, khóa ngoại và ràng buộc dữ liệu',
        'Chuẩn hóa bảng từ dữ liệu thô sang mô hình 3NF',
      ],
      assessmentTitle: 'Kiểm tra thiết kế CSDL',
      weakAreas: ['Khóa ngoại', 'Chuẩn hóa', 'Tách bảng nghiệp vụ'],
      remediationTitles: [
        'Bài luyện xác định thực thể và quan hệ',
        'Bài luyện loại bỏ dư thừa dữ liệu',
        'Bài luyện mapping sơ đồ ER sang bảng',
      ],
    },
    {
      stage: 3,
      tier: 'Mức khó',
      title: 'SQL nâng cao và tối ưu truy vấn',
      summary: 'Thực hành join nhiều bảng, subquery, index và đọc dấu hiệu truy vấn chậm.',
      skillCluster: ['Advanced SQL', 'Join', 'Optimization'],
      exerciseTitles: [
        'Viết truy vấn join nhiều bảng cho báo cáo tiến độ',
        'Dùng subquery và CTE để gom dữ liệu phức tạp',
        'Đề xuất index phù hợp cho truy vấn thống kê lớn',
      ],
      assessmentTitle: 'Kiểm tra SQL nâng cao',
      weakAreas: ['JOIN', 'CTE/Subquery', 'Index và tối ưu'],
      remediationTitles: [
        'Bài luyện join nhiều bảng theo yêu cầu báo cáo',
        'Bài luyện đọc query plan cơ bản',
      ],
    },
  ],
  IT2030: [
    {
      stage: 1,
      tier: 'Mức dễ',
      title: 'Java cơ bản và tư duy đối tượng',
      summary: 'Nắm class, object, constructor và cách mô tả dữ liệu theo hướng đối tượng.',
      skillCluster: ['Java Basics', 'Class/Object', 'Constructor'],
      exerciseTitles: [
        'Tạo lớp SinhVien với constructor và phương thức hiển thị',
        'Mô hình hóa lớp Course và Enrollment cơ bản',
        'Đọc dữ liệu đầu vào rồi khởi tạo object tương ứng',
      ],
      assessmentTitle: 'Kiểm tra Java cơ bản',
      weakAreas: ['Khai báo lớp', 'Constructor', 'Đóng gói dữ liệu'],
      remediationTitles: [
        'Bài luyện viết class có nhiều constructor',
        'Bài luyện chuẩn hóa getter/setter và validate đầu vào',
      ],
    },
    {
      stage: 2,
      tier: 'Mức trung bình',
      title: 'Đóng gói, kế thừa và đa hình',
      summary: 'Thực hành phân tách vai trò đối tượng, tái sử dụng code và override hành vi.',
      skillCluster: ['OOP Concepts', 'Inheritance', 'Polymorphism'],
      exerciseTitles: [
        'Xây cây kế thừa Person - Student - Lecturer',
        'Override phương thức tính điểm theo từng loại bài tập',
        'Áp dụng interface để chuẩn hóa hành vi chấm điểm',
      ],
      assessmentTitle: 'Kiểm tra kế thừa và đa hình',
      weakAreas: ['Override', 'Abstract class', 'Interface'],
      remediationTitles: [
        'Bài luyện override nhiều cấp',
        'Bài luyện chọn abstract class hay interface',
        'Bài luyện tách trách nhiệm lớp con',
      ],
    },
    {
      stage: 3,
      tier: 'Mức khó',
      title: 'Thiết kế lớp và áp dụng mẫu',
      summary: 'Tổ chức code hướng đối tượng rõ ràng, áp dụng design pattern ở mức cơ bản và xử lý GUI đơn giản.',
      skillCluster: ['Design Patterns', 'GUI Programming', 'Class Design'],
      exerciseTitles: [
        'Áp dụng singleton cho cấu hình ứng dụng',
        'Tách service và model cho bài toán quản lý bài tập',
        'Thiết kế giao diện Swing nhỏ hiển thị danh sách sinh viên',
      ],
      assessmentTitle: 'Kiểm tra thiết kế hướng đối tượng',
      weakAreas: ['Phân lớp trách nhiệm', 'Pattern cơ bản', 'Tách UI và logic'],
      remediationTitles: [
        'Bài luyện refactor lớp God Object',
        'Bài luyện áp dụng pattern đơn giản vào bài toán quản lý',
      ],
    },
  ],
};

const getRoadmapBlueprint = (course) => roadmapBlueprints[course.code] || [];

const getStageStatus = (stageLevel, currentLevel) => {
  if (stageLevel < currentLevel) return 'done';
  if (stageLevel === currentLevel) return 'active';
  if (stageLevel === currentLevel + 1) return 'next';
  return 'locked';
};

const getPracticeStatus = (stageStatus, exerciseIndex, exerciseCount) => {
  if (stageStatus === 'done') return 'Đã làm';
  if (stageStatus === 'active') {
    if (exerciseIndex < Math.max(1, Math.min(2, exerciseCount - 1))) return 'Đang mở';
    return 'Sắp mở';
  }
  if (stageStatus === 'next') {
    return exerciseIndex === 0 ? 'Sắp mở' : 'Khóa';
  }
  return 'Khóa';
};

const getAssessmentStatus = (stageStatus) => {
  if (stageStatus === 'done') return 'Đã làm';
  if (stageStatus === 'active') return 'Sắp mở';
  return 'Khóa';
};

const getAssessmentMessage = (stageStatus, exerciseCount) => {
  if (stageStatus === 'done') return 'Đã vượt bài kiểm tra và mở được nhánh tiếp theo.';
  if (stageStatus === 'active') return `Mở sau khi hoàn thành ${exerciseCount} bài trong cấp này.`;
  return 'Khóa cho đến khi hoàn thành cấp trước đó.';
};

export const studentMock = {
  name: 'Nguyễn Văn An',
  studentId: 'SV2023001',
  role: 'Sinh viên',
  goal: 'Node.js',
  currentLevel: 3,
  currentLevelLabel: 'Node.js nền tảng',
  nextLevelLabel: 'Express cơ bản',
  progressPercent: 62,
  weeklyStreak: 6,
  solvedCount: 47,
  focusHours: 18,
  rankLabel: 'Top 18%',
  weakestSkills: ['Bất đồng bộ', 'Xử lý lỗi', 'Thiết kế API'],
};

export const courseCatalog = availableCourses.filter((course) => ALLOWED_COURSE_CODES.includes(course.code)).map((course) => {
  const currentLevel = getCurrentLevel(course.difficulty);
  const roadmapBlueprint = getRoadmapBlueprint(course);
  const totalExercises = roadmapBlueprint.reduce((sum, stage) => sum + stage.exerciseTitles.length + 1, 0);

  return {
    id: toCourseId(course),
    legacyId: course.id,
    name: course.name,
    code: course.code,
    subtitle: course.description,
    instructor: course.instructor,
    credits: course.credits,
    semester: course.semester,
    category: course.category,
    difficulty: course.difficulty,
    thumbnail: course.thumbnail,
    totalExercises,
    currentLevel,
    progressPercent: getProgressPercent(course, currentLevel),
    focus: getFocusTopics(course.topics),
    topics: course.topics,
  };
});

export const courseRoadmaps = Object.fromEntries(
  courseCatalog.map((course) => [
    course.id,
    getRoadmapBlueprint(course).map((stage) => {
      const status = getStageStatus(stage.stage, course.currentLevel);
      const practiceCount = stage.exerciseTitles.length;
      const completedPracticeCount =
        status === 'done' ? practiceCount : status === 'active' ? Math.max(1, practiceCount - 1) : 0;

      return {
        id: `${course.id}-lv-${stage.stage}`,
        level: stage.stage,
        tier: stage.tier,
        title: stage.title,
        status,
        progress: status === 'done' ? 100 : status === 'active' ? course.progressPercent : 0,
        objective: stage.summary,
        unlockedExercises: practiceCount,
        completedPracticeCount,
        focusSkills: stage.skillCluster,
        exercises: stage.exerciseTitles.map((exerciseTitle, exerciseIndex) => ({
          id: `${course.id}-lv-${stage.stage}-practice-${exerciseIndex + 1}`,
          order: exerciseIndex + 1,
          title: exerciseTitle,
          status: getPracticeStatus(status, exerciseIndex, practiceCount),
          duration: `${25 + exerciseIndex * 10} phút`,
        })),
        assessment: {
          title: stage.assessmentTitle,
          passScore: 80,
          status: status === 'done' ? 'Đã vượt' : status === 'active' ? 'Chờ mở' : 'Khóa',
          message: getAssessmentMessage(status, practiceCount),
        },
        remediation: {
          title: 'Nhánh bù khi chưa đạt bài kiểm tra',
          apiLabel: 'Sau này sẽ gọi API ngân hàng đề để lấy bài bù đúng kỹ năng yếu.',
          weaknessTags: stage.weakAreas,
          exercises: stage.remediationTitles,
        },
      };
    }),
  ])
);

export const courseExerciseCatalog = Object.fromEntries(
  courseCatalog.map((course) => [
    course.id,
    getRoadmapBlueprint(course).flatMap((stage) => {
      const stageStatus = getStageStatus(stage.stage, course.currentLevel);
      const difficulty = stage.tier.replace('Mức ', '');

      const practiceExercises = stage.exerciseTitles.map((exerciseTitle, exerciseIndex) => ({
        id: `${course.id}-stage-${stage.stage}-practice-${exerciseIndex + 1}`,
        courseId: course.id,
        order: `${stage.stage}.${exerciseIndex + 1}`,
        title: exerciseTitle,
        level: `Cấp ${stage.stage}`,
        difficulty,
        status: getPracticeStatus(stageStatus, exerciseIndex, stage.exerciseTitles.length),
        objective: stage.summary,
        prompt: `Thực hiện bài luyện "${exerciseTitle}" thuộc ${stage.title} của môn ${course.name}. Hãy viết lời giải đúng yêu cầu, xử lý được trường hợp cơ bản và nêu ngắn gọn vì sao bạn chọn hướng làm đó.`,
        starterCode:
          `// ${course.code} - ${stage.title}\nfunction solve(input) {\n  // TODO: triển khai bài "${exerciseTitle}"\n  return input;\n}\n\nexport default solve;`,
        testCases: [
          `Bám đúng yêu cầu của bài "${exerciseTitle}"`,
          'Xử lý được dữ liệu đầu vào cơ bản',
          'Có cấu trúc lời giải rõ ràng và dễ đọc',
        ],
        suggestedSkills: [...stage.skillCluster, course.code],
        expectedScore: 'Hoàn thành tốt để mở bài kiểm tra cấp',
        masteryFit: `${Math.max(74, 96 - stage.stage * 5 - exerciseIndex * 2)}%`,
        estimatedTime: `${25 + exerciseIndex * 10} phút`,
        reason: `Bài này nằm trong ${stage.tier.toLowerCase()} của môn ${course.name} và được dùng để rèn đúng nhóm kỹ năng ${stage.skillCluster.join(', ')}.`,
        stageLevel: stage.stage,
        type: 'practice',
      }));

      const assessmentExercise = {
        id: `${course.id}-stage-${stage.stage}-assessment`,
        courseId: course.id,
        order: `${stage.stage}.K`,
        title: stage.assessmentTitle,
        level: `Cấp ${stage.stage} - Kiểm tra`,
        difficulty,
        status: getAssessmentStatus(stageStatus),
        objective: `Bài kiểm tra dùng để đánh giá xem bạn đã đủ năng lực vượt qua ${stage.title.toLowerCase()} hay chưa.`,
        prompt: `Hoàn thành bài kiểm tra "${stage.assessmentTitle}" cho môn ${course.name}. Nếu đạt từ 80 điểm trở lên, hệ thống sẽ mở cấp tiếp theo; nếu chưa đạt, hệ thống sẽ gọi ngân hàng đề để lấy bài bù theo đúng kỹ năng yếu.`,
        starterCode:
          `// ${course.code} - ${stage.assessmentTitle}\nfunction solve(input) {\n  // TODO: hoàn thành bài kiểm tra cấp ${stage.stage}\n  return input;\n}\n\nexport default solve;`,
        testCases: [
          'Đúng yêu cầu tổng hợp của cả cấp',
          'Có xử lý biên và dữ liệu lỗi cơ bản',
          'Đủ điều kiện để hệ thống chấm và đánh giá năng lực',
        ],
        suggestedSkills: [...stage.skillCluster, ...stage.weakAreas.slice(0, 2)],
        expectedScore: '>= 80 để mở cấp tiếp theo',
        masteryFit: `${Math.max(72, 90 - stage.stage * 3)}%`,
        estimatedTime: `${45 + stage.exerciseTitles.length * 5} phút`,
        reason: `Đây là bài kiểm tra tổng hợp sau khi hoàn thành các bài luyện của ${stage.title.toLowerCase()}.`,
        stageLevel: stage.stage,
        type: 'assessment',
      };

      return [...practiceExercises, assessmentExercise];
    }),
  ])
);

export const courseWeeklyProgressMap = {
  ...Object.fromEntries(
    courseCatalog.map((course, index) => {
      const base = 18 + index * 4;
      return [
        course.id,
        [
          { name: 'T2', score: base, target: base - 2 },
          { name: 'T3', score: base + 7, target: base + 4 },
          { name: 'T4', score: base + 12, target: base + 10 },
          { name: 'T5', score: base + 18, target: base + 16 },
          { name: 'T6', score: base + 22, target: base + 20 },
          { name: 'T7', score: base + 28, target: base + 26 },
          { name: 'CN', score: Math.min(base + 34, 92), target: Math.min(base + 30, 88) },
        ],
      ];
    })
  ),
};

export const feedbackSummary = [
  {
    id: 'fb-01',
    title: 'Bất đồng bộ chưa ổn định',
    count: 6,
    severity: 'Cao',
    recommendation: 'Ôn lại async/await, Promise.allSettled và cách bọc lỗi bằng try/catch.',
  },
  {
    id: 'fb-02',
    title: 'Thiếu nhánh xử lý lỗi đầu vào',
    count: 4,
    severity: 'Trung bình',
    recommendation: 'Tạo checklist validate dữ liệu đầu vào trước khi xử lý logic chính.',
  },
  {
    id: 'fb-03',
    title: 'Thiếu chuẩn hóa phản hồi API',
    count: 3,
    severity: 'Trung bình',
    recommendation: 'Thống nhất format lỗi gồm mã lỗi, message và dữ liệu bổ sung.',
  },
];

export const feedbackHistory = [
  {
    id: 'err-01',
    exercise: 'Đọc file JSON cấu hình',
    course: 'Node.js',
    errorType: 'Parse JSON lỗi',
    where: 'Nhánh xử lý dữ liệu đầu vào',
    note: 'Thiếu try/catch khi `JSON.parse` gặp dữ liệu sai định dạng.',
    improvement: 'Bọc parse trong try/catch và trả mã lỗi `INVALID_JSON` rõ ràng.',
    lastSeen: '2 giờ trước',
  },
  {
    id: 'err-02',
    exercise: 'Middleware kiểm tra dữ liệu',
    course: 'Node.js',
    errorType: 'Thiếu validate trường bắt buộc',
    where: 'Middleware request',
    note: 'Request thiếu email nhưng vẫn cho đi tiếp vào controller.',
    improvement: 'Kiểm tra đủ trường bắt buộc trước khi gọi `next()`.',
    lastSeen: 'Hôm qua',
  },
  {
    id: 'err-03',
    exercise: 'Bộ đếm dùng useState',
    course: 'React.js',
    errorType: 'Cập nhật state sai hướng',
    where: 'Event handler',
    note: 'Logic reset và tăng giá trị bị viết lẫn nhau.',
    improvement: 'Tách handler rõ ràng, mỗi nút chỉ làm đúng một nhiệm vụ.',
    lastSeen: '3 ngày trước',
  },
];

export const softSkillRadar = [
  { skill: 'Giao tiếp', value: 4.2, fullMark: 5 },
  { skill: 'Hợp tác', value: 4.0, fullMark: 5 },
  { skill: 'Quản lý thời gian', value: 3.8, fullMark: 5 },
  { skill: 'Giải quyết vấn đề', value: 4.5, fullMark: 5 },
  { skill: 'Tư duy phản biện', value: 4.1, fullMark: 5 },
  { skill: 'Trình bày ý tưởng', value: 3.7, fullMark: 5 },
];

export const softSkillCards = [
  {
    id: 'soft-01',
    title: 'Giải quyết vấn đề',
    score: '4.5/5',
    description: 'Bạn có xu hướng chia nhỏ lỗi trước khi sửa và thử nhiều hướng kiểm tra khác nhau.',
  },
  {
    id: 'soft-02',
    title: 'Hợp tác',
    score: '4.0/5',
    description: 'Qua các bài nhóm, bạn phản hồi commit rõ ràng và giữ nhịp phối hợp khá ổn định.',
  },
  {
    id: 'soft-03',
    title: 'Quản lý thời gian',
    score: '3.8/5',
    description: 'Bạn duy trì được nhịp làm bài đều, nhưng vẫn nên chia block luyện tập ngắn hơn.',
  },
  {
    id: 'soft-04',
    title: 'Trình bày ý tưởng',
    score: '3.7/5',
    description: 'Bạn giải thích được hướng làm, nhưng cần viết nhận xét ngắn gọn và mạch lạc hơn.',
  },
];

export const softSkillEvidence = [
  'Bạn thường ghi chú lại lỗi sau mỗi lần nộp bài và biết rút mẫu lỗi lặp lại.',
  'Bạn duy trì chuỗi luyện tập 6 ngày liên tiếp, cho thấy tính kỷ luật tốt.',
  'Bạn bắt đầu tách vấn đề thành từng bước nhỏ trước khi sửa, giúp giảm lỗi lan truyền.',
  'Bạn phản hồi nhanh hơn ở các bài nhóm và có xu hướng hỏi lại khi yêu cầu chưa rõ.',
];

export const overviewMetrics = [
  { id: 'level', title: 'Cấp độ hiện tại', value: 'Lv 3', subtitle: 'Node.js nền tảng', tone: 'primary' },
  { id: 'progress', title: 'Tiến độ lộ trình', value: '62%', subtitle: 'Đã mở 13/21 bài', tone: 'info' },
  { id: 'streak', title: 'Chuỗi luyện tập', value: '6 ngày', subtitle: 'Ổn định trong tuần này', tone: 'success' },
  { id: 'focus', title: 'Giờ tập trung', value: '18h', subtitle: 'Tuần hiện tại', tone: 'warning' },
];

export const weeklyProgress = [
  { name: 'T2', score: 45, target: 40 },
  { name: 'T3', score: 58, target: 48 },
  { name: 'T4', score: 55, target: 56 },
  { name: 'T5', score: 72, target: 62 },
  { name: 'T6', score: 68, target: 66 },
  { name: 'T7', score: 79, target: 72 },
  { name: 'CN', score: 83, target: 76 },
];

export const todayPlan = [
  {
    id: 'plan-1',
    title: 'Hôm nay bạn nên làm bài nào',
    headline: 'Xử lý tệp cấu hình bằng Node.js',
    detail: 'Bài này bám đúng phần bạn còn yếu ở async/await và đọc ghi file.',
    cta: 'Mở bài thực hành',
  },
  {
    id: 'plan-2',
    title: 'Bạn đang yếu ở đâu',
    headline: 'Bất đồng bộ và kiểm soát lỗi',
    detail: '3 bài gần nhất mất điểm ở promise chain, try/catch và xử lý response lỗi.',
    cta: 'Xem phân tích năng lực',
  },
  {
    id: 'plan-3',
    title: 'Sau bài này nên chuyển sang mức nào',
    headline: 'Lv 4 - Express cơ bản',
    detail: 'Nếu bài hôm nay đạt từ 80 điểm trở lên, bạn có thể mở nhánh API đầu tiên.',
    cta: 'Xem khóa học',
  },
];

export const recommendedExercises = [
  {
    id: 'ex-node-01',
    title: 'Đọc file JSON cấu hình và chuẩn hóa dữ liệu',
    level: 'Lv 3',
    difficulty: 'Trung bình',
    estimatedTime: '35 phút',
    masteryFit: '92%',
    skillTags: ['fs/promises', 'JSON', 'try/catch'],
    reason: 'Phù hợp nhất với phần kiến thức bạn đang luyện và giúp vá điểm yếu ở xử lý lỗi.',
  },
  {
    id: 'ex-node-02',
    title: 'Viết hàm gom log lỗi bất đồng bộ',
    level: 'Lv 3',
    difficulty: 'Trung bình',
    estimatedTime: '30 phút',
    masteryFit: '88%',
    skillTags: ['async/await', 'Promise', 'logging'],
    reason: 'Bài bổ trợ để tăng độ chắc chắn trước khi sang phần Express middleware.',
  },
  {
    id: 'ex-node-03',
    title: 'Tạo API kiểm tra trạng thái máy chủ bằng Express',
    level: 'Lv 4',
    difficulty: 'Nâng cao',
    estimatedTime: '45 phút',
    masteryFit: '74%',
    skillTags: ['Express', 'routing', 'response'],
    reason: 'Bài mở khóa cho cấp tiếp theo, chỉ nên làm sau khi hoàn thành 2 bài ở Lv 3.',
  },
];

export const assessmentPreview = {
  score: 78,
  status: 'Tiệm cận đạt',
  message:
    'Bạn xử lý đúng đầu vào hợp lệ nhưng vẫn mất điểm ở nhánh lỗi JSON và cấu hình thiếu trường.',
  weakAreas: [
    'Thiếu nhánh kiểm tra dữ liệu rỗng',
    'Thông báo lỗi chưa chuẩn hóa',
    'Chưa dùng try/catch đủ rõ cho parse JSON',
  ],
  strengths: ['Đọc file đúng', 'Chuẩn hóa name và port tốt'],
  nextAction: 'Làm thêm 1 bài bổ trợ về xử lý lỗi trước khi mở bài Express đầu tiên.',
};

export const recentAttempts = [
  { id: 'attempt-1', title: 'Đọc file JSON cấu hình', score: 78, status: 'Đang cần củng cố', note: 'Sai ở nhánh lỗi JSON' },
  { id: 'attempt-2', title: 'Tạo bộ lọc URL bằng Express', score: 69, status: 'Cần luyện thêm', note: 'Sai validate query' },
  { id: 'attempt-3', title: 'Tách module tiện ích', score: 91, status: 'Đã nắm chắc', note: 'Có thể bỏ qua bài tương tự' },
];

export const profileHighlights = [
  { label: 'Mục tiêu đang luyện', value: 'Node.js' },
  { label: 'Bài đã hoàn thành', value: '47' },
  { label: 'Chuỗi luyện tập', value: '6 ngày' },
  { label: 'Xếp hạng tương đối', value: 'Top 18%' },
];

export const friendSuggestions = [
  {
    id: 'friend-01',
    name: 'Trần Minh Khoa',
    avatar: '👨‍💻',
    studentId: 'SV2023045',
    matchScore: 94,
    commonCourses: ['IT3080', 'IT3090'],
    commonSkills: ['React.js', 'Node.js', 'JavaScript ES6+'],
    currentLevel: 'Lv 3 - Node.js nền tảng',
    weeklyStreak: 7,
    solvedCount: 52,
    strengthArea: 'Bất đồng bộ và API',
    reason: 'Cùng đang luyện Node.js và có điểm mạnh ở phần bạn đang yếu',
  },
  {
    id: 'friend-02',
    name: 'Nguyễn Thu Hà',
    avatar: '👩‍💻',
    studentId: 'SV2023067',
    matchScore: 89,
    commonCourses: ['IT3080', 'IT3100'],
    commonSkills: ['React.js', 'Database Design', 'SQL'],
    currentLevel: 'Lv 2 - JavaScript DOM',
    weeklyStreak: 5,
    solvedCount: 41,
    strengthArea: 'Thiết kế giao diện',
    reason: 'Cùng học IT3080 và có phong cách code tương đồng',
  },
  {
    id: 'friend-03',
    name: 'Lê Hoàng Nam',
    avatar: '🧑‍💻',
    studentId: 'SV2023089',
    matchScore: 86,
    commonCourses: ['IT3090', 'IT2030'],
    commonSkills: ['Cấu trúc dữ liệu', 'Thuật toán', 'Java OOP'],
    currentLevel: 'Lv 3 - Cây và đồ thị',
    weeklyStreak: 8,
    solvedCount: 58,
    strengthArea: 'Thuật toán tối ưu',
    reason: 'Cùng quan tâm cấu trúc dữ liệu và có chuỗi luyện tập ổn định',
  },
  {
    id: 'friend-04',
    name: 'Phạm Thị Lan',
    avatar: '👩‍💼',
    studentId: 'SV2023102',
    matchScore: 82,
    commonCourses: ['IT3100'],
    commonSkills: ['SQL', 'Database Design', 'Normalization'],
    currentLevel: 'Lv 2 - Thiết kế CSDL',
    weeklyStreak: 4,
    solvedCount: 38,
    strengthArea: 'Chuẩn hóa dữ liệu',
    reason: 'Cùng học IT3100 và có thời gian luyện tập tương đồng',
  },
];
