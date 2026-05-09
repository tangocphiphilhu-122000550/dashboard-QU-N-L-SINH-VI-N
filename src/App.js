import React, { useEffect, useMemo, useState } from 'react';
import HeaderNew from './components/HeaderNew';
import OverdueWatcher from './components/OverdueWatcher';
import SidebarNew from './components/SidebarNew';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import Login from './pages/Login';
import { courseCatalog, courseExerciseCatalog, feedbackHistory, feedbackSummary, softSkillCards, softSkillEvidence } from './data/trainingMockData';
import {
  clearAuthSession,
  fetchCurrentUser,
  getStoredAccessToken,
  getStoredUser,
  logoutCurrentSession,
  persistAuthUser,
  sendActivityHeartbeat,
} from './auth';
import {
  setStoredPreferredExerciseId,
  setStoredPreferredStageLevel,
  setStoredSelectedCourseId,
} from './trainingSelection';

const pageMeta = {
  dashboard: {
    title: 'Tổng quan rèn luyện',
    subtitle: 'Theo dõi năng lực hiện tại, bài nên làm hôm nay và tiến độ mục tiêu cá nhân.',
  },
  courses: {
    title: 'Khóa học',
    subtitle: '',
  },
  exercises: {
    title: 'Bài tập',
    subtitle: '',
  },
  feedback: {
    title: 'Lỗi & Phản hồi',
    subtitle: '',
  },
  skills: {
    title: 'Kỹ năng mềm',
    subtitle: '',
  },
  profile: {
    title: 'Hồ sơ rèn luyện',
    subtitle: 'Tổng hợp mục tiêu, tiến độ, thành tích và các vùng tích hợp dữ liệu sau này.',
  },
};

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function App() {
  const heartbeatIntervalMs = 10 * 1000;
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState('expanded');
  const [authUser, setAuthUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(() => Boolean(getStoredAccessToken()));

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      const token = getStoredAccessToken();

      if (!token) {
        if (isMounted) {
          setAuthUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const user = await fetchCurrentUser(token);
        if (!isMounted) {
          return;
        }

        setAuthUser(user);
        if (user) {
          persistAuthUser(user);
        }
        setAuthLoading(false);
      } catch (error) {
        clearAuthSession();
        if (isMounted) {
          setAuthUser(null);
          setAuthLoading(false);
        }
      }
    };

    syncCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      return undefined;
    }

    let isCancelled = false;

    const isTabVisible = () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden';

    const runHeartbeat = async () => {
      if (!isTabVisible()) {
        return;
      }

      const token = getStoredAccessToken();

      if (!token) {
        return;
      }

      try {
        await sendActivityHeartbeat(token);
      } catch (error) {
        if (!isCancelled) {
          console.warn('Activity heartbeat failed:', error.message);
        }
      }
    };

    runHeartbeat();
    const intervalId = window.setInterval(runHeartbeat, heartbeatIntervalMs);

    const handleVisibilityChange = () => {
      if (isTabVisible()) {
        runHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authUser, heartbeatIntervalMs]);

  const searchItems = useMemo(() => {
    const pageItems = [
      {
        id: 'page-dashboard',
        kind: 'Trang',
        title: 'Tổng quan rèn luyện',
        subtitle: 'Đi tới trang tổng quan',
        pageId: 'dashboard',
        searchValue: normalizeSearchText('Tổng quan rèn luyện dashboard trang chủ home tiến độ'),
      },
      {
        id: 'page-courses',
        kind: 'Trang',
        title: 'Khóa học',
        subtitle: 'Xem và chọn môn học',
        pageId: 'courses',
        searchValue: normalizeSearchText('Khóa học môn học lộ trình đăng ký'),
      },
      {
        id: 'page-exercises',
        kind: 'Trang',
        title: 'Bài tập',
        subtitle: 'Danh sách bài luyện và bài kiểm tra',
        pageId: 'exercises',
        searchValue: normalizeSearchText('Bài tập bài luyện bài kiểm tra exercise practice'),
      },
      {
        id: 'page-feedback',
        kind: 'Trang',
        title: 'Lỗi & Phản hồi',
        subtitle: 'Xem lỗi đã gặp và gợi ý cải thiện',
        pageId: 'feedback',
        searchValue: normalizeSearchText('Lỗi phản hồi feedback bug log lỗi cải thiện'),
      },
      {
        id: 'page-skills',
        kind: 'Trang',
        title: 'Kỹ năng mềm',
        subtitle: 'Theo dõi kỹ năng mềm tích lũy',
        pageId: 'skills',
        searchValue: normalizeSearchText('Kỹ năng mềm soft skill giao tiếp hợp tác'),
      },
      {
        id: 'page-profile',
        kind: 'Trang',
        title: 'Hồ sơ',
        subtitle: 'Thông tin cá nhân và tiến độ học',
        pageId: 'profile',
        searchValue: normalizeSearchText('Hồ sơ cá nhân profile tài khoản lớp mssv'),
      },
    ];

    const courseItems = courseCatalog.map((course) => ({
      id: `course-${course.id}`,
      kind: 'Môn học',
      title: course.name,
      subtitle: `${course.code} • ${course.focus.slice(0, 2).join(' • ')}`,
      pageId: 'courses',
      courseId: course.id,
      searchValue: normalizeSearchText(
        `${course.name} ${course.code} ${course.subtitle} ${course.focus.join(' ')} ${course.difficulty}`
      ),
    }));

    const exerciseItems = Object.values(courseExerciseCatalog)
      .flat()
      .map((exercise) => {
        const course = courseCatalog.find((item) => item.id === exercise.courseId);
        return {
          id: `exercise-${exercise.id}`,
          kind: exercise.type === 'assessment' ? 'Bài kiểm tra' : 'Bài tập',
          title: exercise.title,
          subtitle: `${course?.name || 'Môn học'} • Cấp ${exercise.stageLevel} • ${exercise.status}`,
          pageId: 'exercises',
          courseId: exercise.courseId,
          stageLevel: exercise.stageLevel,
          exerciseId: exercise.id,
          searchValue: normalizeSearchText(
            `${exercise.title} ${exercise.objective} ${exercise.level} ${exercise.status} ${exercise.difficulty} ${
              course?.name || ''
            } ${(exercise.suggestedSkills || []).join(' ')}`
          ),
        };
      });

    const feedbackItems = [
      ...feedbackSummary.map((item) => ({
        id: `feedback-summary-${item.id}`,
        kind: 'Phản hồi',
        title: item.title,
        subtitle: item.recommendation,
        pageId: 'feedback',
        searchValue: normalizeSearchText(`${item.title} ${item.recommendation} ${item.severity} feedback lỗi`),
      })),
      ...feedbackHistory.map((item) => ({
        id: `feedback-history-${item.id}`,
        kind: 'Lỗi gần đây',
        title: item.exercise,
        subtitle: `${item.errorType} • ${item.where}`,
        pageId: 'feedback',
        searchValue: normalizeSearchText(
          `${item.exercise} ${item.errorType} ${item.where} ${item.note} ${item.improvement} ${item.course}`
        ),
      })),
    ];

    const skillItems = [
      ...softSkillCards.map((item) => ({
        id: `skill-card-${item.id}`,
        kind: 'Kỹ năng',
        title: item.title,
        subtitle: item.description,
        pageId: 'skills',
        searchValue: normalizeSearchText(`${item.title} ${item.description} kỹ năng mềm`),
      })),
      ...softSkillEvidence.map((item, index) => ({
        id: `skill-evidence-${index}`,
        kind: 'Kỹ năng',
        title: item,
        subtitle: 'Gợi ý từ trang kỹ năng mềm',
        pageId: 'skills',
        searchValue: normalizeSearchText(`${item} kỹ năng mềm`),
      })),
    ];

    return [...pageItems, ...courseItems, ...exerciseItems, ...feedbackItems, ...skillItems];
  }, []);

  const handleSearchSelect = (item) => {
    if (!item) return;

    if (item.pageId === 'courses' && item.courseId) {
      setStoredSelectedCourseId(item.courseId);
      setStoredPreferredStageLevel('');
      setStoredPreferredExerciseId('');
      setCurrentPage('courses');
      return;
    }

    if (item.pageId === 'exercises' && item.courseId) {
      setStoredSelectedCourseId(item.courseId);
      setStoredPreferredStageLevel(item.stageLevel || '');
      setStoredPreferredExerciseId(item.exerciseId || '');
      setCurrentPage('exercises');
      return;
    }

    setCurrentPage(item.pageId || 'dashboard');
  };

  const handleLogout = async () => {
    const token = getStoredAccessToken();

    try {
      await logoutCurrentSession(token);
    } catch (error) {
      // Clear local session even if backend session is already invalid.
    } finally {
      clearAuthSession();
      setAuthUser(null);
      setAuthLoading(false);
      setCurrentPage('dashboard');
    }
  };

  const handleLoginSuccess = (user) => {
    setAuthUser(user);
    setAuthLoading(false);
    setCurrentPage('dashboard');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_34%,#dceafe_100%)] px-4 text-slate-900">
        <div className="glass-panel px-8 py-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'courses':
        return <Courses setCurrentPage={setCurrentPage} />;
      case 'exercises':
        return <Exercises />;
      case 'feedback':
        return <Feedback />;
      case 'skills':
        return <Skills />;
      case 'profile':
        return <Profile authUser={authUser} />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_34%,#dceafe_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute right-[-140px] top-24 h-96 w-96 rounded-full bg-cyan-300/26 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.74),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.14),rgba(191,219,254,0.12))]" />
      </div>

      <SidebarNew
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        mode={sidebarMode}
        onModeChange={setSidebarMode}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderNew
          onMenuClick={() => setSidebarOpen(true)}
          currentPage={pageMeta[currentPage]}
          authUser={authUser}
          onLogout={handleLogout}
          onProfileClick={() => setCurrentPage('profile')}
          searchItems={searchItems}
          onSearchSelect={handleSearchSelect}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 pt-2 sm:px-5">
          <div className="mx-auto max-w-7xl">{renderPage()}</div>
        </main>
      </div>

      <OverdueWatcher authUser={authUser} />
    </div>
  );
}

export default App;
