// Mock data cho Student Learning Dashboard

export const studentInfo = {
  name: "Nguyễn Văn An",
  studentId: "SV2023001",
  class: "CNTT K18",
  course: "Lập trình Web",
  avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+An&background=3b82f6&color=fff&size=128",
  level: "Intermediate",
  averageScore: 8.2,
  progress: 72,
  riskLevel: "Low", // Low, Medium, High
  totalCredits: 45,
  currentSemester: "HK2 2024-2025"
};

// Hàm tạo dữ liệu tiến độ dựa trên khóa học đã đăng ký
export const generateProgressData = (enrolledCourses) => {
  if (!enrolledCourses || enrolledCourses.length === 0) {
    return [];
  }

  const weeks = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5", "Tuần 6", "Tuần 7", "Tuần 8"];
  
  return weeks.map((week, index) => {
    // Tính tiến độ thực tế dựa trên số bài tập đã hoàn thành
    const totalExercises = enrolledCourses.reduce((sum, course) => {
      return sum + (courseExercises[course.id]?.length || 0);
    }, 0);
    
    const completedExercises = enrolledCourses.reduce((sum, course) => {
      const courseExs = courseExercises[course.id] || [];
      return sum + courseExs.filter(ex => ex.completed).length;
    }, 0);
    
    // Tiến độ thực tế tăng dần theo tuần
    const actualProgress = Math.min(100, Math.round((completedExercises / totalExercises) * 100));
    const weeklyProgress = Math.min(100, Math.round(((index + 1) / weeks.length) * actualProgress));
    
    // Mục tiêu tăng đều theo tuần
    const targetProgress = Math.round(((index + 1) / weeks.length) * 100);
    
    return {
      week,
      progress: weeklyProgress,
      target: targetProgress,
      completedExercises: Math.round((weeklyProgress / 100) * completedExercises),
      totalExercises
    };
  });
};

// Dữ liệu mẫu cho demo (khi chưa có khóa học)
export const sampleProgressData = [
  { week: "Tuần 1", progress: 15, target: 20, completedExercises: 2, totalExercises: 15 },
  { week: "Tuần 2", progress: 28, target: 35, completedExercises: 4, totalExercises: 15 },
  { week: "Tuần 3", progress: 42, target: 50, completedExercises: 6, totalExercises: 15 },
  { week: "Tuần 4", progress: 55, target: 65, completedExercises: 8, totalExercises: 15 },
  { week: "Tuần 5", progress: 68, target: 75, completedExercises: 10, totalExercises: 15 },
  { week: "Tuần 6", progress: 78, target: 85, completedExercises: 12, totalExercises: 15 },
  { week: "Tuần 7", progress: 85, target: 90, completedExercises: 13, totalExercises: 15 },
  { week: "Tuần 8", progress: 92, target: 100, completedExercises: 14, totalExercises: 15 }
];

export const kpiData = {
  completionRate: 72,
  submittedAssignments: 12,
  totalAssignments: 15,
  averageScore: 8.2,
  studyHoursPerWeek: 18,
  classRank: 5,
  totalStudents: 45
};

export const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Bài tập chưa nộp",
    message: "Bạn chưa nộp bài tập 13 - Deadline: 29/10/2025",
    time: "2 giờ trước",
    icon: "⚠️"
  },
  {
    id: 2,
    type: "info",
    title: "Bài kiểm tra sắp tới",
    message: "Kiểm tra giữa kỳ môn Lập trình Web - Ngày 05/11/2025",
    time: "1 ngày trước",
    icon: "📅"
  },
  {
    id: 3,
    type: "success",
    title: "Hoàn thành xuất sắc",
    message: "Bạn đã đạt 10 điểm cho bài tập 12 - React Components",
    time: "3 ngày trước",
    icon: "🎉"
  },
  {
    id: 4,
    type: "warning",
    title: "Điểm thấp",
    message: "Điểm bài 10 (6.5) thấp hơn trung bình lớp (7.8)",
    time: "5 ngày trước",
    icon: "📊"
  }
];

// Bài tập theo từng khóa học (mỗi khóa học có 5 bài tập)
export const courseExercises = {
  1: [ // Lập trình Web (IT3080)
    {
      id: 101,
      courseId: 1,
      courseName: "Lập trình Web",
      title: "Xây dựng Landing Page với HTML/CSS",
      level: "Easy",
      fitPercent: 95,
      description: "Tạo trang landing page responsive với HTML5 và CSS3",
      estimatedTime: "2 giờ",
      skills: ["HTML", "CSS", "Responsive Design"],
      completed: false,
      points: 10
    },
    {
      id: 102,
      courseId: 1,
      courseName: "Lập trình Web",
      title: "JavaScript DOM Manipulation",
      level: "Medium",
      fitPercent: 90,
      description: "Thao tác với DOM, xử lý events và tạo interactive elements",
      estimatedTime: "3 giờ",
      skills: ["JavaScript", "DOM", "Events"],
      completed: false,
      points: 10
    },
    {
      id: 103,
      courseId: 1,
      courseName: "Lập trình Web",
      title: "Xây dựng Todo App với React",
      level: "Medium",
      fitPercent: 88,
      description: "Tạo ứng dụng quản lý công việc với React Hooks",
      estimatedTime: "4 giờ",
      skills: ["React", "Hooks", "State Management"],
      completed: false,
      points: 10
    },
    {
      id: 104,
      courseId: 1,
      courseName: "Lập trình Web",
      title: "Tích hợp API với React",
      level: "Hard",
      fitPercent: 85,
      description: "Kết nối API RESTful và hiển thị dữ liệu động",
      estimatedTime: "5 giờ",
      skills: ["React", "API", "Fetch", "Async/Await"],
      completed: false,
      points: 10
    },
    {
      id: 105,
      courseId: 1,
      courseName: "Lập trình Web",
      title: "Xây dựng Dashboard với React",
      level: "Hard",
      fitPercent: 92,
      description: "Tạo dashboard hoàn chỉnh với charts và real-time data",
      estimatedTime: "6 giờ",
      skills: ["React", "Charts", "Tailwind CSS"],
      completed: false,
      points: 10
    }
  ],
  2: [ // Cấu trúc Dữ liệu & Giải thuật (IT3090)
    {
      id: 201,
      courseId: 2,
      courseName: "Cấu trúc Dữ liệu & Giải thuật",
      title: "Implement Array và Linked List",
      level: "Medium",
      fitPercent: 90,
      description: "Cài đặt các thao tác cơ bản trên Array và Linked List",
      estimatedTime: "3 giờ",
      skills: ["Data Structures", "Arrays", "Linked List"],
      completed: false,
      points: 10
    },
    {
      id: 202,
      courseId: 2,
      courseName: "Cấu trúc Dữ liệu & Giải thuật",
      title: "Stack và Queue Applications",
      level: "Medium",
      fitPercent: 88,
      description: "Giải quyết bài toán thực tế với Stack và Queue",
      estimatedTime: "3 giờ",
      skills: ["Stack", "Queue", "Problem Solving"],
      completed: false,
      points: 10
    },
    {
      id: 203,
      courseId: 2,
      courseName: "Cấu trúc Dữ liệu & Giải thuật",
      title: "Binary Tree Traversal",
      level: "Hard",
      fitPercent: 85,
      description: "Cài đặt các phương pháp duyệt cây nhị phân",
      estimatedTime: "4 giờ",
      skills: ["Trees", "Recursion", "Traversal"],
      completed: false,
      points: 10
    },
    {
      id: 204,
      courseId: 2,
      courseName: "Cấu trúc Dữ liệu & Giải thuật",
      title: "Sorting Algorithms",
      level: "Hard",
      fitPercent: 87,
      description: "Implement và so sánh các thuật toán sắp xếp",
      estimatedTime: "5 giờ",
      skills: ["Sorting", "Algorithms", "Complexity Analysis"],
      completed: false,
      points: 10
    },
    {
      id: 205,
      courseId: 2,
      courseName: "Cấu trúc Dữ liệu & Giải thuật",
      title: "Graph Algorithms",
      level: "Hard",
      fitPercent: 82,
      description: "BFS, DFS và tìm đường đi ngắn nhất trên đồ thị",
      estimatedTime: "6 giờ",
      skills: ["Graph", "BFS", "DFS", "Dijkstra"],
      completed: false,
      points: 10
    }
  ],
  3: [ // Cơ sở Dữ liệu (IT3100)
    {
      id: 301,
      courseId: 3,
      courseName: "Cơ sở Dữ liệu",
      title: "Thiết kế Database Schema",
      level: "Medium",
      fitPercent: 92,
      description: "Thiết kế schema cho hệ thống quản lý thư viện",
      estimatedTime: "3 giờ",
      skills: ["Database Design", "ERD", "Normalization"],
      completed: false,
      points: 10
    },
    {
      id: 302,
      courseId: 3,
      courseName: "Cơ sở Dữ liệu",
      title: "SQL Queries - Basic",
      level: "Easy",
      fitPercent: 95,
      description: "Viết các câu truy vấn SQL cơ bản (SELECT, WHERE, JOIN)",
      estimatedTime: "2 giờ",
      skills: ["SQL", "SELECT", "JOIN"],
      completed: false,
      points: 10
    },
    {
      id: 303,
      courseId: 3,
      courseName: "Cơ sở Dữ liệu",
      title: "SQL Queries - Advanced",
      level: "Hard",
      fitPercent: 88,
      description: "Subqueries, Views, Stored Procedures và Triggers",
      estimatedTime: "4 giờ",
      skills: ["SQL", "Subqueries", "Stored Procedures"],
      completed: false,
      points: 10
    },
    {
      id: 304,
      courseId: 3,
      courseName: "Cơ sở Dữ liệu",
      title: "Database Optimization",
      level: "Hard",
      fitPercent: 85,
      description: "Tối ưu hóa queries, indexing và performance tuning",
      estimatedTime: "5 giờ",
      skills: ["Optimization", "Indexing", "Performance"],
      completed: false,
      points: 10
    },
    {
      id: 305,
      courseId: 3,
      courseName: "Cơ sở Dữ liệu",
      title: "NoSQL với MongoDB",
      level: "Medium",
      fitPercent: 90,
      description: "Làm việc với MongoDB và thiết kế document-based database",
      estimatedTime: "4 giờ",
      skills: ["MongoDB", "NoSQL", "Document DB"],
      completed: false,
      points: 10
    }
  ],
  4: [ // Mạng Máy tính (IT3110)
    {
      id: 401,
      courseId: 4,
      courseName: "Mạng Máy tính",
      title: "Network Fundamentals Lab",
      level: "Easy",
      fitPercent: 90,
      description: "Thực hành cấu hình mạng cơ bản và IP addressing",
      estimatedTime: "2 giờ",
      skills: ["Networking", "IP", "Subnetting"],
      completed: false,
      points: 10
    },
    {
      id: 402,
      courseId: 4,
      courseName: "Mạng Máy tính",
      title: "TCP/IP Protocol Analysis",
      level: "Medium",
      fitPercent: 87,
      description: "Phân tích gói tin TCP/IP với Wireshark",
      estimatedTime: "3 giờ",
      skills: ["TCP/IP", "Wireshark", "Protocol Analysis"],
      completed: false,
      points: 10
    },
    {
      id: 403,
      courseId: 4,
      courseName: "Mạng Máy tính",
      title: "Router Configuration",
      level: "Hard",
      fitPercent: 85,
      description: "Cấu hình router và routing protocols",
      estimatedTime: "4 giờ",
      skills: ["Routing", "OSPF", "RIP"],
      completed: false,
      points: 10
    },
    {
      id: 404,
      courseId: 4,
      courseName: "Mạng Máy tính",
      title: "Network Security Lab",
      level: "Hard",
      fitPercent: 88,
      description: "Thực hành firewall, VPN và bảo mật mạng",
      estimatedTime: "5 giờ",
      skills: ["Security", "Firewall", "VPN"],
      completed: false,
      points: 10
    },
    {
      id: 405,
      courseId: 4,
      courseName: "Mạng Máy tính",
      title: "Wireless Network Setup",
      level: "Medium",
      fitPercent: 92,
      description: "Cấu hình và bảo mật mạng không dây",
      estimatedTime: "3 giờ",
      skills: ["WiFi", "Wireless Security", "Access Point"],
      completed: false,
      points: 10
    }
  ],
  5: [ // Tiếng Anh Chuyên ngành (FL2100)
    {
      id: 501,
      courseId: 5,
      courseName: "Tiếng Anh Chuyên ngành",
      title: "Technical Vocabulary Practice",
      level: "Easy",
      fitPercent: 95,
      description: "Học từ vựng chuyên ngành CNTT thông dụng",
      estimatedTime: "1 giờ",
      skills: ["Vocabulary", "IT Terms"],
      completed: false,
      points: 10
    },
    {
      id: 502,
      courseId: 5,
      courseName: "Tiếng Anh Chuyên ngành",
      title: "Reading Comprehension",
      level: "Medium",
      fitPercent: 90,
      description: "Đọc hiểu tài liệu kỹ thuật và documentation",
      estimatedTime: "2 giờ",
      skills: ["Reading", "Comprehension"],
      completed: false,
      points: 10
    },
    {
      id: 503,
      courseId: 5,
      courseName: "Tiếng Anh Chuyên ngành",
      title: "Technical Writing",
      level: "Medium",
      fitPercent: 88,
      description: "Viết email, báo cáo kỹ thuật bằng tiếng Anh",
      estimatedTime: "2.5 giờ",
      skills: ["Writing", "Technical Writing"],
      completed: false,
      points: 10
    },
    {
      id: 504,
      courseId: 5,
      courseName: "Tiếng Anh Chuyên ngành",
      title: "Presentation Skills",
      level: "Hard",
      fitPercent: 85,
      description: "Thuyết trình dự án công nghệ bằng tiếng Anh",
      estimatedTime: "3 giờ",
      skills: ["Presentation", "Public Speaking"],
      completed: false,
      points: 10
    },
    {
      id: 505,
      courseId: 5,
      courseName: "Tiếng Anh Chuyên ngành",
      title: "TOEIC Practice Test",
      level: "Medium",
      fitPercent: 92,
      description: "Luyện thi TOEIC với đề thi mẫu",
      estimatedTime: "2 giờ",
      skills: ["TOEIC", "Test Preparation"],
      completed: false,
      points: 10
    }
  ],
  6: [ // Lập trình Hướng đối tượng (IT2030)
    {
      id: 601,
      courseId: 6,
      courseName: "Lập trình Hướng đối tượng",
      title: "OOP Concepts Implementation",
      level: "Medium",
      fitPercent: 92,
      description: "Implement các khái niệm OOP cơ bản trong Java",
      estimatedTime: "3 giờ",
      skills: ["Java", "OOP", "Classes"],
      completed: false,
      points: 10
    },
    {
      id: 602,
      courseId: 6,
      courseName: "Lập trình Hướng đối tượng",
      title: "Inheritance và Polymorphism",
      level: "Hard",
      fitPercent: 88,
      description: "Áp dụng kế thừa và đa hình trong bài toán thực tế",
      estimatedTime: "4 giờ",
      skills: ["Inheritance", "Polymorphism", "Java"],
      completed: false,
      points: 10
    },
    {
      id: 603,
      courseId: 6,
      courseName: "Lập trình Hướng đối tượng",
      title: "Design Patterns - Creational",
      level: "Hard",
      fitPercent: 85,
      description: "Implement Singleton, Factory, Builder patterns",
      estimatedTime: "5 giờ",
      skills: ["Design Patterns", "Java", "Best Practices"],
      completed: false,
      points: 10
    },
    {
      id: 604,
      courseId: 6,
      courseName: "Lập trình Hướng đối tượng",
      title: "Exception Handling",
      level: "Medium",
      fitPercent: 90,
      description: "Xử lý ngoại lệ và error handling trong Java",
      estimatedTime: "3 giờ",
      skills: ["Exception Handling", "Java", "Error Handling"],
      completed: false,
      points: 10
    },
    {
      id: 605,
      courseId: 6,
      courseName: "Lập trình Hướng đối tượng",
      title: "GUI Application với Swing",
      level: "Hard",
      fitPercent: 87,
      description: "Xây dựng ứng dụng desktop với Java Swing",
      estimatedTime: "6 giờ",
      skills: ["Java Swing", "GUI", "Event Handling"],
      completed: false,
      points: 10
    }
  ],
  7: [ // Trí tuệ Nhân tạo (IT4050)
    {
      id: 701,
      courseId: 7,
      courseName: "Trí tuệ Nhân tạo",
      title: "AI Fundamentals Quiz",
      level: "Easy",
      fitPercent: 90,
      description: "Tìm hiểu các khái niệm cơ bản về AI",
      estimatedTime: "2 giờ",
      skills: ["AI", "Machine Learning Basics"],
      completed: false,
      points: 10
    },
    {
      id: 702,
      courseId: 7,
      courseName: "Trí tuệ Nhân tạo",
      title: "Linear Regression Implementation",
      level: "Medium",
      fitPercent: 88,
      description: "Cài đặt thuật toán Linear Regression từ đầu",
      estimatedTime: "4 giờ",
      skills: ["Machine Learning", "Python", "NumPy"],
      completed: false,
      points: 10
    },
    {
      id: 703,
      courseId: 7,
      courseName: "Trí tuệ Nhân tạo",
      title: "Neural Network from Scratch",
      level: "Hard",
      fitPercent: 80,
      description: "Xây dựng mạng neural đơn giản không dùng framework",
      estimatedTime: "6 giờ",
      skills: ["Neural Networks", "Backpropagation", "Python"],
      completed: false,
      points: 10
    },
    {
      id: 704,
      courseId: 7,
      courseName: "Trí tuệ Nhân tạo",
      title: "Image Classification với CNN",
      level: "Hard",
      fitPercent: 85,
      description: "Huấn luyện mô hình CNN để phân loại hình ảnh",
      estimatedTime: "8 giờ",
      skills: ["CNN", "TensorFlow", "Image Processing"],
      completed: false,
      points: 10
    },
    {
      id: 705,
      courseId: 7,
      courseName: "Trí tuệ Nhân tạo",
      title: "NLP Text Classification",
      level: "Hard",
      fitPercent: 82,
      description: "Phân loại văn bản với Natural Language Processing",
      estimatedTime: "7 giờ",
      skills: ["NLP", "Text Mining", "Python"],
      completed: false,
      points: 10
    }
  ],
  8: [ // Phát triển Ứng dụng Mobile (IT4060)
    {
      id: 801,
      courseId: 8,
      courseName: "Phát triển Ứng dụng Mobile",
      title: "React Native Setup & Hello World",
      level: "Easy",
      fitPercent: 95,
      description: "Cài đặt môi trường và tạo ứng dụng đầu tiên",
      estimatedTime: "2 giờ",
      skills: ["React Native", "Setup", "Basics"],
      completed: false,
      points: 10
    },
    {
      id: 802,
      courseId: 8,
      courseName: "Phát triển Ứng dụng Mobile",
      title: "Mobile UI Components",
      level: "Medium",
      fitPercent: 90,
      description: "Xây dựng giao diện với React Native components",
      estimatedTime: "3 giờ",
      skills: ["React Native", "UI", "Components"],
      completed: false,
      points: 10
    },
    {
      id: 803,
      courseId: 8,
      courseName: "Phát triển Ứng dụng Mobile",
      title: "Navigation trong Mobile App",
      level: "Medium",
      fitPercent: 88,
      description: "Implement navigation với React Navigation",
      estimatedTime: "4 giờ",
      skills: ["Navigation", "React Navigation", "Routing"],
      completed: false,
      points: 10
    },
    {
      id: 804,
      courseId: 8,
      courseName: "Phát triển Ứng dụng Mobile",
      title: "API Integration Mobile",
      level: "Hard",
      fitPercent: 87,
      description: "Kết nối API và quản lý state trong mobile app",
      estimatedTime: "5 giờ",
      skills: ["API", "Fetch", "State Management"],
      completed: false,
      points: 10
    },
    {
      id: 805,
      courseId: 8,
      courseName: "Phát triển Ứng dụng Mobile",
      title: "Build & Deploy Mobile App",
      level: "Hard",
      fitPercent: 85,
      description: "Build APK/IPA và deploy lên store",
      estimatedTime: "6 giờ",
      skills: ["Build", "Deploy", "App Store"],
      completed: false,
      points: 10
    }
  ]
};

export const learningPath = [
  {
    id: 1,
    title: "HTML & CSS Cơ bản",
    status: "completed",
    date: "Tuần 1-2"
  },
  {
    id: 2,
    title: "JavaScript ES6+",
    status: "completed",
    date: "Tuần 3-4"
  },
  {
    id: 3,
    title: "React Fundamentals",
    status: "current",
    date: "Tuần 5-7"
  },
  {
    id: 4,
    title: "State Management",
    status: "upcoming",
    date: "Tuần 8-9"
  },
  {
    id: 5,
    title: "Backend with Node.js",
    status: "upcoming",
    date: "Tuần 10-12"
  }
];

export const errorStats = [
  { type: "Syntax Error", count: 15, color: "#ef4444" },
  { type: "Logic Error", count: 23, color: "#f59e0b" },
  { type: "Runtime Error", count: 8, color: "#8b5cf6" },
  { type: "Style Error", count: 12, color: "#06b6d4" }
];

export const submissions = [
  {
    id: 1,
    assignmentName: "Bài 12 - React Components",
    submittedAt: "25/10/2025 14:30",
    testsPassed: 10,
    testsTotal: 10,
    score: 10,
    status: "passed",
    errors: []
  },
  {
    id: 2,
    assignmentName: "Bài 11 - JavaScript Advanced",
    submittedAt: "20/10/2025 16:45",
    testsPassed: 7,
    testsTotal: 10,
    score: 7.5,
    status: "partial",
    errors: [
      {
        type: "Logic Error",
        description: "Vòng lặp không xử lý trường hợp mảng rỗng",
        suggestion: "Thêm kiểm tra if (array.length === 0) return null;"
      },
      {
        type: "Runtime Error",
        description: "Cannot read property 'length' of undefined",
        suggestion: "Kiểm tra biến trước khi truy cập: if (data && data.length)"
      }
    ]
  },
  {
    id: 3,
    assignmentName: "Bài 10 - DOM Manipulation",
    submittedAt: "15/10/2025 10:20",
    testsPassed: 5,
    testsTotal: 10,
    score: 6.5,
    status: "partial",
    errors: [
      {
        type: "Syntax Error",
        description: "Thiếu dấu ngoặc đóng trong hàm addEventListener",
        suggestion: "Kiểm tra lại cú pháp: addEventListener('click', function() { ... });"
      },
      {
        type: "Logic Error",
        description: "Event listener được gán nhiều lần",
        suggestion: "Xóa listener cũ trước khi thêm mới hoặc dùng flag để kiểm tra"
      }
    ]
  },
  {
    id: 4,
    assignmentName: "Bài 9 - Array Methods",
    submittedAt: "10/10/2025 09:15",
    testsPassed: 8,
    testsTotal: 10,
    score: 8.5,
    status: "passed",
    errors: [
      {
        type: "Logic Error",
        description: "Filter không xử lý đúng điều kiện edge case",
        suggestion: "Xem xét các trường hợp đặc biệt: null, undefined, empty array"
      }
    ]
  }
];

export const softSkills = {
  communication: 4.2,
  teamwork: 4.5,
  timeManagement: 3.8,
  problemSolving: 4.0,
  creativity: 3.5,
  leadership: 3.2
};

export const projects = [
  {
    id: 1,
    name: "Website Thương mại Điện tử",
    role: "Frontend Developer",
    progress: 75,
    deadline: "15/11/2025",
    teamMembers: 4,
    status: "on-track",
    tasks: {
      completed: 12,
      total: 16
    }
  },
  {
    id: 2,
    name: "Ứng dụng Quản lý Thư viện",
    role: "Full-stack Developer",
    progress: 45,
    deadline: "30/11/2025",
    teamMembers: 3,
    status: "at-risk",
    tasks: {
      completed: 9,
      total: 20
    }
  },
  {
    id: 3,
    name: "Dashboard Analytics",
    role: "UI/UX Designer",
    progress: 90,
    deadline: "01/11/2025",
    teamMembers: 2,
    status: "on-track",
    tasks: {
      completed: 18,
      total: 20
    }
  }
];

export const skillImprovements = [
  {
    skill: "Giao tiếp",
    currentLevel: 4.2,
    suggestion: "Tham gia thêm các buổi thuyết trình nhóm và code review để cải thiện kỹ năng trình bày ý tưởng."
  },
  {
    skill: "Quản lý thời gian",
    currentLevel: 3.8,
    suggestion: "Sử dụng phương pháp Pomodoro và lập kế hoạch học tập cụ thể cho từng tuần."
  },
  {
    skill: "Lãnh đạo",
    currentLevel: 3.2,
    suggestion: "Chủ động đảm nhận vai trò team leader trong dự án nhỏ để rèn luyện khả năng điều phối nhóm."
  }
];

export const achievements = [
  {
    id: 1,
    title: "Code Master",
    description: "Hoàn thành 50 bài tập lập trình",
    icon: "🏆",
    earned: true,
    earnedDate: "15/10/2025"
  },
  {
    id: 2,
    title: "Perfect Score",
    description: "Đạt 10 điểm cho 5 bài tập liên tiếp",
    icon: "⭐",
    earned: true,
    earnedDate: "20/10/2025"
  },
  {
    id: 3,
    title: "Team Player",
    description: "Hoàn thành 3 dự án nhóm xuất sắc",
    icon: "🤝",
    earned: false,
    earnedDate: null
  },
  {
    id: 4,
    title: "Early Bird",
    description: "Nộp bài sớm hơn deadline 10 lần",
    icon: "🐦",
    earned: true,
    earnedDate: "18/10/2025"
  },
  {
    id: 5,
    title: "Bug Hunter",
    description: "Tìm và sửa 100 lỗi",
    icon: "🐛",
    earned: false,
    earnedDate: null
  },
  {
    id: 6,
    title: "Fast Learner",
    description: "Hoàn thành khóa học trong 80% thời gian",
    icon: "⚡",
    earned: false,
    earnedDate: null
  }
];

export const studyStats = {
  totalAssignments: 15,
  completedAssignments: 12,
  totalProjects: 3,
  completedProjects: 1,
  totalStudyHours: 126,
  averageScore: 8.2,
  highestScore: 10,
  lowestScore: 6.5,
  currentStreak: 7,
  longestStreak: 12
};

// Danh sách tất cả khóa học có sẵn (catalog)
export const availableCourses = [
  {
    id: 1,
    name: "Lập trình Web",
    code: "IT3080",
    instructor: "TS. Nguyễn Văn A",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 2, 4 (7:00-9:30)",
    room: "D3-201",
    category: "Chuyên ngành bắt buộc",
    description: "Học về HTML, CSS, JavaScript, React và các công nghệ web hiện đại",
    maxStudents: 60,
    enrolled: 45,
    difficulty: "Intermediate",
    duration: "15 tuần",
    thumbnail: "🌐",
    topics: [
      { name: "HTML & CSS", description: "Xây dựng giao diện web cơ bản" },
      { name: "JavaScript ES6+", description: "Lập trình JavaScript hiện đại" },
      { name: "React Basics", description: "Framework React cơ bản" },
      { name: "State Management", description: "Quản lý state với hooks" },
      { name: "Backend Integration", description: "Kết nối API và backend" }
    ]
  },
  {
    id: 2,
    name: "Cấu trúc Dữ liệu & Giải thuật",
    code: "IT3090",
    instructor: "PGS.TS. Trần Thị B",
    credits: 4,
    semester: "HK2 2024-2025",
    schedule: "Thứ 3, 5 (13:00-15:30)",
    room: "D9-305",
    category: "Chuyên ngành bắt buộc",
    description: "Nghiên cứu các cấu trúc dữ liệu và thuật toán cơ bản",
    maxStudents: 50,
    enrolled: 38,
    difficulty: "Advanced",
    duration: "15 tuần",
    thumbnail: "🔢",
    topics: [
      { name: "Array & Linked List", description: "Cấu trúc dữ liệu tuyến tính" },
      { name: "Stack & Queue", description: "Ngăn xếp và hàng đợi" },
      { name: "Tree & Graph", description: "Cấu trúc phi tuyến" },
      { name: "Sorting Algorithms", description: "Các thuật toán sắp xếp" },
      { name: "Dynamic Programming", description: "Quy hoạch động" }
    ]
  },
  {
    id: 3,
    name: "Cơ sở Dữ liệu",
    code: "IT3100",
    instructor: "TS. Lê Văn C",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 6 (9:00-12:00)",
    room: "D3-105",
    category: "Chuyên ngành bắt buộc",
    description: "Thiết kế và quản lý cơ sở dữ liệu quan hệ",
    maxStudents: 55,
    enrolled: 42,
    difficulty: "Intermediate",
    duration: "15 tuần",
    thumbnail: "💾",
    topics: [
      { name: "SQL Basics", description: "Ngôn ngữ SQL cơ bản" },
      { name: "Database Design", description: "Thiết kế CSDL" },
      { name: "Advanced SQL", description: "SQL nâng cao" },
      { name: "Optimization", description: "Tối ưu hóa truy vấn" },
      { name: "NoSQL", description: "Cơ sở dữ liệu phi quan hệ" }
    ]
  },
  {
    id: 4,
    name: "Mạng Máy tính",
    code: "IT3110",
    instructor: "TS. Phạm Thị D",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 7 (7:00-10:00)",
    room: "D5-401",
    category: "Chuyên ngành bắt buộc",
    description: "Các giao thức mạng, TCP/IP, và bảo mật mạng",
    maxStudents: 45,
    enrolled: 35,
    difficulty: "Intermediate",
    duration: "15 tuần",
    thumbnail: "🌐",
    topics: [
      { name: "Network Fundamentals", description: "Kiến thức nền tảng" },
      { name: "TCP/IP Protocol", description: "Giao thức TCP/IP" },
      { name: "Routing & Switching", description: "Định tuyến và chuyển mạch" },
      { name: "Network Security", description: "Bảo mật mạng" },
      { name: "Wireless Networks", description: "Mạng không dây" }
    ]
  },
  {
    id: 5,
    name: "Tiếng Anh Chuyên ngành",
    code: "FL2100",
    instructor: "ThS. Hoàng Thị E",
    credits: 2,
    semester: "HK2 2024-2025",
    schedule: "Thứ 4 (15:00-17:00)",
    room: "D1-203",
    category: "Đại cương",
    description: "Tiếng Anh chuyên ngành CNTT và kỹ năng giao tiếp",
    maxStudents: 40,
    enrolled: 32,
    difficulty: "Beginner",
    duration: "15 tuần",
    thumbnail: "🗣️",
    topics: [
      { name: "Technical Vocabulary", description: "Từ vựng chuyên ngành" },
      { name: "Reading Skills", description: "Kỹ năng đọc hiểu" },
      { name: "Writing Skills", description: "Kỹ năng viết" },
      { name: "Presentation Skills", description: "Kỹ năng thuyết trình" },
      { name: "TOEIC Preparation", description: "Luyện thi TOEIC" }
    ]
  },
  {
    id: 6,
    name: "Lập trình Hướng đối tượng",
    code: "IT2030",
    instructor: "TS. Đỗ Văn F",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 3, 6 (7:00-9:30)",
    room: "D3-201",
    category: "Chuyên ngành bắt buộc",
    description: "Lập trình OOP với Java",
    maxStudents: 50,
    enrolled: 41,
    difficulty: "Intermediate",
    duration: "15 tuần",
    thumbnail: "☕",
    topics: [
      { name: "OOP Concepts", description: "Khái niệm OOP" },
      { name: "Java Basics", description: "Java cơ bản" },
      { name: "Inheritance & Polymorphism", description: "Kế thừa và đa hình" },
      { name: "Design Patterns", description: "Các mẫu thiết kế" },
      { name: "GUI Programming", description: "Lập trình giao diện" }
    ]
  },
  {
    id: 7,
    name: "Trí tuệ Nhân tạo",
    code: "IT4050",
    instructor: "PGS.TS. Nguyễn Thị G",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 5 (13:00-16:00)",
    room: "D7-501",
    category: "Chuyên ngành tự chọn",
    description: "Các thuật toán AI, Machine Learning cơ bản",
    maxStudents: 40,
    enrolled: 28,
    difficulty: "Advanced",
    duration: "15 tuần",
    thumbnail: "🤖",
    topics: [
      { name: "AI Fundamentals", description: "Nền tảng AI" },
      { name: "Machine Learning", description: "Học máy cơ bản" },
      { name: "Neural Networks", description: "Mạng nơ-ron" },
      { name: "Deep Learning", description: "Học sâu" },
      { name: "AI Applications", description: "Ứng dụng AI" }
    ]
  },
  {
    id: 8,
    name: "Phát triển Ứng dụng Mobile",
    code: "IT4060",
    instructor: "TS. Vũ Văn H",
    credits: 3,
    semester: "HK2 2024-2025",
    schedule: "Thứ 2, 5 (15:00-17:30)",
    room: "D5-203",
    category: "Chuyên ngành tự chọn",
    description: "Phát triển ứng dụng di động với React Native",
    maxStudents: 35,
    enrolled: 25,
    difficulty: "Intermediate",
    duration: "15 tuần",
    thumbnail: "📱",
    topics: [
      { name: "Mobile Development Basics", description: "Cơ bản phát triển mobile" },
      { name: "React Native", description: "Framework React Native" },
      { name: "UI/UX Mobile", description: "Thiết kế giao diện mobile" },
      { name: "API Integration", description: "Tích hợp API" },
      { name: "Publishing Apps", description: "Xuất bản ứng dụng" }
    ]
  }
];

